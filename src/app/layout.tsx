import type { Metadata } from "next";
import "./globals.css";
import { RegisterServiceWorker } from "./register-sw";
import { TabBar } from "@/components/tab-bar";

export const metadata: Metadata = {
  title: "iMessage Brackets",
  description: "Bracket-style tournaments for iMessage games",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col pb-16">
        <RegisterServiceWorker />
        {children}
        <TabBar />
      </body>
    </html>
  );
}
