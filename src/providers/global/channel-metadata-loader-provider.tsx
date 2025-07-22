import {
	createContext,
	type PropsWithChildren,
	useContext,
	useEffect,
	useMemo,
} from "react";
import { kinds } from "nostr-tools";
import { TagValueLoader } from "applesauce-loaders";
import { useRelayPoolProvider } from "./pool";
import { useEventStore } from "applesauce-react/hooks";

const ChannelMetadataLoaderContext = createContext<TagValueLoader | undefined>(
	undefined,
);

export function useChannelMetadataLoader() {
	return useContext(ChannelMetadataLoaderContext);
}

export default function ChannelMetadataLoaderProvider({
	children,
}: PropsWithChildren) {
	const pool = useRelayPoolProvider();
	const eventStore = useEventStore();

	const channelMetadataLoader = useMemo(() => {
		if (!pool?.nostrRequest) return undefined;

		return new TagValueLoader(pool?.nostrRequest!, "e", {
			name: "channel-metadata",
			kinds: [kinds.ChannelMetadata],
			// cacheRequest,
		});
	}, [pool?.nostrRequest]);

	useEffect(() => {
		if (!channelMetadataLoader) return;

		const subscription = channelMetadataLoader.subscribe((event) => {
			eventStore.add(event);
		});

		return () => {
			subscription.unsubscribe();
		};
	}, [channelMetadataLoader]);

	return (
		<ChannelMetadataLoaderContext.Provider value={channelMetadataLoader}>
			{children}
		</ChannelMetadataLoaderContext.Provider>
	);
}
