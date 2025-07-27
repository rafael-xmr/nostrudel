import { LRU } from "applesauce-core/helpers";
import type { TimelessFilter } from "applesauce-loaders";
import {
	createTimelineLoader,
	type TimelineLoader,
} from "applesauce-loaders/loaders";

import { logger } from "../helpers/debug";
import type { EventCacheManagement } from "./event-cache";
import type { EventStoreManagement } from "./event-store";
import type { RelayPoolManagement } from "./pool";

export interface TimelineCacheManagement {
	createTimeline: (
		key: string,
		relays: string[],
		filters: TimelessFilter[],
	) => TimelineLoader | undefined;
	getTimeline: (key: string) => TimelineLoader | undefined;
	clearCache: () => void;
	getCacheSize: () => number;
}

export interface TimelineCacheConfig {
	maxCache?: number;
	batchLimit?: number;
}

export default function createTimelineCacheManagement(
	relayPoolManagement: RelayPoolManagement,
	eventCacheManagement: EventCacheManagement,
	eventStoreManagement: EventStoreManagement,
	config: TimelineCacheConfig = {},
): TimelineCacheManagement {
	const MAX_CACHE = config.maxCache ?? 30;
	const BATCH_LIMIT = config.batchLimit ?? 100;

	const timelines = new LRU<TimelineLoader>(MAX_CACHE);
	const log = logger.extend("TimelineCacheService");

	const createTimeline = (
		key: string,
		relays: string[],
		filters: TimelessFilter[],
	): TimelineLoader | undefined => {
		let timeline = timelines.get(key);

		if (!timeline && relays.length > 0 && filters.length > 0) {
			log(`Creating ${key}`);
			timeline = createTimelineLoader(
				relayPoolManagement.pool,
				relays,
				filters,
				{
					limit: BATCH_LIMIT,
					cache: eventCacheManagement.cacheRequest,
					eventStore: eventStoreManagement.eventStore,
				},
			);
			timelines.set(key, timeline);
		}

		return timeline;
	};

	const getTimeline = (key: string): TimelineLoader | undefined => {
		return timelines.get(key);
	};

	const clearCache = (): void => {
		timelines.clear();
		log("Cache cleared");
	};

	const getCacheSize = (): number => {
		return timelines.size;
	};

	return {
		createTimeline,
		getTimeline,
		clearCache,
		getCacheSize,
	};
}
