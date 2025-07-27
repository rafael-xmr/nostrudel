import type { Model } from "applesauce-core";
import type { ProfilePointer } from "nostr-tools/nip19";
import { ignoreElements, mergeWith } from "rxjs";

import createAddressableQueryManagement from "./addressable";
import type { EventStoreManagement } from "../services/event-store";
import type { LoadersManagement } from "../services/loaders";

export function ContactsQuery(
	pubkey: string | ProfilePointer,
	eventStoreManagement: EventStoreManagement,
	loadersManagement: LoadersManagement,
): Model<ProfilePointer[]> {
	const pointer = typeof pubkey === "string" ? { pubkey } : pubkey;
	return (events) =>
		events
			.model(
				createAddressableQueryManagement(
					eventStoreManagement,
					loadersManagement,
				).AddressableQuery,
				{ kind: 3, pubkey: pointer.pubkey },
			)
			.pipe(ignoreElements(), mergeWith(events.contacts(pointer.pubkey)));
}
