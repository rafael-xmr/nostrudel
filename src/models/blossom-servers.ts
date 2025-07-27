import type { Model } from "applesauce-core";
import { BLOSSOM_SERVER_LIST_KIND } from "applesauce-core/helpers";
import { UserBlossomServersModel } from "applesauce-core/models";
import type { ProfilePointer } from "nostr-tools/nip19";
import { ignoreElements, merge } from "rxjs";

import createAddressableQueryManagement from "./addressable";
import type { EventStoreManagement } from "../services/event-store";
import type { LoadersManagement } from "../services/loaders";

/** A model that loads a users profile */
export function BlossomServersQuery(
	pubkey: string | ProfilePointer,
	eventStoreManagement: EventStoreManagement,
	loadersManagement: LoadersManagement,
): Model<URL[] | undefined> {
	const pointer = typeof pubkey === "string" ? { pubkey } : pubkey;
	return (events) =>
		merge(
			events
				.model(
					createAddressableQueryManagement(
						eventStoreManagement,
						loadersManagement,
					).AddressableQuery,
					{
						kind: BLOSSOM_SERVER_LIST_KIND,
						pubkey: pointer.pubkey,
						relays: pointer.relays,
					},
				)
				.pipe(ignoreElements()),
			events.model(UserBlossomServersModel, pointer.pubkey),
		);
}
