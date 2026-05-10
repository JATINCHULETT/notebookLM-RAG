import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NotebookAI - RAG",
  description: "Chat with your documents",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
