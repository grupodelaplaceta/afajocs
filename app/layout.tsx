import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { FloatingJic } from "@/components/FloatingJic";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap"
});

export const metadata: Metadata = {
  title: "AFAJICS",
  description: "Plataforma educativa gamificada de Jics para primaria"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={outfit.variable}>
      <body>
        {children}
        <FloatingJic />
      </body>
    </html>
  );
}
