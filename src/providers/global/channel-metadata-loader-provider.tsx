import {
	createContext,
	type PropsWithChildren,
	useContext,
	useEffect,
	useMemo,
} from "react";
import { kinds } from "nostr-tools";
import { useRxNostr } from "./rx-nostr-provider";
import { cacheRequest } from "~/services/cache-relay";
import { TagValueLoader } from "applesauce-loaders";
import { eventStore } from "~/services/event-store";

const ChannelMetadataLoaderContext = createContext<TagValueLoader | undefined>(
	undefined,
);

export function useChannelMetadataLoader() {
	return useContext(ChannelMetadataLoaderContext);
}

export default function ChannelMetadataLoaderProvider({
	children,
}: PropsWithChildren) {
	const rxNostr = useRxNostr();

	const channelMetadataLoader = useMemo(() => {
		if (!rxNostr) return undefined;

		return new TagValueLoader(rxNostr, "e", {
			name: "channel-metadata",
			kinds: [kinds.ChannelMetadata],
			cacheRequest,
		});
	}, [rxNostr]);

	useEffect(() => {
		if (!channelMetadataLoader) return;

		const subscription = channelMetadataLoader.subscribe((packet) => {
			eventStore.add(packet.event, packet.from);
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
