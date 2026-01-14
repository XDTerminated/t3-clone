import "katex/dist/katex.min.css";
import "~/styles/globals.css";

import { type Metadata } from "next";
import { Montserrat } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { SidebarProvider } from "~/components/ui/sidebar";
import ContentWrapper from "~/components/content-wrapper";
import { ChatProvider } from "~/contexts/ChatContext";
import { ModelProvider } from "~/contexts/ModelContext";
import { ApiKeyProvider } from "~/contexts/ApiKeyContext";
import { ThemeProvider } from "~/contexts/ThemeContext";
import { ToastProvider } from "~/components/toast";

export const metadata: Metadata = {
  title: "T3 Chat",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
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
              <ApiKeyProvider>
                <ModelProvider>
                  <ToastProvider>
                    <ChatProvider>
                      <ContentWrapper>{children}</ContentWrapper>
                    </ChatProvider>
                  </ToastProvider>
                </ModelProvider>
              </ApiKeyProvider>
            </SidebarProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
