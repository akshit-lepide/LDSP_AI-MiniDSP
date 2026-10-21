import type { Metadata } from "next";
import Script from "next/script";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lepide MiniDSP | Data Discovery & Classification",
  description: "Training workspace for synthetic data discovery and classification.",
  icons: { icon: "/brand/lepide-mark.svg" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-theme="light">
      <head>
        <link rel="stylesheet" href="https://lepide-design-system.vercel.app/v1/lepidus.css" />
      </head>
      <body>
        <Providers>{children}</Providers>
        <Script src="https://lepide-design-system.vercel.app/v1/lepidus.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
