import { useCallback } from "react";

import useCurrentAccount from "./use-current-account";
import useWordMuteFilter from "./use-mute-word-filter";
import useUserMuteFilter from "./use-user-mute-filter";
import type { NostrEvent } from "../types/nostr-event";
import type { Kind0ParsedContent } from "../helpers/nostr/user-metadata";

export default function useClientSideMuteFilter() {
	const account = useCurrentAccount();

	const wordMuteFilter = useWordMuteFilter();
	const mustListFilter = useUserMuteFilter(account?.pubkey);

	return useCallback(
		(event: NostrEvent, userMetadata?: Kind0ParsedContent) => {
			return (
				wordMuteFilter(event, userMetadata) ||
				mustListFilter(event, userMetadata)
			);
		},
		[wordMuteFilter, mustListFilter],
	);
}
