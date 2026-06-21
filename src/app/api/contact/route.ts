import { NextResponse } from "next/server";

export const runtime = "nodejs";

const BREVO_EMAIL_ENDPOINT = "https://api.brevo.com/v3/smtp/email";
const BREVO_CONTACT_ENDPOINT = "https://api.brevo.com/v3/contacts";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PUBLIC_SEND_ERROR = "Message could not be sent. Please try again or use the links below.";

function clean(value: unknown, max = 1000) {
  return String(value ?? "")
    .replace(/[^\S\r\n]+/g, " ")
    .trim()
    .slice(0, max);
}

function cleanLine(value: unknown, max = 1000) {
  return clean(value, max).replace(/[\r\n]+/g, " ");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function readEnv(name: string) {
  return process.env[name]?.trim() ?? "";
}

function readListId() {
  const rawListId = readEnv("BREVO_LIST_ID");
  if (!rawListId) return 0;

  const listId = Number(rawListId);
  return Number.isSafeInteger(listId) && listId > 0 ? listId : null;
}

async function postToBrevo(apiKey: string, endpoint: string, body: unknown) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  return response.ok;
}

export async function POST(request: Request) {
  let form: FormData;

  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid contact form submission." }, { status: 400 });
  }

  const name = cleanLine(form.get("name"), 140);
  const email = cleanLine(form.get("email"), 254);
  const topic = cleanLine(form.get("topic"), 120);
  const message = clean(form.get("message"), 3000);
  const honeypot = cleanLine(form.get("company"), 120);

  if (honeypot) {
    return NextResponse.json({ ok: true });
  }

  if (!name || !email || !message || !EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ ok: false, error: "Missing required contact details." }, { status: 400 });
  }

  const apiKey = readEnv("BREVO_API_KEY");
  const toEmail = readEnv("BREVO_TO_EMAIL");
  const senderEmail = readEnv("BREVO_FROM_EMAIL");
  const listId = readListId();

  if (!apiKey || !toEmail || !senderEmail || !EMAIL_PATTERN.test(toEmail) || !EMAIL_PATTERN.test(senderEmail)) {
    return NextResponse.json(
      { ok: false, error: PUBLIC_SEND_ERROR },
      { status: 503 },
    );
  }

  if (listId === null) {
    return NextResponse.json(
      { ok: false, error: PUBLIC_SEND_ERROR },
      { status: 503 },
    );
  }

  const subject = `Weird NXC: ${topic || "new contact"} from ${name}`;
  const htmlContent = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#221033">
      <h1 style="font-size:22px">New Weird NXC message</h1>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Topic:</strong> ${escapeHtml(topic || "General")}</p>
      <hr />
      <p>${escapeHtml(message).replace(/\r?\n/g, "<br />")}</p>
    </div>
  `;

  try {
    const emailSent = await postToBrevo(apiKey, BREVO_EMAIL_ENDPOINT, {
      sender: { email: senderEmail, name: "Weird NXC" },
      to: [{ email: toEmail, name: "Weird NXC" }],
      replyTo: { email, name },
      subject,
      htmlContent,
      textContent: `Name: ${name}\nEmail: ${email}\nTopic: ${topic || "General"}\n\n${message}`,
    });

    if (!emailSent) {
      return NextResponse.json({ ok: false, error: PUBLIC_SEND_ERROR }, { status: 502 });
    }
  } catch {
    return NextResponse.json({ ok: false, error: PUBLIC_SEND_ERROR }, { status: 502 });
  }

  if (listId > 0) {
    await postToBrevo(apiKey, BREVO_CONTACT_ENDPOINT, {
      email,
      attributes: { FIRSTNAME: name },
      listIds: [listId],
      updateEnabled: true,
    }).catch(() => false);
  }

  return NextResponse.json({ ok: true });
}
