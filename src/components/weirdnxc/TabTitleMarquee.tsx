"use client";

import { useEffect } from "react";

const titleText = "💖 weirdnxc - stay weird ✨🌈🎧 ";

export default function TabTitleMarquee() {
  useEffect(() => {
    const frames = Array.from({ length: titleText.length }, (_, index) => {
      return titleText.slice(index) + titleText.slice(0, index);
    });
    let frame = 0;

    document.title = titleText.trim();

    const ticker = window.setInterval(() => {
      document.title = frames[frame % frames.length].trim();
      frame += 1;
    }, 420);

    return () => {
      window.clearInterval(ticker);
      document.title = "weirdnxc - stay weird";
    };
  }, []);

  return null;
}
