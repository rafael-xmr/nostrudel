import {
	createContext,
	type PropsWithChildren,
	useContext,
	useEffect,
	useMemo,
} from "react";
import { ReplaceableLoader } from "applesauce-loaders/loaders";
import { useRxNostr } from "./rx-nostr-provider";
import { eventStore } from "~/services/event-store";
import { COMMON_CONTACT_RELAYS } from "~/const";
import { cacheRequest } from "~/services/cache-relay";

const ReplaceableEventLoaderContext = createContext<
	ReplaceableLoader | undefined
>(undefined);

export function useReplaceableEventLoader() {
	return useContext(ReplaceableEventLoaderContext);
}

export default function ReplaceableEventLoaderProvider({
	children,
}: PropsWithChildren) {
	const rxNostr = useRxNostr();

	const replaceableEventLoader = useMemo(() => {
		if (!rxNostr) return undefined;

		return new ReplaceableLoader(rxNostr, {
			cacheRequest,
			lookupRelays: COMMON_CONTACT_RELAYS,
		});
	}, [rxNostr]);

	useEffect(() => {
		if (!replaceableEventLoader) return;

		const subscription = replaceableEventLoader.subscribe((packet) =>
			eventStore.add(packet.event, packet.from),
		);

		return () => {
			subscription.unsubscribe();
		};
	}, [replaceableEventLoader]);

	return (
		<ReplaceableEventLoaderContext.Provider value={replaceableEventLoader}>
			{children}
		</ReplaceableEventLoaderContext.Provider>
	);
}
