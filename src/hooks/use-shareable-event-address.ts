import { useMemo } from "react";
import type { NostrEvent } from "nostr-tools";
import { useLocalSettings } from "~/providers/global/preferences";
import useUserMailboxes from "./use-user-mailboxes";

export default function useShareableEventAddress(
	event: NostrEvent,
	overrideRelays?: string[],
) {
	// Load the mailboxes for the event
	useUserMailboxes(event.pubkey);

	const { relayHintsManagement } = useLocalSettings();

	return useMemo(() => {
		return relayHintsManagement.getSharableEventAddress(event, overrideRelays);
	}, [event]);
}
