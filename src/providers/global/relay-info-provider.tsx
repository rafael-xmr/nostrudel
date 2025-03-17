import {
	createContext,
	type PropsWithChildren,
	useContext,
	useEffect,
	useMemo,
} from "react";
import { Nip11Registry } from "rx-nostr";
import { useDB } from "./db-provider";
import { logger } from "~/helpers/debug";

const RelayInfoContext = createContext<
	| {
			getInfo: (relay: string, alwaysFetch?: boolean) => Promise<any>;
	  }
	| undefined
>(undefined);

export function useRelayInfoProvider() {
	return useContext(RelayInfoContext);
}

const log = logger.extend("Nip11Registry");

export default function RelayInfoProvider({ children }: PropsWithChildren) {
	const { db } = useDB();

	const relayInfoService = useMemo(() => {
		if (!db) return undefined;

		const service = {
			getInfo: async (relay: string, alwaysFetch = false) => {
				let info = Nip11Registry.get(relay);

				if (!info || alwaysFetch) {
					info = await Nip11Registry.fetch(relay);
					await db.put("relayInfo", info, relay);
				}
				return info;
			},
		};

		return service;
	}, [db]);

	useEffect(() => {
		if (!db) return;

		const loadRelayInfo = async () => {
			const cursor = await db
				.transaction("relayInfo", "readonly")
				.objectStore("relayInfo")
				.openCursor();

			let loaded = 0;
			let currentCursor = cursor;
			while (currentCursor) {
				try {
					Nip11Registry.set(currentCursor.key as string, currentCursor.value);
					loaded++;
				} catch (error) {}
				currentCursor = await currentCursor.continue();
			}

			log(`Loaded ${loaded} relay info`);
		};

		loadRelayInfo();

		const saveInfo = async () => {
			log("Saving relay info");
			const cache = Reflect.get(Nip11Registry, "cache") as Map<string, any>;

			const tx = db.transaction("relayInfo", "readwrite");
			if (!tx) return;

			await Promise.all(
				Array.from(cache.entries())
					.filter(([url, info]) => Object.keys(info).length > 0)
					.map(([url, info]) => tx.store.put(info, url)),
			);
			await tx.done;
		};

		const intervalId = setInterval(() => {
			saveInfo();
		}, 10_000);

		return () => {
			clearInterval(intervalId);
		};
	}, [db]);

	return (
		<RelayInfoContext.Provider value={relayInfoService}>
			{children}
		</RelayInfoContext.Provider>
	);
}
