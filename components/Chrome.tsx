import type { ReactNode } from "react";
import type { Routes } from "@/lib/routes";
import { LangProvider, RoleProvider } from "./I18n";
import Frame from "./Frame";
import AccessGate from "./AccessGate";

// Shared page frame: demo notice, header, language switch, footer.
// Used by the Next layout and the hosted preview.
export default function Chrome({ routes, children }: { routes: Routes; children: ReactNode }) {
  return (
    <LangProvider>
      <RoleProvider>
        <AccessGate>
          <Frame routes={routes}>{children}</Frame>
        </AccessGate>
      </RoleProvider>
    </LangProvider>
  );
}
