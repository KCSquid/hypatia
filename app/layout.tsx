"use client";

import React, { useEffect } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { MathfieldElement } from "mathlive";
import "./globals.css";

const sansFont = Geist({
  subsets: ["latin"],
  variable: "--font-csans",
});

const monoFont = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-cmono",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      MathfieldElement.fontsDirectory =
        "https://unpkg.com/mathlive@0.109.2/fonts/";
    }
  }, []);

  return (
    <html lang="en" className={`${sansFont.variable} ${monoFont.variable}`}>
      <body className="antialiased font-sans">{children}</body>
    </html>
  );
}
