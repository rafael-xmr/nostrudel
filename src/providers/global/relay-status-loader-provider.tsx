import {
	createContext,
	type PropsWithChildren,
	useContext,
	useEffect,
	useMemo,
} from "react";
import { MONITOR_STATS_KIND } from "~/helpers/nostr/relay-stats";
import { TagValueLoader } from "applesauce-loaders";
import { useRxNostr } from "./rx-nostr-provider";
import { useRelayPoolProvider } from "./pool";
import { useEventStore } from "applesauce-react/hooks";

export const MONITOR_PUBKEY =
	"151c17c9d234320cf0f189af7b761f63419fd6c38c6041587a008b7682e4640f";
export const MONITOR_RELAY = "wss://relay.nostr.watch/";

const MonitorRelayStatusLoaderContext = createContext<
	TagValueLoader | undefined
>(undefined);

export function useMonitorRelayStatusLoader() {
	return useContext(MonitorRelayStatusLoaderContext);
}

export default function MonitorRelayStatusLoaderProvider({
	children,
}: PropsWithChildren) {
	const pool = useRelayPoolProvider();
	const eventStore = useEventStore();

	const monitorRelayStatusLoader = useMemo(() => {
		if (!pool?.nostrRequest) return undefined;

		return new TagValueLoader(pool?.nostrRequest!, "d", {
			name: "relay-monitor",
			kinds: [MONITOR_STATS_KIND],
			authors: [MONITOR_PUBKEY],
			since: 1704196800,
		});
	}, [pool?.nostrRequest]);

	useEffect(() => {
		if (!monitorRelayStatusLoader) return;

		const subscription = monitorRelayStatusLoader.subscribe((event) => {
			eventStore.add(event);
		});

		return () => {
			subscription.unsubscribe();
		};
	}, [monitorRelayStatusLoader]);

	return (
		<MonitorRelayStatusLoaderContext.Provider value={monitorRelayStatusLoader}>
			{children}
		</MonitorRelayStatusLoaderContext.Provider>
	);
}
