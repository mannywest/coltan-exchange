import type { ReactNode } from "react";
import type { Routes } from "@/lib/routes";

// Shared page frame: demo notice, header, footer. Used by the Next layout and the hosted preview.
export default function Chrome({ routes, children }: { routes: Routes; children: ReactNode }) {
  return (
    <>
      <div className="demo-bar" role="note">
        Demo data. Every lot, name, number and price on this site is invented.
      </div>
      <header className="top">
        <a className="wordmark" href={routes.lots}>
          Plerosis
        </a>
        <span className="product">Coltan Exchange</span>
        <nav className="topnav" aria-label="Main">
          <a href={routes.lots}>Lots</a>
          <a href={routes.review}>Reviewer desk</a>
        </nav>
      </header>
      <main className="page">{children}</main>
      <footer className="foot">
        <p>Prepared by Plerosis with AI assistance</p>
        <p>Demo only. Not an offer to trade.</p>
      </footer>
    </>
  );
}
