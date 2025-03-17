import { useMemo } from "react";
import { nip19 } from "nostr-tools";

import useUserMailboxes from "./use-user-mailboxes";
import { useRelayScoreboard } from "~/providers/global/relay-scoreboard-provider";

/** @deprecated */
export function useSharableProfileId(pubkey: string, relayCount = 2) {
	const mailboxes = useUserMailboxes(pubkey);
	const relayScoreboardService = useRelayScoreboard();

	return useMemo(() => {
		const ranked = relayScoreboardService?.getRankedRelays(mailboxes?.outboxes);
		const onlyTwo = ranked?.slice(0, relayCount);
		return (onlyTwo?.length ?? 0) > 0
			? nip19.nprofileEncode({ pubkey, relays: onlyTwo })
			: nip19.npubEncode(pubkey);
	}, [relayScoreboardService, mailboxes]);
}
