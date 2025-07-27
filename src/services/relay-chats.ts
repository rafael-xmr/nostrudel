import { onlyEvents } from "applesauce-relay";
import { storeEvents } from "applesauce-relay/operators";
import type { NostrEvent } from "nostr-tools";
import { type Observable, repeat, retry, share, tap, timer } from "rxjs";
import { logger } from "../helpers/debug";
import type { EventStoreManagement } from "./event-store";
import type { RelayPoolManagement } from "./pool";

export const RELAY_CHAT_MESSAGE_KIND = 23333;

export interface RelayChatManagement {
	getRelayChatSubscription: (relay: string) => Observable<NostrEvent>;
}

export default function createRelayChatManagement(
	relayPoolManagement: RelayPoolManagement,
	eventStoreManagement: EventStoreManagement,
): RelayChatManagement {
	const log = logger.extend("RelayChat");
	const subscriptions = new Map<string, Observable<NostrEvent>>();
	const { pool } = relayPoolManagement;
	const { eventStore } = eventStoreManagement;

	const getRelayChatSubscription = (relay: string): Observable<NostrEvent> => {
		if (subscriptions.has(relay)) return subscriptions.get(relay)!;

		const subscription = pool
			.subscription([relay], { kinds: [RELAY_CHAT_MESSAGE_KIND] })
			.pipe(
				repeat(),
				retry(),
				storeEvents(eventStore),
				onlyEvents(),
				tap({
					complete: () => {
						log(`Closed subscription to ${relay}`);
					},
				}),
				share({ resetOnRefCountZero: () => timer(120_000) }),
			);

		subscriptions.set(relay, subscription);
		return subscription;
	};

	return {
		getRelayChatSubscription,
	};
}
