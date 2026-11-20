import type { Metadata } from "next";
import "@fontsource-variable/manrope";
import "@fontsource/big-shoulders-display/700";
import "@fontsource/big-shoulders-display/800";
import "./globals.css";

export const metadata: Metadata = {
  title: "Coltan Exchange (demo) | Plerosis",
  description:
    "Demo of a neutral, invite-only exchange for tantalum ore. All data is invented.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="demo-bar" role="note">
          Demo data. Every lot, name, number and price on this site is invented.
        </div>
        <header className="top">
          <a className="wordmark" href="/">
            Plerosis
          </a>
          <span className="product">Coltan Exchange</span>
        </header>
        <main className="page">{children}</main>
        <footer className="foot">
          <p>Prepared by Plerosis with AI assistance</p>
          <p>Demo only. Not an offer to trade.</p>
        </footer>
      </body>
    </html>
  );
}
