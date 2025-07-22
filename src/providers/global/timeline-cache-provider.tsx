import {
	createContext,
	type PropsWithChildren,
	useContext,
	useMemo,
} from "react";
import { LRU } from "applesauce-core/helpers";
import {
	type NostrRequest,
	type TimelessFilter,
	TimelineLoader,
} from "applesauce-loaders";
import { logger } from "~/helpers/debug";
import { useRelayPoolProvider } from "./pool";

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

	constructor(private nostrRequest: NostrRequest) {}

	createTimeline(key: string, relays: string[], filters: TimelessFilter[]) {
		let timeline = this.timelines.get(key);

		if (!timeline && relays.length > 0 && filters.length > 0) {
			this.log(`Creating ${key}`);
			timeline = new TimelineLoader(
				this.nostrRequest,
				TimelineLoader.simpleFilterMap(relays, filters),
				{
					limit: BATCH_LIMIT,
					// cacheRequest,
				},
			);
			this.timelines.set(key, timeline);
		}

		return timeline;
	}
}

let cachedTimelineCacheService: TimelineCacheService | undefined;

export default function TimelineCacheServiceProvider({
	children,
}: PropsWithChildren) {
	const relayPool = useRelayPoolProvider();

	const timelineCacheService = useMemo(() => {
		if (!relayPool?.nostrRequest) return undefined;
		if (cachedTimelineCacheService) return cachedTimelineCacheService;

		const service = new TimelineCacheService(relayPool.nostrRequest);

		cachedTimelineCacheService = service;
		return service;
	}, [relayPool?.nostrRequest]);

	return (
		<TimelineCacheServiceContext.Provider value={timelineCacheService}>
			{children}
		</TimelineCacheServiceContext.Provider>
	);
}
