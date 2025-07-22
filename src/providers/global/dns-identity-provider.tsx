import {
	createContext,
	type PropsWithChildren,
	useContext,
	useMemo,
} from "react";
import { DnsIdentityLoader } from "applesauce-loaders/loaders/dns-identity-loader";
import db from "~/services/db/index.client";
import { fetchWithProxy } from "~/helpers/request";

const DnsIdentityContext = createContext<DnsIdentityLoader | undefined>(
	undefined,
);

export function useDnsIdentityProvider() {
	return useContext(DnsIdentityContext);
}

export default function DnsIdentityProvider({ children }: PropsWithChildren) {

	const dnsIdentityLoader = useMemo(() => {
		if (!db) return undefined;

		const loader = new DnsIdentityLoader({
			save: async (identities) => {
				const tx = db.transaction("identities", "readwrite");
				if (!tx) return;

				for (const [address, identity] of Object.entries(identities)) {
					tx.store.put(identity, address);
				}
				await tx.done;
			},
			load: async (address) => db.get("identities", address),
		});

		loader.fetch = fetchWithProxy;

		return loader;
	}, []);

	return (
		<DnsIdentityContext.Provider value={dnsIdentityLoader}>
			{children}
		</DnsIdentityContext.Provider>
	);
}
