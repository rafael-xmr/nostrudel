import {
	createContext,
	type PropsWithChildren,
	useContext,
	useEffect,
	useMemo,
} from "react";
import { TagValueLoader } from "applesauce-loaders";
import { useRxNostr } from "./rx-nostr-provider";
import { WIKI_PAGE_KIND } from "~/helpers/nostr/wiki";
import { eventStore } from "~/services/event-store";
import { cacheRequest } from "~/services/cache-relay";

const WikiPageLoaderContext = createContext<TagValueLoader | undefined>(
	undefined,
);

export function useWikiPageLoader() {
	return useContext(WikiPageLoaderContext);
}

export default function WikiPageLoaderProvider({
	children,
}: PropsWithChildren) {
	const rxNostr = useRxNostr();

	const wikiPageLoader = useMemo(() => {
		if (!rxNostr) return undefined;

		return new TagValueLoader(rxNostr, "d", {
			name: "wiki-pages",
			kinds: [WIKI_PAGE_KIND],
			cacheRequest,
		});
	}, [rxNostr]);

	useEffect(() => {
		if (!wikiPageLoader) return;

		const subscription = wikiPageLoader.subscribe((packet) => {
			eventStore.add(packet.event, packet.from);
		});

		return () => {
			subscription.unsubscribe();
		};
	}, [wikiPageLoader]);

	return (
		<WikiPageLoaderContext.Provider value={wikiPageLoader}>
			{children}
		</WikiPageLoaderContext.Provider>
	);
}
