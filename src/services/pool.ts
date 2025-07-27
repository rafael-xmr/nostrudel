import { RelayPool } from "applesauce-relay";
import type { Filter, NostrEvent } from "nostr-tools";
import {
	BehaviorSubject,
	combineLatest,
	interval,
	map,
	merge,
	type Observable,
	shareReplay,
	switchMap,
} from "rxjs";
import { nanoid } from "nanoid";

export type ConnectionState =
	| "connecting"
	| "connected"
	| "retrying"
	| "dormant"
	| "error";

export type Notice = {
	id: string;
	from: string;
	message: string;
	timestamp: Date;
};

export interface RelayPoolManagement {
	pool: RelayPool;
	connections$: Observable<Record<string, ConnectionState>>;
	notices$: BehaviorSubject<Notice[]>;
	nostrRequest: (
		relays: string[],
		filters: Filter[],
		id?: string,
	) => Observable<NostrEvent>;
	startKeepAlive: () => void;
	stopKeepAlive: () => void;
}

export default function createRelayPoolManagement(): RelayPoolManagement {
	const pool = new RelayPool();
	const notices$ = new BehaviorSubject<Notice[]>([]);

	// Keep alive interval management
	let keepAliveInterval: ReturnType<typeof interval> | null = null;
	let keepAliveSubscription: any = null;

	const startKeepAlive = () => {
		if (keepAliveSubscription) return; // Already running

		keepAliveInterval = interval(1000);
		keepAliveSubscription = keepAliveInterval.subscribe(() => {
			for (const relay of pool.relays.values()) {
				relay.keepAlive = 120_000;
			}
		});
	};

	const stopKeepAlive = () => {
		if (keepAliveSubscription) {
			keepAliveSubscription.unsubscribe();
			keepAliveSubscription = null;
			keepAliveInterval = null;
		}
	};

	const connections$ = pool.relays$.pipe(
		switchMap((relays) =>
			// Create a map of relay url -> connection state
			combineLatest(
				Object.fromEntries(
					Array.from(relays.entries()).map(([url, relay]) => [
						url,
						combineLatest([
							relay.connected$,
							relay.attempts$,
							relay.error$,
						]).pipe(
							map(([connected, attempts, error]): ConnectionState => {
								if (connected) return "connected";
								if (error) return "error";
								if (!connected && attempts > 0) return "retrying";
								return "dormant";
							}),
						),
					]),
				),
			),
		),
		shareReplay(1),
	);

	// Subscribe to notices and add them to the notices$ subject
	pool.relays$
		.pipe(
			switchMap((relays) =>
				merge(
					...Array.from(relays.values()).map((relay) =>
						relay.notice$.pipe(
							map(
								(message) =>
									({
										id: nanoid(),
										from: relay.url,
										message: message,
										timestamp: new Date(),
									}) as Notice,
							),
						),
					),
				),
			),
		)
		.subscribe((notice) => {
			notices$.next([...notices$.value, notice]);
		});

	const nostrRequest = (
		relays: string[],
		filters: Filter[],
		id?: string,
	): Observable<NostrEvent> => {
		return pool.request(relays, filters, { id });
	};

	// Start keep alive by default
	startKeepAlive();

	return {
		pool,
		connections$,
		notices$,
		nostrRequest,
		startKeepAlive,
		stopKeepAlive,
	};
}
