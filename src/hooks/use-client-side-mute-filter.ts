import { useActiveAccount } from "applesauce-react/hooks";
import type { NostrEvent } from "nostr-tools";
import { useCallback } from "react";

import { useLocalSettings } from "~/providers/global/preferences";
import useUserMuteFilter from "./use-user-mute-filter";

/** Returns Whether the event should be hidden in the UI */
export default function useClientSideMuteFilter(
	user?: string,
): (event: NostrEvent) => boolean {
	const account = useActiveAccount();
	const { contentFilterManagement } = useLocalSettings();
	user = user || account?.pubkey;

	const muteListFilter = useUserMuteFilter(user);

	return useCallback(
		(event: NostrEvent) => {
			// Never mute the users own events
			if (event.pubkey === user) return false;
			if (muteListFilter(event)) return true;
			if (contentFilterManagement.shouldHideEvent(event)) return true;

			return false;
		},
		[muteListFilter, contentFilterManagement, user],
	);
}
