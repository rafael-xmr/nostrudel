"use client";

import dayjs from "dayjs";
import relativeTimePlugin from "dayjs/plugin/relativeTime";
import localizedFormat from "dayjs/plugin/localizedFormat";

import { useEffect, type ReactNode } from "react";
import { localStorageWrapper } from "../src/utils/localStorage";

// Configure Day.js
dayjs.extend(relativeTimePlugin);
dayjs.extend(localizedFormat);

(window as any).global = window;
(window as any).dayjs = dayjs;

export function ClientWrapper({ children }: { children: ReactNode }) {
	useEffect(() => {
		const handleUnload = () => {
			const config = localStorageWrapper.getItem("bc:config");
			if (config && JSON.parse(config).connectorType === "extension.generic") {
				localStorageWrapper.removeItem("bc:config");
			}
		};
		window.addEventListener("unload", handleUnload);

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

		return () => {
			window.removeEventListener("unload", handleUnload);
		};
	}, []);

	return <>{children}</>;
}
