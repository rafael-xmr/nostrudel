import * as nostrSocialGraph from "nostr-social-graph";
import { kinds, type NostrEvent } from "nostr-tools";
import {
	BehaviorSubject,
	combineLatest,
	exhaustMap,
	finalize,
	firstValueFrom,
	map,
	type Observable,
	scan,
	skip,
	tap,
	throttleTime,
} from "rxjs";

import { SOCIAL_GRAPH_FALLBACK_PUBKEY } from "../const";
import { logger } from "../helpers/debug";
import type { AccountsManagement } from "./accounts";
import type { DatabaseManagement } from "./database";
import type { EventStoreManagement } from "./event-store";
import type { LoadersManagement } from "./loaders";

export interface SocialGraphManagement {
	socialGraph$: BehaviorSubject<nostrSocialGraph.SocialGraph>;
	saveSocialGraph: (graph: nostrSocialGraph.SocialGraph) => Promise<void>;
	exportGraph: () => Promise<void>;
	importGraph: () => void;
	replaceSocialGraph: (
		data: nostrSocialGraph.SerializedSocialGraph,
	) => Promise<void>;
	updateSocialGraph: (distance?: number) => Observable<string>;
	loadSocialGraphFromUrl: (url: string) => Promise<void>;
	clearSocialGraph: () => Promise<void>;
	sortByDistanceAndConnections: {
		(keys: string[]): string[];
		<T>(keys: T[], getKey: (d: T) => string): T[];
	};
	sortComparePubkeys: (a: string, b: string) => number;
}

export default async function createSocialGraphManagement(
	accountsManagement: AccountsManagement,
	databaseManagement: DatabaseManagement,
	eventStoreManagement: EventStoreManagement,
	loadersManagement: LoadersManagement,
): Promise<SocialGraphManagement> {
	const log = logger.extend("SocialGraph");
	const cacheKey = "social-graph";

	log("Social graph initializing...");

	// Get the key-value store
	const db = await databaseManagement.database;
	const kvStore = {
		async getItem<T>(key: string): Promise<T | undefined> {
			try {
				return await db.get("kv", key);
			} catch {
				return undefined;
			}
		},
		async setItem<T>(key: string, value: T): Promise<void> {
			await db.put("kv", value, key);
		},
		async deleteItem(key: string): Promise<void> {
			await db.delete("kv", key);
		},
	};

	// Load the social graph from the cache
	const cached =
		await kvStore.getItem<nostrSocialGraph.SerializedSocialGraph>(cacheKey);

	/** An observable that emits the social graph for the active account */
	const socialGraph$ = new BehaviorSubject<nostrSocialGraph.SocialGraph>(
		new nostrSocialGraph.SocialGraph(
			accountsManagement.accounts.active?.pubkey ??
				SOCIAL_GRAPH_FALLBACK_PUBKEY,
			cached,
		),
	);

	if (cached) {
		const size = socialGraph$.value.size();
		log(
			`Loaded social graph from cache (${size.users} users, ${size.mutes} mutes)`,
		);
	}

	// Set the social graph root to the active account pubkey
	combineLatest([socialGraph$, accountsManagement.accounts.active$]).subscribe(
		([graph, account]) => {
			graph.setRoot(account?.pubkey ?? SOCIAL_GRAPH_FALLBACK_PUBKEY);
		},
	);

	// Update the social graph with all contacts and mutelist events
	eventStoreManagement.eventStore
		.filters({ kinds: [kinds.Contacts, kinds.Mutelist] })
		.pipe(
			// Add event to graph
			tap((event) => socialGraph$.value.handleEvent(event)),
			// Only update the graph every 15s
			throttleTime(15_000),
		)
		.subscribe(() => {
			// Notify subscribers of the updated graph
			socialGraph$.next(socialGraph$.value);
		});

	/** Save the social graph to the cache */
	const saveSocialGraph = async (graph: nostrSocialGraph.SocialGraph) => {
		const size = graph.size();

		// Don't save empty graphs
		if (size.users === 0) return;

		log(`Saving social graph (${size.users} users, ${size.mutes} mutes)`);
		await kvStore.setItem(cacheKey, graph.serialize());
		log("Saved social graph to cache");
	};

	// Save the active users social graph at most every 10 seconds
	socialGraph$
		.pipe(
			skip(1),
			throttleTime(10_000),
			exhaustMap((graph) => saveSocialGraph(graph)),
		)
		.subscribe();

	/** Exports the social graph to a file */
	const exportGraph = async () => {
		const graph = await firstValueFrom(socialGraph$);
		const data = graph.serialize();
		const url = URL.createObjectURL(
			new File([JSON.stringify(data)], "social_graph.json", {
				type: "text/json",
			}),
		);
		const a = document.createElement("a");
		a.href = url;
		a.download = "social_graph.json";
		a.click();
	};

	/** Loads a social graph from a file and merges it with the existing graph */
	const importGraph = () => {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = ".json";
		input.multiple = false;
		input.onchange = () => {
			if (input.files?.length) {
				const file = input.files[0];
				file
					.text()
					.then(async (json) => {
						const data = JSON.parse(
							json,
						) as nostrSocialGraph.SerializedSocialGraph;
						if (
							!Reflect.has(data, "uniqueIds") ||
							!Reflect.has(data, "followLists") ||
							!Reflect.has(data, "muteLists")
						)
							throw new Error("Invalid graph data");

						replaceSocialGraph(data);
					})
					.catch((e) => {
						console.error("failed to load social graph from file:", e);
					});
			}
		};
		input.click();
	};

	/**
	 * Replaces the social graph with a new one
	 * TODO: this should merge the graph once there are not bugs
	 */
	const replaceSocialGraph = async (
		data: nostrSocialGraph.SerializedSocialGraph,
	) => {
		const graph = await firstValueFrom(socialGraph$);
		socialGraph$.next(new nostrSocialGraph.SocialGraph(graph.getRoot(), data));
	};

	/** Updates the social graph out to a given distance */
	const updateSocialGraph = (distance = 2): Observable<string> => {
		const root = socialGraph$.value.getRoot();

		log(`Updating social graph out to ${distance} degrees`);
		return loadersManagement.socialGraphLoader({ pubkey: root, distance }).pipe(
			scan((acc, events) => acc.concat(events), [] as NostrEvent[]),
			// Only update the graph every 10 seconds
			throttleTime(10_000),
			map((events) => {
				log("Updating social graph");
				// Notify subscribers of the updated graph
				socialGraph$.next(socialGraph$.value);

				return `Loaded ${events.length} follow lists`;
			}),
			finalize(() => {
				const size = socialGraph$.value.size();
				return `Social graph update complete (${size.users} users, ${size.mutes} mutes)`;
			}),
		);
	};

	/** Replaces the social graph with a new one from a URL */
	const loadSocialGraphFromUrl = async (url: string) => {
		const res = await fetch(url);
		const data = (await res.json()) as nostrSocialGraph.SerializedSocialGraph;
		if (
			!Reflect.has(data, "uniqueIds") ||
			!Reflect.has(data, "followLists") ||
			!Reflect.has(data, "muteLists")
		)
			throw new Error("Invalid graph data");
		await replaceSocialGraph(data);
	};

	/** Clears the social graph */
	const clearSocialGraph = async () => {
		const root = socialGraph$.value.getRoot();
		const emptyGraph = new nostrSocialGraph.SocialGraph(root);
		socialGraph$.next(emptyGraph);
		await kvStore.deleteItem(cacheKey);
	};

	/** Sort an array of things by their authors distance from the root */
	function sortByDistanceAndConnections(keys: string[]): string[];
	function sortByDistanceAndConnections<T>(
		keys: T[],
		getKey: (d: T) => string,
	): T[];
	function sortByDistanceAndConnections<T>(
		keys: T[],
		getKey?: (d: T) => string,
	): T[] {
		return Array.from(keys).sort((a, b) => {
			const aKey = typeof a === "string" ? a : getKey?.(a) || "";
			const bKey = typeof b === "string" ? b : getKey?.(b) || "";

			const v = sortComparePubkeys(aKey, bKey);
			if (v === 0) {
				// tied break with original index
				const ai = keys.indexOf(a);
				const bi = keys.indexOf(b);
				if (ai < bi) return -1;
				else if (ai > bi) return 1;
				return 0;
			}
			return v;
		});
	}

	/** Compare the distance of two pubkeys from the root */
	const sortComparePubkeys = (a: string, b: string) => {
		const graph = socialGraph$.value;
		const aDist = graph.getFollowDistance(a);
		const bDist = graph.getFollowDistance(b);
		return Math.abs(aDist - bDist);
	};

	// Debug exposure
	if (import.meta.env.DEV) {
		// @ts-expect-error debug
		window.socialGraph = socialGraph$;
	}

	return {
		socialGraph$,
		saveSocialGraph,
		exportGraph,
		importGraph,
		replaceSocialGraph,
		updateSocialGraph,
		loadSocialGraphFromUrl,
		clearSocialGraph,
		sortByDistanceAndConnections,
		sortComparePubkeys,
	};
}
