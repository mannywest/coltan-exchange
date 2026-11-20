// Browser-only entry for the hosted preview (a single HTML file with hash routing).
// The real app is the Next.js project; this reuses the same components.
//   #all-lots (or empty)   listing        #review         reviewer desk
//   #lot-0417              lot detail     #check-lot-0417 trust check
import { createRoot } from "react-dom/client";
import { useEffect, useState } from "react";
import Chrome from "@/components/Chrome";
import LotView from "@/components/LotView";
import LotListing from "@/components/LotListing";
import TrustCheck from "@/components/TrustCheck";
import ReviewDesk from "@/components/ReviewDesk";
import { lots, getLot } from "@/data/lots";
import { hashRoutes } from "@/lib/routes";

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

function Screen({ hash }: { hash: string }) {
  if (hash === "review") return <ReviewDesk lots={lots} routes={hashRoutes} />;
  if (hash.startsWith("check-")) {
    const l = getLot(hash.slice(6));
    if (l) return <TrustCheck lot={l} routes={hashRoutes} />;
  }
  const lot = getLot(hash);
  if (lot) return <LotView lot={lot} routes={hashRoutes} />;
  return <LotListing lots={lots} routes={hashRoutes} />;
}

function App() {
  const hash = useHash();
  return (
    <Chrome routes={hashRoutes}>
      <Screen hash={hash} />
    </Chrome>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
