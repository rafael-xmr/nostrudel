import { useEffect } from "react";
import { useStoreQuery } from "applesauce-react/hooks";
import type { NostrEvent } from "nostr-tools";

import { useReadRelays } from "./use-client-relays";
import { WikiPagesQuery } from "../queries/wiki-pages";
import { useWikiPageLoader } from "~/providers/global/wiki-page-loader-provider";

export default function useWikiPages(
	topic: string,
	additionalRelays?: Iterable<string>,
	force?: boolean,
): NostrEvent[] {
	const relays = useReadRelays(additionalRelays);
	const wikiPageLoader = useWikiPageLoader();

	useEffect(() => {
		wikiPageLoader?.next({ value: topic, relays, force });
	}, [wikiPageLoader, topic, relays.join("|"), force]);

	return useStoreQuery(WikiPagesQuery, topic ? [topic] : undefined) ?? [];
}
