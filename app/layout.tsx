import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Centaur 3D Architecture",
  description: "Interactive 3D visualization of Centaur's distributed agent architecture",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
