import type { NostrEvent } from "nostr-tools";

import { useEventModel } from "applesauce-react/hooks";
import { ReactionsQuery } from "../models/reactions";
import { useLocalSettings } from "~/providers/global/preferences";

export default function useEventReactions(
	event: NostrEvent,
	relays?: string[],
) {
	const { loadersManagement } = useLocalSettings();
	return useEventModel(ReactionsQuery, [event, loadersManagement, relays]);
}
