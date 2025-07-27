import type { Model } from "applesauce-core";
import { kinds } from "nostr-tools";
import type { ProfilePointer } from "nostr-tools/nip19";
import { ignoreElements, mergeWith } from "rxjs";

import createAddressableQueryManagement from "./addressable";
import type { EventStoreManagement } from "../services/event-store";
import type { LoadersManagement } from "../services/loaders";

/** A model that loads a users profile */
export function MailboxesQuery(
	pubkey: string | ProfilePointer,
	eventStoreManagement: EventStoreManagement,
	loadersManagement: LoadersManagement,
): Model<{ inboxes: string[]; outboxes: string[] } | undefined> {
	const pointer = typeof pubkey === "string" ? { pubkey } : pubkey;
	return (events) =>
		events
			.model(
				createAddressableQueryManagement(
					eventStoreManagement,
					loadersManagement,
				).AddressableQuery,
				{
					kind: kinds.RelayList,
					pubkey: pointer.pubkey,
					relays: pointer.relays,
				},
			)
			.pipe(ignoreElements(), mergeWith(events.mailboxes(pointer.pubkey)));
}
