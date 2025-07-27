import { createTagValueLoader } from "applesauce-loaders/loaders";
import { MONITOR_STATS_KIND } from "../helpers/nostr/relay-stats";
import type { EventCacheManagement } from "./event-cache";
import type { RelayPoolManagement } from "./pool";

export const MONITOR_PUBKEY =
	"151c17c9d234320cf0f189af7b761f63419fd6c38c6041587a008b7682e4640f";
export const MONITOR_RELAY = "wss://relay.nostr.watch/";

export interface MonitorRelayStatusManagement {
	monitorRelayStatusLoader: ReturnType<typeof createTagValueLoader>;
}

export default function createMonitorRelayStatusManagement(
	relayPoolManagement: RelayPoolManagement,
	eventCacheManagement: EventCacheManagement,
): MonitorRelayStatusManagement {
	const monitorRelayStatusLoader = createTagValueLoader(
		relayPoolManagement.pool,
		"d",
		{
			cacheRequest: eventCacheManagement.cacheRequest,
			kinds: [MONITOR_STATS_KIND],
			authors: [MONITOR_PUBKEY],
			since: 1704196800,
		},
	);

	return {
		monitorRelayStatusLoader,
	};
}
