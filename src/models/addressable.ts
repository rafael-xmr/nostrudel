import type { Model } from "applesauce-core";
import type { AddressPointerWithoutD } from "applesauce-core/helpers";
import type { NostrEvent } from "nostr-tools";
import { defer, EMPTY, ignoreElements, mergeWith } from "rxjs";

import type { EventStoreManagement } from "../services/event-store";
import type { LoadersManagement } from "../services/loaders";

export interface AddressableQueryManagement {
	AddressableQuery: (
		pointer: AddressPointerWithoutD,
	) => Model<NostrEvent | undefined>;
}

export default function createAddressableQueryManagement(
	eventStoreManagement: EventStoreManagement,
	loadersManagement: LoadersManagement,
): AddressableQueryManagement {
	const { eventStore } = eventStoreManagement;
	const { addressLoader } = loadersManagement;

	/** A model that loads an addressable event */
	function AddressableQuery(
		pointer: AddressPointerWithoutD,
	): Model<NostrEvent | undefined> {
		return (events) =>
			defer(() =>
				eventStore.hasReplaceable(
					pointer.kind,
					pointer.pubkey,
					pointer.identifier,
				)
					? EMPTY
					: addressLoader(pointer),
			).pipe(
				ignoreElements(),
				mergeWith(
					events.replaceable(pointer.kind, pointer.pubkey, pointer.identifier),
				),
			);
	}

	return {
		AddressableQuery,
	};
}
