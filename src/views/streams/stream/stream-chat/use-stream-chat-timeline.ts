import { useCallback, useMemo } from "react";
import { Filter, kinds, NostrEvent } from "nostr-tools";
import { getEventUID } from "applesauce-core/helpers";

import { getEventCoordinate } from "../../../../helpers/nostr/event";
import useTimelineLoader from "../../../../hooks/use-timeline-loader";
import useUserMuteFilter from "../../../../hooks/use-user-mute-filter";
import useClientSideMuteFilter from "../../../../hooks/use-client-side-mute-filter";
import { useReadRelays } from "../../../../hooks/use-client-relays";
import { useAdditionalRelayContext } from "../../../../providers/local/additional-relay-context";
import {
	getStreamEndTime,
	getStreamHost,
	getStreamStartTime,
} from "../../../../helpers/nostr/stream";

export default function useStreamChatTimeline(stream: NostrEvent) {
	const streamRelays = useReadRelays(useAdditionalRelayContext());

	const host = getStreamHost(stream);
	const starts = getStreamStartTime(stream);
	const ends = getStreamEndTime(stream);

	const hostMuteFilter = useUserMuteFilter(host, [], true);
	const muteFilter = useClientSideMuteFilter();

	const eventFilter = useCallback(
		(event: NostrEvent) => {
			if (starts && event.created_at < starts) return false;
			if (ends && event.created_at > ends) return false;
			return !(hostMuteFilter(event) || muteFilter(event));
		},
		[stream, hostMuteFilter, muteFilter],
	);

	const query = useMemo(() => {
		const streamQuery: Filter = {
			"#a": [getEventCoordinate(stream)],
			kinds: [kinds.LiveChatMessage, kinds.Zap],
		};

		return streamQuery;
	}, [stream]);

	return useTimelineLoader(`${getEventUID(stream)}-chat`, streamRelays, query, {
		eventFilter,
	});
}
