import { useCallback, useMemo } from "react";

import useCurrentAccount from "./use-current-account";
import useUserMuteList from "./use-user-mute-list";
import { getPubkeysFromList } from "../helpers/nostr/lists";
import type { NostrEvent } from "../types/nostr-event";
import { STREAM_KIND, getStreamHost } from "../helpers/nostr/stream";
import type { RequestOptions } from "../services/replaceable-events";
import type { Kind0ParsedContent } from "../helpers/nostr/user-metadata";

export default function useUserMuteFilter(
	pubkey?: string,
	additionalRelays?: string[],
	opts?: RequestOptions,
) {
	const account = useCurrentAccount();
	const muteList = useUserMuteList(
		pubkey || account?.pubkey,
		additionalRelays,
		{ ignoreCache: true, ...opts },
	);
	const pubkeys = useMemo(
		() => (muteList ? getPubkeysFromList(muteList).map((p) => p.pubkey) : []),
		[muteList],
	);

	return useCallback(
		(event: NostrEvent, userMetadata?: Kind0ParsedContent) => {
			if (event.kind === STREAM_KIND) {
				if (pubkeys.includes(getStreamHost(event))) return true;
			}

			if (userMetadata) {
				const nameMatch = userMetadata.name?.toLowerCase().includes("replyguy");
				const display_nameMatch = userMetadata.display_name
					?.toLowerCase()
					.includes("replyguy");
				const displayNameMatch = userMetadata.displayName
					?.toLowerCase()
					.includes("replyguy");

				return nameMatch || display_nameMatch || displayNameMatch;
			}

			return pubkeys.includes(event.pubkey);
		},
		[pubkeys],
	);
}
