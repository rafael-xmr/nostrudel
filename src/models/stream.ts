import type { Model } from "applesauce-core";
import { getAddressPointersFromList } from "applesauce-core/helpers";
import type { NostrEvent } from "nostr-tools";
import type { ProfilePointer } from "nostr-tools/nip19";
import { combineLatest, filter, of, switchMap } from "rxjs";

import createAddressableQueryManagement from "./addressable";
import type { EventStoreManagement } from "../services/event-store";
import type { LoadersManagement } from "../services/loaders";

export const STREAMER_CARDS_TYPE = 17777;
export const STREAMER_CARD_TYPE = 37777;

export function StreamCardsQuery(
	user: ProfilePointer,
	eventStoreManagement: EventStoreManagement,
	loadersManagement: LoadersManagement,
): Model<NostrEvent[] | undefined> {
	return (events) =>
		events
			.model(
				createAddressableQueryManagement(
					eventStoreManagement,
					loadersManagement,
				).AddressableQuery,
				{ kind: STREAMER_CARDS_TYPE, pubkey: user.pubkey, relays: user.relays },
			)
			.pipe(
				switchMap((event) => {
					if (!event) return of(undefined);

					const addresses = getAddressPointersFromList(event);
					return combineLatest(
						addresses.map((address) =>
							events
								.model(
									createAddressableQueryManagement(
										eventStoreManagement,
										loadersManagement,
									).AddressableQuery,
									address,
								)
								.pipe(filter((a) => !!a)),
						),
					);
				}),
			);
}
