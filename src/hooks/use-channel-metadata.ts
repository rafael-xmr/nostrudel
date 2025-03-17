import { useMemo } from "react";
import { useStoreQuery } from "applesauce-react/hooks";
import { ChannelMetadataQuery } from "applesauce-core/queries";

import useSingleEvent from "./use-single-event";
import { useReadRelays } from "./use-client-relays";
import { useChannelMetadataLoader } from "~/providers/global/channel-metadata-loader-provider";

export default function useChannelMetadata(
	channelId: string | undefined,
	additionalRelays?: string[],
	force?: boolean,
) {
	const relays = useReadRelays(additionalRelays);
	const channel = useSingleEvent(channelId);
	const channelMetadataLoader = useChannelMetadataLoader();

	useMemo(() => {
		if (!channelId) return;
		return channelMetadataLoader?.next({ value: channelId, relays, force });
	}, [useChannelMetadataLoader, channelId, relays.join("|"), force]);

	const metadata = useStoreQuery(ChannelMetadataQuery, channel && [channel]);

	return metadata;
}
