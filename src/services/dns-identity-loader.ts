import { DnsIdentityLoader } from "applesauce-loaders/loaders/dns-identity-loader";
import type { RequestProxyManagement } from "~/helpers/request";
import type { DatabaseManagement } from "./database";

export interface DnsIdentityManagement {
	dnsIdentityLoader: DnsIdentityLoader;
}

export default async function createDnsIdentityManagement(
	databaseManagement: DatabaseManagement,
	requestProxyManagement: RequestProxyManagement,
): Promise<DnsIdentityManagement> {
	const db = await databaseManagement.database;

	const dnsIdentityLoader = new DnsIdentityLoader({
		save: async (identities) => {
			const tx = db.transaction("identities", "readwrite");
			for (const [address, identity] of Object.entries(identities)) {
				tx.store.put(identity, address);
			}
			await tx.done;
		},
		load: async (address) => db.get("identities", address),
	});

	dnsIdentityLoader.fetch = requestProxyManagement.fetchWithProxy;

	// Debug exposure
	if (import.meta.env.DEV) {
		// @ts-expect-error debug
		window.dnsIdentityLoader = dnsIdentityLoader;
	}

	return {
		dnsIdentityLoader,
	};
}
