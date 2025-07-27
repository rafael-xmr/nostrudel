import { markFromCache } from "applesauce-core/helpers";
import {
	addEvents,
	clearDB,
	getEventsForFilters,
	IndexCache,
	openDB,
	pruneLastUsed,
	type NostrIDB,
} from "nostr-idb";
import type { NostrEvent } from "nostr-tools";
import { from, mergeMap, tap } from "rxjs";

import type { PreferenceSubject } from "~/classes/preference-subject";
import type { EventCache } from "./interface";

export interface IndexedDBManagement {
	indexes: IndexCache;
	database: NostrIDB;
	cache: EventCache;
	pruneInterval: NodeJS.Timeout | null;
	startPruning: () => void;
	stopPruning: () => void;
}

export default async function createIndexedDBManagement(
	idbMaxEvents: PreferenceSubject<number>,
): Promise<IndexedDBManagement> {
	const indexes = new IndexCache();
	const database = await openDB();

	const indexeddbCache: EventCache = {
		type: "nostr-idb",
		read: (filters) =>
			from(getEventsForFilters(database, filters, indexes)).pipe(
				mergeMap((events) => from(events)),
				tap((e) => markFromCache(e)),
			),
		write(events) {
			for (const event of events) indexes.addEventToIndexes(event);
			return addEvents(database, events);
		},
		async clear() {
			await clearDB(database);
		},
	};

	let pruneInterval: NodeJS.Timeout | null = null;

	const startPruning = () => {
		if (pruneInterval) return; // Already running

		pruneInterval = setInterval(async () => {
			const maxEvents = idbMaxEvents.value;
			if (maxEvents) {
				await pruneLastUsed(database, maxEvents);
			}
		}, 60_000);
	};

	const stopPruning = () => {
		if (pruneInterval) {
			clearInterval(pruneInterval);
			pruneInterval = null;
		}
	};

	// Initial pruning on startup
	await pruneLastUsed(database, idbMaxEvents.value);

	return {
		indexes,
		database,
		cache: indexeddbCache,
		pruneInterval,
		startPruning,
		stopPruning,
	};
}

// Helper function for backward compatibility
export async function saveEvents(
	events: NostrEvent[],
	management: IndexedDBManagement,
) {
	await addEvents(management.database, events);
}
