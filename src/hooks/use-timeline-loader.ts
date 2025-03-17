import { useEffect, useMemo, useState, useRef } from "react";
import { useStoreQuery } from "applesauce-react/hooks";
import { useEventStore } from "applesauce-react/hooks/use-event-store";
import { Queries } from "applesauce-core";
import type { Filter, NostrEvent } from "nostr-tools";
import sum from "hash-sum";

import useForwardSubscription from "./use-forward-subscription";
import { useTimelineCacheService } from "~/providers/global/timeline-cache-provider";

type Options = {
	eventFilter?: (event: NostrEvent) => boolean;
};

export default function useTimelineLoader(
	key: string,
	relays: string[],
	filters: Filter | Filter[] | undefined,
	opts?: Options,
) {
	// Start a forward subscription while the component is mounted
	useForwardSubscription(relays, filters);

	const timelineCacheService = useTimelineCacheService();

	const eventStore = useEventStore();
	const loader = useMemo(() => {
		if (filters)
			return timelineCacheService?.createTimeline(
				key,
				relays,
				Array.isArray(filters) ? filters : [filters],
			);
	}, [key, sum(filters), relays.join(",")]);

	// Start and stop the loader subscription
	useEffect(() => {
		const sub = loader?.subscribe((packet) => {
			eventStore.add(packet.event, packet.from);
		});
		return () => sub?.unsubscribe();
	}, [eventStore, loader]);

	const timeline =
		useStoreQuery(Queries.TimelineQuery, filters && [filters]) ?? [];

	// State to hold the throttled timeline and ref to track the last update time
	// const [throttled, setThrottled] = useState(timeline);
	// const lastUpdateTime = useRef(Date.now());

	// Effect to throttle updates to the throttled state
	// useEffect(() => {
	// 	const now = Date.now();
	// 	const updateThrottled = () => {
	// 		let filtered = timeline;
	// 		if (opts?.eventFilter) {
	// 			filtered = timeline.filter((e) => {
	// 				try {
	// 					return opts.eventFilter(e);
	// 				} catch (error) {
	// 					return false;
	// 				}
	// 			});
	// 		}
	// 		setThrottled(filtered);
	// 		lastUpdateTime.current = now;
	// 	};

	// 	// Check if 50ms have passed since the last update
	// 	if (now - lastUpdateTime.current >= 50) {
	// 		// Update immediately if enough time has elapsed
	// 		updateThrottled();
	// 	} else {
	// 		// Schedule an update after the remaining time
	// 		const delay = 50 - (now - lastUpdateTime.current);
	// 		const timeout = setTimeout(updateThrottled, delay);
	// 		// Cleanup to clear the timeout if timeline changes again
	// 		return () => clearTimeout(timeout);
	// 	}
	// }, [timeline, opts]);

	// console.info(timeline, throttled);

	return { loader, timeline };
}
