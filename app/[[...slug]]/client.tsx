"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";

import "../../src/classes/nostr-connect-connection";
import "../../src/services/user-event-sync";
import "../../src/services/username-search";
import "../../src/services/debug-api";

// Configure Day.js
import dayjs from "dayjs";
import relativeTimePlugin from "dayjs/plugin/relativeTime";
import localizedFormat from "dayjs/plugin/localizedFormat";

dayjs.extend(relativeTimePlugin);
dayjs.extend(localizedFormat);

(window as any).global = window;
(window as any).dayjs = dayjs;

const App = dynamic(() => import("../../src/app").then((mod) => mod.App), {
	ssr: false,
});

export function ClientOnly() {
	useEffect(() => {
		// Set up unload event listener
		const handleUnload = () => {
			const config = localStorage.getItem("bc:config");
			if (config && JSON.parse(config).connectorType === "extension.generic") {
				localStorage.removeItem("bc:config");
			}
		};
		window.addEventListener("unload", handleUnload);

		// Register web+nostr protocol handler
		if (process.env.NEXT_PUBLIC_PROD) {
			try {
				navigator.registerProtocolHandler(
					"web+nostr",
					new URL("/l/%s", location.origin).toString(),
				);
			} catch (e) {
				console.log("Failed to register handler");
				console.log(e);
			}
		}

		// Cleanup event listener on unmount
		return () => {
			window.removeEventListener("unload", handleUnload);
		};
	}, []);

	return <App />;
}
