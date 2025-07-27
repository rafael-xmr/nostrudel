import type { Model } from "applesauce-core";
import type { Mutes } from "applesauce-core/helpers";
import { kinds } from "nostr-tools";
import type { ProfilePointer } from "nostr-tools/nip19";
import { ignoreElements, mergeWith } from "rxjs";

import createAddressableQueryManagement from "./addressable";
import type { EventStoreManagement } from "../services/event-store";
import type { LoadersManagement } from "../services/loaders";

export function MutesQuery(
	user: string | ProfilePointer,
	eventStoreManagement: EventStoreManagement,
	loadersManagement: LoadersManagement,
): Model<Mutes | undefined> {
	const pointer = typeof user === "string" ? { pubkey: user } : user;
	return (events) =>
		events
			.model(
				createAddressableQueryManagement(
					eventStoreManagement,
					loadersManagement,
				).AddressableQuery,
				{
					kind: kinds.Mutelist,
					pubkey: pointer.pubkey,
					relays: pointer.relays,
				},
			)
			.pipe(ignoreElements(), mergeWith(events.mutes(pointer.pubkey)));
}
