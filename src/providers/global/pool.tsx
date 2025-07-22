import {
	createContext,
	useContext,
	useMemo,
	type PropsWithChildren,
} from "react";

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
import type { NostrRequest } from "applesauce-loaders";

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

const RelayPoolContext = createContext<
	| {
			pool: RelayPool;
			connections$: Observable<{
				[x: string]: ConnectionState;
			}>;
			notices$: BehaviorSubject<Notice[]>;
			nostrRequest: NostrRequest;
	  }
	| undefined
>(undefined);

export function useRelayPoolProvider() {
	return useContext(RelayPoolContext);
}

let cachedPool: RelayPool | undefined;

export default function RelayPoolProvider({ children }: PropsWithChildren) {
	// capture all notices sent from relays
	const notices$ = new BehaviorSubject<Notice[]>([]);

	const pool = useMemo(() => {
		if (cachedPool) return cachedPool;
		const pool = new RelayPool();

		// NOTE: hack to set default relay props
		interval(1000).subscribe(() => {
			for (const relay of pool.relays.values()) {
				relay.keepAlive = 120_000;
			}
		});

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

		return pool;
	}, [notices$]);

	const connections$ = useMemo(() => {
		return pool.relays$.pipe(
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
	}, [pool]);

	const nostrRequest = (
		relays: string[],
		filters: Filter[],
		id?: string,
	): Observable<NostrEvent> => pool.request(relays, filters, { id });

	return (
		<RelayPoolContext.Provider
			value={{
				pool,
				connections$,
				notices$,
				nostrRequest,
			}}
		>
			{children}
		</RelayPoolContext.Provider>
	);
}
