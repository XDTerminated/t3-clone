import "katex/dist/katex.min.css";
import "~/styles/globals.css";

import { type Metadata } from "next";
import { Montserrat } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { SidebarProvider } from "~/components/ui/sidebar";
import ContentWrapper from "~/components/content-wrapper";
import { DataProvider } from "~/contexts/DataContext";
import { ChatProvider } from "~/contexts/ChatContext";
import { ModelProvider } from "~/contexts/ModelContext";
import { ApiKeyProvider } from "~/contexts/ApiKeyContext";
import { CustomizationProvider } from "~/contexts/CustomizationContext";
import { ThemeProvider } from "~/contexts/ThemeContext";
import { ToastProvider } from "~/components/toast";

export const metadata: Metadata = {
  title: "LeemerChat",
  description:
    "LeemerChat unifies your favorite AI models in one flexible workspace designed to keep up with the way you think.",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: [{ url: "/favicon.ico" }],
  },
};

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "hsl(var(--primary))",
        },
      }}
    >
      <html lang="en" className="dark theme-red">
        <head>
          <link rel="preconnect" href="https://clerk.accounts.dev" />
          <link rel="preconnect" href="https://api.clerk.dev" />
        </head>
        <body
          className={`${montserrat.variable} text-foreground bg-background min-h-screen dark:bg-[radial-gradient(ellipse_at_center,var(--background)_20%,oklch(0.18_0.015_25)_100%)]`}
        >
          <ThemeProvider>
            <SidebarProvider>
              <DataProvider>
                <ApiKeyProvider>
                  <CustomizationProvider>
                    <ModelProvider>
                      <ToastProvider>
                        <ChatProvider>
                          <ContentWrapper>{children}</ContentWrapper>
                        </ChatProvider>
                      </ToastProvider>
                    </ModelProvider>
                  </CustomizationProvider>
                </ApiKeyProvider>
              </DataProvider>
            </SidebarProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
