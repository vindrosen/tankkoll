import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TankKoll",
  description: "Håll koll på din bränsleförbrukning",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sv" data-theme="dark">
      <body>{children}</body>
    </html>
  );
}
