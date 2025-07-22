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
import { useRelayPoolProvider } from "./pool";
import { useEventStore } from "applesauce-react/hooks";
// import { cacheRequest } from "~/services/cache-relay";

const WikiPageLoaderContext = createContext<TagValueLoader | undefined>(
	undefined,
);

export function useWikiPageLoader() {
	return useContext(WikiPageLoaderContext);
}

export default function WikiPageLoaderProvider({
	children,
}: PropsWithChildren) {
	const pool = useRelayPoolProvider();
	const eventStore = useEventStore();

	const wikiPageLoader = useMemo(() => {
		if (!pool?.nostrRequest) return undefined;

		return new TagValueLoader(pool?.nostrRequest!, "d", {
			name: "wiki-pages",
			kinds: [WIKI_PAGE_KIND],
			// cacheRequest,
		});
	}, [pool?.nostrRequest]);

	useEffect(() => {
		if (!wikiPageLoader) return;

		const subscription = wikiPageLoader.subscribe((event) => {
			eventStore.add(event);
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
