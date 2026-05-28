import type { Metadata } from "next";
import "./globals.css";
import "highlight.js/styles/github.css";

export const metadata: Metadata = {
  title: "Cesium AI Agentic Workflows",
  description:
    "A browser-based application combining an LLM chat assistant with a CesiumJS 3D globe viewer.",
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
