import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap"
});

export const metadata: Metadata = {
  title: "AFAJICS",
  description: "Plataforma educativa gamificada para primaria"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={outfit.variable}>
      <body>{children}</body>
    </html>
  );
}
