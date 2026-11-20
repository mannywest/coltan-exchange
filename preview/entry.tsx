// Browser-only entry for the hosted preview (a single HTML file with hash routing).
// The real app is the Next.js project; this reuses the same components.
//   (empty) or #home home   #all-lots listing        #review         reviewer desk
//   #lot-0417              lot detail     #check-lot-0417 trust check
//   #deal-lot-0417 deal    #sell  #onboarding  #registry
import { createRoot } from "react-dom/client";
import { useEffect, useState } from "react";
import Chrome from "@/components/Chrome";
import LotView from "@/components/LotView";
import LotListing from "@/components/LotListing";
import TrustCheck from "@/components/TrustCheck";
import ReviewDesk from "@/components/ReviewDesk";
import SellForm from "@/components/SellForm";
import DealTracker from "@/components/DealTracker";
import Onboarding from "@/components/Onboarding";
import MineRegistry from "@/components/MineRegistry";
import Home from "@/components/Home";
import RoleGate from "@/components/RoleGate";
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
  if (hash === "" || hash === "home") return <Home routes={hashRoutes} />;
  if (hash === "review")
    return (
      <RoleGate need="reviewer">
        <ReviewDesk lots={lots} routes={hashRoutes} />
      </RoleGate>
    );
  if (hash === "sell")
    return (
      <RoleGate need="seller">
        <SellForm routes={hashRoutes} />
      </RoleGate>
    );
  if (hash === "onboarding") return <Onboarding />;
  if (hash === "registry")
    return (
      <RoleGate need="reviewer">
        <MineRegistry routes={hashRoutes} />
      </RoleGate>
    );
  if (hash.startsWith("deal-")) {
    const d = getLot(hash.slice(5));
    if (d) return <DealTracker lot={d} routes={hashRoutes} />;
  }
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
