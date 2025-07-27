import { kinds } from "nostr-tools";
import { from, type Observable } from "rxjs";
import {
	filter,
	bufferTime,
	concatMap,
	mergeWith,
	shareReplay,
	map,
	scan,
} from "rxjs/operators";
import { getProfileContent, isFromCache } from "applesauce-core/helpers";

import { getSearchNames } from "../helpers/nostr/profile";
import type { DatabaseManagement } from "./database";
import type { EventStoreManagement } from "./event-store";
import { logger } from "../helpers/debug";

export type UserDirectory = Record<string, string[]>;
export type SearchDirectory = { pubkey: string; names: string[] }[];

export interface UserSearchManagement {
	userSearchDirectory: Observable<SearchDirectory>;
	loadCache: () => Promise<UserDirectory>;
	updateProfiles: (events: any[]) => Promise<UserDirectory>;
}

export default function createUserSearchManagement(
	databaseManagement: DatabaseManagement,
	eventStoreManagement: EventStoreManagement,
): UserSearchManagement {
	const log = logger.extend("UsernameSearch");

	const loadCache = async (): Promise<UserDirectory> => {
		log(`Started loading profiles`);
		const db = await databaseManagement.database;
		const rows: { pubkey: string; names: string[] }[] =
			await db.getAll("userSearch");
		log(`Loaded ${rows.length} profiles`);
		return rows.reduce<UserDirectory>(
			(dir, row) => ({ ...dir, [row.pubkey]: row.names }),
			{},
		);
	};

	const cache = loadCache();

	const updateProfiles = async (events: any[]): Promise<UserDirectory> => {
		if (events.length === 0) return {};

		const updates: UserDirectory = {};
		const db = await databaseManagement.database;
		const transaction = db.transaction("userSearch", "readwrite");

		for (const metadata of events) {
			const profile = getProfileContent(metadata);
			const names = getSearchNames(profile);
			updates[metadata.pubkey] = names;
			transaction
				.objectStore("userSearch")
				.put({ pubkey: metadata.pubkey, names });
		}

		transaction.commit();
		await transaction.done;
		log(`Updated ${events.length} profiles`);
		return updates;
	};

	const updates = eventStoreManagement.eventStore
		.filters([{ kinds: [kinds.Metadata] }])
		.pipe(
			filter((event) => !isFromCache(event)),
			bufferTime(500),
			concatMap(updateProfiles),
		);

	const userSearchDirectory = from(cache).pipe(
		mergeWith(updates),
		scan((dir, updates) => ({ ...dir, ...updates })),
		map<UserDirectory, SearchDirectory>((dir) =>
			Object.entries(dir).map(([pubkey, names]) => ({ pubkey, names })),
		),
		shareReplay(1),
	);

	return {
		userSearchDirectory,
		loadCache,
		updateProfiles,
	};
}
