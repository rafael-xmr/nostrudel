import db from "./db";
import _throttle from "lodash.throttle";
import { DnsIdentityLoader } from "applesauce-loaders/loaders/dns-identity-loader";
import { fetchWithProxy } from "../helpers/request";

export const dnsIdentityLoader = new DnsIdentityLoader({
	save: async (identities) => {
		const tx = db?.transaction("identities", "readwrite");
		if (!tx) return;

		for (const [address, identity] of Object.entries(identities)) {
			tx.store.put(identity, address);
		}
		await tx.done;
	},
	load: async (address) => db?.get("identities", address),
});

dnsIdentityLoader.fetch = fetchWithProxy;

if (process.env.NEXT_PUBLIC_DEV) {
	// @ts-expect-error debug
	window.dnsIdentityLoader = dnsIdentityLoader;
}

export default dnsIdentityLoader;
