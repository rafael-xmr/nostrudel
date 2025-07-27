import type { NostrEvent } from "nostr-tools";
import { useEffect } from "react";
import { useEventModel } from "applesauce-react/hooks";

import { WikiPagesModel } from "../models/wiki-pages";
import { createTagValueLoader } from "applesauce-loaders/loaders";
import { useReadRelays } from "./use-client-relays";
import { WIKI_PAGE_KIND } from "~/helpers/nostr/wiki";
import { useLocalSettings } from "~/providers/global/preferences";

export default function useWikiPages(
	topic: string,
	additionalRelays?: Iterable<string>,
	force?: boolean,
): NostrEvent[] {
	const relays = useReadRelays(additionalRelays);
	const { eventCacheManagement, relayPoolManagement } = useLocalSettings();

	useEffect(() => {
		const wikiPageLoader = createTagValueLoader(relayPoolManagement.pool, "d", {
			kinds: [WIKI_PAGE_KIND],
			cacheRequest: eventCacheManagement.cacheRequest,
		});
		wikiPageLoader({ value: topic, relays, force }).subscribe();
	}, [topic, relays.join("|"), force, eventCacheManagement.cacheRequest]);

	return useEventModel(WikiPagesModel, topic ? [topic] : undefined) ?? [];
}
