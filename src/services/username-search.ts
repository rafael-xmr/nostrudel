import _throttle from "lodash.throttle";
import { kinds } from "nostr-tools";
import { from } from "rxjs";
import {
	filter,
	bufferTime,
	concatMap,
	mergeWith,
	shareReplay,
	map,
	scan,
	distinctUntilChanged,
} from "rxjs/operators";
import { getProfileContent, isFromCache } from "applesauce-core/helpers";

import { getSearchNames } from "../helpers/nostr/profile";
import { eventStore } from "./event-store";
import { logger } from "../helpers/debug";

export type UserDirectory = Record<string, string[]>;
export type SearchDirectory = { pubkey: string; names: string[] }[];

const log = logger.extend("UsernameSearch");

log("Started loading profiles");
const cache = window.db
	?.getAll("userSearch")
	.then((rows: { pubkey: string; names: string[] }[]) => {
		log(`Loaded ${rows.length} profiles`);
		return rows.reduce<UserDirectory>(
			(dir, row) => ({ ...dir, [row.pubkey]: row.names }),
			{},
		);
	});

const updates = eventStore.filters([{ kinds: [kinds.Metadata] }]).pipe(
	filter((event) => !isFromCache(event)),
	bufferTime(500),
	concatMap(async (events) => {
		if (events.length === 0) return {};

		const updates: UserDirectory = {};
		const transaction = window.db?.transaction("userSearch", "readwrite");
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
	}),
);

export const userSearchDirectory = from(cache).pipe(
	mergeWith(updates),
	scan((dir, updates) => {
		if (!Object.keys(updates).length) return dir;

		const hasChanges = Object.entries(updates).some(([pubkey, names]) => {
			const currentNames = dir[pubkey];
			if (!currentNames) return true;
			if (currentNames.length !== names.length) return true;
			return !currentNames.every((name, i) => name === names[i]);
		});

		return hasChanges ? { ...dir, ...updates } : dir;
	}, {} as UserDirectory),
	distinctUntilChanged((prev, curr) => {
		// Compare the previous and current UserDirectory objects
		const prevKeys = Object.keys(prev);
		const currKeys = Object.keys(curr);

		if (prevKeys.length !== currKeys.length) return false;

		return prevKeys.every((pubkey) => {
			const prevNames = prev[pubkey];
			const currNames = curr[pubkey];
			if (!currNames) return false;
			if (prevNames.length !== currNames.length) return false;
			return prevNames.every((name, i) => name === currNames[i]);
		});
	}),
	map<UserDirectory, SearchDirectory>((dir) =>
		Object.entries(dir).map(([pubkey, names]) => ({ pubkey, names })),
	),
	shareReplay(1),
);
