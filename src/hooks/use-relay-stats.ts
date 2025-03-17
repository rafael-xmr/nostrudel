import { useEffect } from "react";
import { useStoreQuery } from "applesauce-react/hooks";
import { ReplaceableQuery } from "applesauce-core/queries";

import { MONITOR_STATS_KIND } from "../helpers/nostr/relay-stats";
import {
	MONITOR_PUBKEY,
	MONITOR_RELAY,
	useMonitorRelayStatusLoader,
} from "~/providers/global/relay-status-loader-provider";

export default function useRelayStats(relay: string) {
	const monitorRelayStatusLoader = useMonitorRelayStatusLoader();
	useEffect(() => {
		monitorRelayStatusLoader?.next({ value: relay, relays: [MONITOR_RELAY] });
	}, [monitorRelayStatusLoader, relay]);

	return useStoreQuery(ReplaceableQuery, [
		MONITOR_STATS_KIND,
		MONITOR_PUBKEY,
		relay,
	]);
}
