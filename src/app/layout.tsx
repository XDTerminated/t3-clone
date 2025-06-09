import "katex/dist/katex.min.css";
import "~/styles/globals.css";

import { type Metadata } from "next";
import { Montserrat } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { SidebarProvider } from "~/components/ui/sidebar";
import ContentWrapper from "~/components/content-wrapper";
import { DataProvider } from "~/contexts/DataContext";

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
    <ClerkProvider>
      <html lang="en" className="dark">
        <head>{/* Removed Adobe Fonts embed code placeholder */}</head>
        <body
          className={`${montserrat.variable} text-foreground min-h-screen bg-[radial-gradient(ellipse_at_center,var(--background)_20%,oklch(0.235_0.017_290)_100%)]`}
        >
          <SidebarProvider>
            <DataProvider>
              <ContentWrapper>{children}</ContentWrapper>
            </DataProvider>
          </SidebarProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
