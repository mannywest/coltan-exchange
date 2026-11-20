// Browser-only entry for the hosted preview (a single HTML file with hash routing).
// The real app is the Next.js project; this reuses the same LotView component.
import { createRoot } from "react-dom/client";
import { useEffect, useState, type CSSProperties } from "react";
import LotView from "@/components/LotView";
import { lots, getLot } from "@/data/lots";
import { computeGrade } from "@/lib/grade";

const COLOUR = {
  A: "var(--verified)",
  B: "var(--amber)",
  C: "var(--copper)",
  Blocked: "var(--blocked)",
} as const;

function useHash() {
  const [hash, setHash] = useState(() => window.location.hash.slice(1));
  useEffect(() => {
    const onChange = () => {
      setHash(window.location.hash.slice(1));
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return hash;
}

function LotList() {
  return (
    <section className="pick">
      <h1>Lots on the exchange</h1>
      <p>Four demo lots, one for each Trust Grade. Open one to see its certificate.</p>
      <ul>
        {lots.map((l) => {
          const g = computeGrade(l);
          return (
            <li key={l.slug} style={{ "--grade": COLOUR[g.grade] } as CSSProperties}>
              <a href={`#${l.slug}`}>
                <span className={`pick-grade${g.grade === "Blocked" ? " is-word" : ""}`}>
                  {g.grade}
                </span>
                <span className="pick-main">
                  <strong>Lot {l.number}</strong>
                  <span>
                    {l.tonnes} tonnes, {l.basisTa2O5}% Ta2O5 basis, {l.incoterm}
                  </span>
                </span>
                <span className="pick-price">USD {l.priceUsdPerLb} per lb</span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function App() {
  const hash = useHash();
  const lot = getLot(hash);
  return (
    <>
      <div className="demo-bar" role="note">
        Demo data. Every lot, name, number and price on this site is invented.
      </div>
      <header className="top">
        <a className="wordmark" href="#all-lots">
          Plerosis
        </a>
        <span className="product">Coltan Exchange</span>
      </header>
      <main className="page">
        {lot ? <LotView lot={lot} homeHref="#all-lots" /> : <LotList />}
      </main>
      <footer className="foot">
        <p>Prepared by Plerosis with AI assistance</p>
        <p>Demo only. Not an offer to trade.</p>
      </footer>
    </>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
