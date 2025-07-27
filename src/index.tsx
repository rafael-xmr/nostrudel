import "./polyfill";

import { CAP_IS_WEB, IS_SERVICE_WORKER_SUPPORTED } from "./env";
import { LocalSettingsProviders } from "./providers/global";
import { registerServiceWorker } from "./services/worker";

// setup dayjs
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import relativeTimePlugin from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTimePlugin);
dayjs.extend(localizedFormat);

import { scan } from "react-scan";
scan({ enabled: true });

// register nostr: protocol handler
if (import.meta.env.PROD && CAP_IS_WEB) {
	try {
		navigator.registerProtocolHandler(
			"web+nostr",
			new URL("/l/%s", location.origin).toString(),
		);
	} catch (_) {
		console.log("Failed to register handler");
	}
}

// mount react app
import { createRoot } from "react-dom/client";
import { App } from "./app";
import { logger } from "./helpers/debug";

logger("Rendering app");
const root = document.getElementById("root")!;
createRoot(root).render(
	<LocalSettingsProviders>
		<App />
	</LocalSettingsProviders>,
);

// Register service worker if supported
if (IS_SERVICE_WORKER_SUPPORTED) registerServiceWorker();
