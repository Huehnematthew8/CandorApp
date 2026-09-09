import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Candor | Apply with intention",
  description: "Organise thoughtful applications, evidence and follow-through.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-AU" className="h-full antialiased">

      <body className="min-h-screen" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
