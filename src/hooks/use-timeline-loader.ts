import { useEffect, useState } from "react";

import hash_sum from "hash-sum";
import type { Filter, NostrEvent } from "nostr-tools";

import { useLocalSettings } from "~/providers/global/preferences";
import {
	createTimelineLoader,
	type TimelineLoader,
} from "applesauce-loaders/loaders";

type Options = {
	eventFilter?: (event: NostrEvent) => boolean;
	since?: number;
};

export default function useTimelineLoader(
	relays: string[],
	filters: Filter | undefined,
	opts?: Options,
) {
	const {
		relayPoolManagement: { pool },
		eventStoreManagement: { eventStore },
		eventCacheManagement: { cacheRequest },
	} = useLocalSettings();

	const [timeline, setEvents] = useState<NostrEvent[]>([]);
	const [loader, setTimelineLoader] = useState<TimelineLoader>();

	useEffect(() => {
		const loader = createTimelineLoader(pool, relays, filters || {}, {
			cache: cacheRequest,
			eventStore,
		});

		setTimelineLoader(loader);

		const subscription = loader().subscribe((event) => {
			if (opts?.eventFilter?.(event)) {
				setEvents((prev) => {
					let newEvents = [...prev, event];

					if (newEvents.length > 50) {
						newEvents = newEvents.slice(50);
					}

					return newEvents;
				});
			}
		});

		return () => subscription.unsubscribe();
	}, [hash_sum(relays), hash_sum(filters)]);

	return { loader, timeline };
}
