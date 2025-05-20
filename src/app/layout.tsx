import "katex/dist/katex.min.css";
import "~/styles/globals.css";

import { type Metadata } from "next";
import { Quicksand } from "next/font/google";
import { SidebarProvider } from "~/components/ui/sidebar";
import ContentWrapper from "~/components/content-wrapper";
import FileUploadModal from "~/components/file-upload-modal";
import DataViewModal from "~/components/data-view-modal";
import { DataProvider } from "~/contexts/DataContext";

export const metadata: Metadata = {
  title: "Anygraph",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-quicksand",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>{/* Removed Adobe Fonts embed code placeholder */}</head>
      <body
        className={`${quicksand.variable} text-foreground min-h-screen bg-[radial-gradient(ellipse_at_center,var(--background)_20%,oklch(0.235_0.017_290)_100%)]`}
      >
        <SidebarProvider>
          <DataProvider>
            <FileUploadModal />
            <ContentWrapper>{children}</ContentWrapper>
            <DataViewModal />
          </DataProvider>
        </SidebarProvider>
      </body>
    </html>
  );
}
