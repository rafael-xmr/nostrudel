import {
	createContext,
	type PropsWithChildren,
	useContext,
	useMemo,
} from "react";
import { LRU } from "applesauce-core/helpers";
import { type TimelessFilter, TimelineLoader } from "applesauce-loaders";
import { useRxNostr } from "./rx-nostr-provider";
import { logger } from "~/helpers/debug";
import { cacheRequest } from "~/services/cache-relay";

const MAX_CACHE = 30;
const BATCH_LIMIT = 100;

const TimelineCacheServiceContext = createContext<
	TimelineCacheService | undefined
>(undefined);

export function useTimelineCacheService() {
	return useContext(TimelineCacheServiceContext);
}

class TimelineCacheService {
	protected timelines = new LRU<TimelineLoader>(MAX_CACHE);
	protected log = logger.extend("TimelineCacheService");

	constructor(private rxNostr: any) {}

	createTimeline(key: string, relays: string[], filters: TimelessFilter[]) {
		let timeline = this.timelines.get(key);

		if (!timeline && relays.length > 0 && filters.length > 0) {
			this.log(`Creating ${key}`);
			timeline = new TimelineLoader(
				this.rxNostr,
				TimelineLoader.simpleFilterMap(relays, filters),
				{
					limit: BATCH_LIMIT,
					cacheRequest,
				},
			);
			this.timelines.set(key, timeline);
		}

		return timeline;
	}
}

export default function TimelineCacheServiceProvider({
	children,
}: PropsWithChildren) {
	const rxNostr = useRxNostr();

	const timelineCacheService = useMemo(() => {
		if (!rxNostr) return undefined;

		const service = new TimelineCacheService(rxNostr);

		return service;
	}, [rxNostr]);

	return (
		<TimelineCacheServiceContext.Provider value={timelineCacheService}>
			{children}
		</TimelineCacheServiceContext.Provider>
	);
}
