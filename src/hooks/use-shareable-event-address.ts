import { useMemo } from "react";
import type { NostrEvent } from "../types/nostr-event";
import { useRelayHints } from "~/providers/global/relay-hints-provider";

export default function useShareableEventAddress(
	event: NostrEvent,
	overrideRelays?: string[],
) {
	const relayHints = useRelayHints();

	return useMemo(() => {
		return relayHints.getSharableEventAddress(event, overrideRelays);
	}, [event, relayHints]);
}
