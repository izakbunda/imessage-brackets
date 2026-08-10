import type { Metadata } from "next";
import { Press_Start_2P, Inter } from "next/font/google";
import "./globals.css";
import { RegisterServiceWorker } from "./register-sw";
import { TabBar } from "@/components/tab-bar";
import { ActiveGameChip } from "@/components/active-game-chip";

const pixelDisplay = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel-display",
});

const readableBody = Inter({
  subsets: ["latin"],
  variable: "--font-pixel-body",
});

export const metadata: Metadata = {
  title: "iMessage Brackets",
  description: "Bracket-style tournaments for iMessage games",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${pixelDisplay.variable} ${readableBody.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col pb-28">
        <div className="scanlines" />
        <RegisterServiceWorker />
        {children}
        <ActiveGameChip />
        <TabBar />
      </body>
    </html>
  );
}
