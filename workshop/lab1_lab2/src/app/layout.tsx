import type { Metadata } from "next";
import "./globals.css";
import "highlight.js/styles/github.css";

export const metadata: Metadata = {
  title: "Cesium AI — Lab 1 & 2",
  description: "Cesium AI Agentic Workflows — Workshop Lab 1 & 2",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-screen flex-col font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
