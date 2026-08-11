import type { Metadata } from "next";
import { Press_Start_2P, Inter } from "next/font/google";
import "./globals.css";
import { RegisterServiceWorker } from "./register-sw";
import { TabBar } from "@/components/tab-bar";
import { ActiveGameChip } from "@/components/active-game-chip";
import { AppGate } from "@/components/app-gate";
import { SiteGate } from "@/components/site-gate";
import { VersionBanner } from "@/components/version-banner";
import { FeedbackButton } from "@/components/feedback-button";

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
      <body className="min-h-full flex flex-col pb-32">
        <div className="scanlines" />
        <RegisterServiceWorker />
        <SiteGate>
          <AppGate>
            <VersionBanner
              sha={process.env.VERCEL_GIT_COMMIT_SHA}
              message={process.env.VERCEL_GIT_COMMIT_MESSAGE}
              repoOwner={process.env.VERCEL_GIT_REPO_OWNER}
              repoSlug={process.env.VERCEL_GIT_REPO_SLUG}
            />
            {children}
            <ActiveGameChip />
            <TabBar />
            <FeedbackButton />
          </AppGate>
        </SiteGate>
      </body>
    </html>
  );
}
