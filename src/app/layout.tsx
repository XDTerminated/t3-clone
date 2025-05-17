import "~/styles/globals.css";

import { type Metadata } from "next";
import { Roboto } from "next/font/google";
import { SidebarProvider } from "~/components/ui/sidebar";
import ContentWrapper from "~/components/content-wrapper";

export const metadata: Metadata = {
  title: "Anygraph",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const roboto = Roboto({
  subsets: ["latin"],
  variable: "--font-roboto",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${roboto.className} text-foreground min-h-screen bg-[radial-gradient(ellipse_at_center,var(--background)_20%,oklch(0.235_0.017_290)_100%)]`}
      >
        <SidebarProvider>
          <ContentWrapper>{children}</ContentWrapper>
        </SidebarProvider>
      </body>
    </html>
  );
}
