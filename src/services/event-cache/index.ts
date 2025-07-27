import type { Filter, NostrEvent } from "nostr-tools";
import {
	BehaviorSubject,
	bufferTime,
	combineLatest,
	EMPTY,
	filter,
	type Observable,
	Subject,
	timeout,
} from "rxjs";

import { WASM_RELAY_SUPPORTED } from "../../env";
import { logger } from "../../helpers/debug";
import type { PreferenceSubject } from "~/classes/preference-subject";
import type { EventCache } from "./interface";
import { wrapInTimeout } from "../../helpers/promise";
import createWasmWorkerManagement from "./wasm-worker";
import createIndexedDBManagement from "./nostr-idb";

export interface EventCacheManagement {
	eventCache$: BehaviorSubject<EventCache | null>;
	getEvents: (filters: Filter[]) => Observable<NostrEvent>;
	writeEvent: (events: NostrEvent | NostrEvent[]) => void;
	clearEvents: () => Promise<void>;
	changeEventCache: (url: string | null) => Promise<void>;
	cacheRequest: (filters: Filter[]) => Observable<NostrEvent>;
}

export default function createEventCacheManagement(
	eventCache: PreferenceSubject<string | null>,
	wasmPersistForDays: PreferenceSubject<number | null>,
	idbMaxEvents: PreferenceSubject<number>,
): EventCacheManagement {
	const log = logger.extend("event-cache");

	async function loadEventCacheModule(
		type: string,
	): Promise<{ default: EventCache }> {
		if (type === "wasm-worker" && WASM_RELAY_SUPPORTED)
			return { default: createWasmWorkerManagement(wasmPersistForDays).cache };
		else if (type === "nostr-idb" || type.startsWith("nostr-idb://"))
			return { default: (await createIndexedDBManagement(idbMaxEvents)).cache };
		else if (type === "local-relay")
			return await import("~/services/event-cache/local-relay");
		else if (type === "hosted-relay" || (window as any).CACHE_RELAY_ENABLED)
			return await import("~/services/event-cache/hosted-relay");

		throw new Error(`Unsupported event cache: ${type}`);
	}

	async function createEventCache(
		type: string | null,
	): Promise<EventCache | null> {
		if (!type || type === ":none:") return null;

		return loadEventCacheModule(type)
			.then((m) => m.default)
			.catch(async (err) => {
				log(
					"Failed to load event cache module, falling back to indexeddb",
					err,
				);
				return loadEventCacheModule("nostr-idb")
					.then((m) => m.default)
					.catch(() => null);
			});
	}

	log("Creating event cache");
	const eventCache$ = new BehaviorSubject<EventCache | null>(null);

	// Initialize event cache
	wrapInTimeout(
		createEventCache(eventCache.value),
		2_000,
		"Opening event cache timedout",
	)
		.then((cache) => eventCache$.next(cache))
		.catch((err) => {
			console.error(err);
			eventCache$.next(null);
		});

	// Create a new event cache instance when the url changes
	combineLatest([eventCache, eventCache$])
		.pipe(filter(([type, cache]) => type !== cache?.type))
		.subscribe(([url]) => {
			wrapInTimeout(
				createEventCache(url),
				2_000,
				"Opening event cache timedout",
			)
				.then((cache) => eventCache$.next(cache))
				.catch((err) => {
					log("Failed to create event cache", err);
				});
		});

	async function changeEventCache(url: string | null): Promise<void> {
		const cache = await createEventCache(url);
		eventCache$.next(cache);
		eventCache.next(url);
	}

	function getEvents(filters: Filter[]): Observable<NostrEvent> {
		const cache = eventCache$.value;
		if (!cache) return EMPTY;
		return cache
			.read(filters)
			.pipe(timeout({ first: 1000, with: () => EMPTY }));
	}

	// Buffer events and write them to the cache
	const writeEvent$ = new Subject<NostrEvent>();
	writeEvent$.pipe(bufferTime(1000, undefined, 500)).subscribe((events) => {
		const cache = eventCache$.value;
		if (!cache) return;
		return cache.write(events);
	});

	function writeEvent(events: NostrEvent | NostrEvent[]): void {
		if (Array.isArray(events))
			for (const event of events) writeEvent$.next(event);
		else writeEvent$.next(events);
	}

	function clearEvents(): Promise<void> {
		const cache = eventCache$.value;
		if (!cache) return Promise.resolve();
		return cache.clear?.() ?? Promise.resolve();
	}

	const cacheRequest = getEvents;

	return {
		eventCache$,
		getEvents,
		writeEvent,
		clearEvents,
		changeEventCache,
		cacheRequest,
	};
}
