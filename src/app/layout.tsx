import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import React from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Name The Songs",
  description: "A Website to test your Knowledge on certain Albums.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex min-h-full flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-100">
            <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
              Name the Songs
            </h2>
            <Analytics />
            {children}
        </div>
      </body>
    </html>
  );
}
