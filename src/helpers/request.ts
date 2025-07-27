import { EMPTY, switchMap } from "rxjs";
import { AppSettingsQuery } from "../models";
import type { AppSettings } from "./app-settings";
import { convertToUrl } from "./url";

// Import management types
import type { AccountsManagement } from "../services/accounts";
import type { EventStoreManagement } from "../services/event-store";
import type { LoadersManagement } from "~/services/loaders";

export interface RequestProxyManagement {
	createRequestProxyUrl: (url: URL | string, corsProxy?: string) => string;
	fetchWithProxy: (url: URL | string, opts?: RequestInit) => Promise<Response>;
}

export default function createRequestProxyManagement(
	accountsManagement: AccountsManagement,
	eventStoreManagement: EventStoreManagement,
	loadersManagement: LoadersManagement,
): RequestProxyManagement {
	const { accounts } = accountsManagement;
	const { eventStore } = eventStoreManagement;

	// Track app settings
	let settings: AppSettings | undefined;
	accounts.active$
		.pipe(
			switchMap((account) =>
				account
					? eventStore.model(
							AppSettingsQuery,
							account.pubkey,
							eventStoreManagement,
							loadersManagement,
						)
					: EMPTY,
			),
		)
		.subscribe((v) => {
			settings = v;
		});

	const clearNetFailedHosts = new Set<string>();
	const proxyFailedHosts = new Set<string>();

	function createRequestProxyUrl(
		url: URL | string,
		corsProxy?: string,
	): string {
		if (!corsProxy && window.REQUEST_PROXY)
			corsProxy = new URL(window.REQUEST_PROXY, location.origin).toString();
		if (!corsProxy && settings?.corsProxy) corsProxy = settings.corsProxy;
		if (!corsProxy) return url.toString();

		if (corsProxy.includes("<url>")) {
			return corsProxy.replace("<url>", `${url}`);
		} else if (corsProxy.includes("<encoded_url>")) {
			return corsProxy.replace("<encoded_url>", encodeURIComponent(`${url}`));
		} else {
			return corsProxy.endsWith("/")
				? `${corsProxy}${url}`
				: `${corsProxy}/${url}`;
		}
	}

	async function fetchWithProxy(
		url: URL | string,
		opts?: RequestInit,
	): Promise<Response> {
		if (!settings?.corsProxy && !window.REQUEST_PROXY) return fetch(url, opts);

		const u = typeof url === "string" ? convertToUrl(url) : url;

		// if its an onion domain try the request proxy first
		if (
			(u.host.endsWith(".onion") || u.host.endsWith(".i2p")) &&
			!proxyFailedHosts.has(u.host)
		) {
			return fetch(createRequestProxyUrl(url), opts).catch((e) => {
				proxyFailedHosts.add(u.host);
				return fetch(url, opts);
			});
		}

		// if the clear net request has failed. use the proxy
		if (clearNetFailedHosts.has(u.host)) {
			return fetch(createRequestProxyUrl(url), opts);
		}

		// try clear net first and fallback to request proxy
		return fetch(url, opts).catch((e) => {
			clearNetFailedHosts.add(u.host);
			return fetch(createRequestProxyUrl(url), opts);
		});
	}

	return {
		createRequestProxyUrl,
		fetchWithProxy,
	};
}
