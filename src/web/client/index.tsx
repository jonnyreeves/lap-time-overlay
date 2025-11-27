import { Global } from "@emotion/react";
import React, { Suspense } from "react";
import { createRoot } from "react-dom/client";
import { RelayEnvironmentProvider } from "react-relay";
import { App } from "./App.js";
import { createRelayEnvironment } from "./relayEnvironment.js";
import { globalStyles } from "./styles/global.js";

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element not found");
}

const environment = createRelayEnvironment();

createRoot(container).render(
  <>
    <Global styles={globalStyles} />
    <RelayEnvironmentProvider environment={environment}>
      <Suspense fallback={<div className="card">Loading…</div>}>
        <App />
      </Suspense>
    </RelayEnvironmentProvider>
  </>
);
