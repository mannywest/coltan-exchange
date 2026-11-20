import type { Metadata } from "next";
import "@fontsource-variable/manrope";
import "@fontsource/big-shoulders-display/700";
import "@fontsource/big-shoulders-display/800";
import "./globals.css";
import Chrome from "@/components/Chrome";
import { nextRoutes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Coltan Exchange (demo) | Plerosis",
  description:
    "Demo of a neutral, invite-only exchange for tantalum ore. All data is invented.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Chrome routes={nextRoutes}>{children}</Chrome>
      </body>
    </html>
  );
}
