import {
	createContext,
	type PropsWithChildren,
	useContext,
	useMemo,
} from "react";
import _throttle from "lodash.throttle";
import { kinds } from "nostr-tools";
import { type Observable, from } from "rxjs";
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
import db from "~/services/db/index.client";
import { getSearchNames } from "~/helpers/nostr/profile";
import { logger } from "~/helpers/debug";
import { useEventStore } from "applesauce-react/hooks";

export type UserDirectory = Record<string, string[]>;
export type SearchDirectory = { pubkey: string; names: string[] }[];

const UserSearchDirectoryContext = createContext<Observable<SearchDirectory>>(
	from([]),
);

export function useUserSearchDirectory() {
	return useContext(UserSearchDirectoryContext);
}

const log = logger.extend("UsernameSearch");

export default function UserSearchDirectoryProvider({
	children,
}: PropsWithChildren) {
	const eventStore = useEventStore();

	const userSearchDirectory = useMemo(() => {
		log("Started loading profiles");
		const cache = db
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
				const transaction = db?.transaction("userSearch", "readwrite");
				for (const metadata of events) {
					const profile = getProfileContent(metadata);
					const names = getSearchNames(profile);
					updates[metadata.pubkey] = names;
					transaction
						?.objectStore("userSearch")
						.put({ pubkey: metadata.pubkey, names });
				}
				transaction?.commit();
				await transaction?.done;
				log(`Updated ${events.length} profiles`);
				return updates;
			}),
		);

		return from(cache ?? []).pipe(
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
	}, []);

	return (
		<UserSearchDirectoryContext.Provider value={userSearchDirectory}>
			{children}
		</UserSearchDirectoryContext.Provider>
	);
}
