"use client";

import { useEffect } from "react";

const kawaiiLoop = [
  "💖🫧🌈 weirdnxc - stay weird ✨🎧🍬",
  "🌸💿⭐ weirdnxc - stay weird 🪩💗🎀",
  "🦄⚡🍭 weirdnxc - stay weird 💫🧃🌟",
  "🎧💘🪽 weirdnxc - stay weird 🫶✨🪄",
].join("     ");

const faviconFrames = [
  { bg: "#ff4ec7", ring: "#fff4fb", face: "w", charm: "✦" },
  { bg: "#8eff34", ring: "#f9ffe8", face: "nxc", charm: "♡" },
  { bg: "#32d9ff", ring: "#effbff", face: "weird", charm: "☆" },
  { bg: "#c77dff", ring: "#fff1ff", face: "♪", charm: "✧" },
  { bg: "#ffe94a", ring: "#fffceb", face: "💖", charm: "⋆" },
  { bg: "#ff934a", ring: "#fff1e8", face: "★", charm: "nxc" },
];

function marqueeFrames(text: string) {
  return Array.from({ length: text.length }, (_, index) => {
    return text.slice(index) + text.slice(0, index);
  });
}

function faviconSvg(frame: (typeof faviconFrames)[number], index: number) {
  const tilt = index % 2 === 0 ? -8 : 8;
  const pulse = index % 3 === 0 ? 23 : 18;

  return `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <defs>
        <radialGradient id="glow" cx="30%" cy="25%" r="80%">
          <stop offset="0%" stop-color="${frame.ring}"/>
          <stop offset="48%" stop-color="${frame.bg}"/>
          <stop offset="100%" stop-color="#4b075e"/>
        </radialGradient>
        <filter id="soft">
          <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#65126f" flood-opacity=".55"/>
          <feDropShadow dx="0" dy="0" stdDeviation="2" flood-color="#ffffff" flood-opacity=".9"/>
        </filter>
      </defs>
      <rect width="64" height="64" rx="18" fill="url(#glow)"/>
      <circle cx="51" cy="12" r="${pulse}" fill="#ffffff" opacity=".23"/>
      <circle cx="12" cy="51" r="18" fill="#ffffff" opacity=".18"/>
      <g transform="rotate(${tilt} 32 32)" filter="url(#soft)">
        <text x="32" y="36" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="${
          frame.face.length > 3 ? 12 : frame.face.length > 1 ? 15 : 26
        }" font-weight="900" fill="#4b075e">${frame.face}</text>
        <text x="13" y="19" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" fill="#ffffff">${
          frame.charm
        }</text>
        <text x="51" y="52" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#ffffff">✧</text>
      </g>
    </svg>
  `)}`;
}

function setDynamicFavicon(href: string) {
  const selector = "link[data-weirdnxc-dynamic-icon='true']";
  let icon = document.head.querySelector<HTMLLinkElement>(selector);

  if (!icon) {
    icon = document.createElement("link");
    icon.rel = "icon";
    icon.type = "image/svg+xml";
    icon.sizes = "any";
    icon.dataset.weirdnxcDynamicIcon = "true";
    document.head.appendChild(icon);
  }

  icon.href = href;
}

export default function TabTitleMarquee() {
  useEffect(() => {
    const frames = marqueeFrames(`${kawaiiLoop}     `);
    let titleFrame = 0;
    let iconFrame = 0;

    document.title = frames[0].trim();
    setDynamicFavicon(faviconSvg(faviconFrames[0], 0));

    const titleTicker = window.setInterval(() => {
      document.title = frames[titleFrame % frames.length].trim();
      titleFrame += 1;
    }, 230);

    const iconTicker = window.setInterval(() => {
      const frame = faviconFrames[iconFrame % faviconFrames.length];
      setDynamicFavicon(faviconSvg(frame, iconFrame));
      iconFrame += 1;
    }, 560);

    return () => {
      window.clearInterval(titleTicker);
      window.clearInterval(iconTicker);
      document.title = "weirdnxc - stay weird";
      document
        .head
        .querySelector<HTMLLinkElement>("link[data-weirdnxc-dynamic-icon='true']")
        ?.remove();
    };
  }, []);

  return null;
}
