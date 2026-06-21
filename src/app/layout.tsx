import type { Metadata } from "next";
import {
  Bagel_Fat_One,
  Baloo_2,
  Mochiy_Pop_One,
  Space_Mono,
} from "next/font/google";
import "./globals.css";

const bagel = Bagel_Fat_One({
  variable: "--font-bagel",
  subsets: ["latin"],
  weight: "400",
});

const mochiy = Mochiy_Pop_One({
  variable: "--font-mochiy",
  subsets: ["latin"],
  weight: "400",
});

const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const space = Space_Mono({
  variable: "--font-space",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "weirdnxc - stay weird",
  description:
    "Weird NXC label site with ACT releases, roster credits, full playlists, and booking contact.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bagel.variable} ${mochiy.variable} ${baloo.variable} ${space.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
