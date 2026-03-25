import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import "../styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nutrik",
  description: "Nutrik by Kaká",
  manifest: "/manifest.webmanifest",
  themeColor: "#226E48",
  appleWebApp: {
    capable: true,
    title: "Nutrik",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/images/nutrik-logo.png",
    apple: "/images/nutrik-logo.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}

