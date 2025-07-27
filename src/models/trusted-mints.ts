import type { Model } from "applesauce-core";
import { isSafeRelayURL } from "applesauce-core/helpers";
import type { ProfilePointer } from "nostr-tools/nip19";
import { map } from "rxjs/operators";

import createAddressableQueryManagement from "./addressable";
import type { EventStoreManagement } from "../services/event-store";
import type { LoadersManagement } from "../services/loaders";

type TrustedMints = {
	mints: string[];
	relays: Set<string>;
	pubkey?: string;
};

export default function TrustedMintsModel(
	user: string | ProfilePointer,
	eventStoreManagement: EventStoreManagement,
	loadersManagement: LoadersManagement,
): Model<TrustedMints | undefined> {
	const pointer = typeof user === "string" ? { pubkey: user } : user;

	return (events) =>
		events
			.model(
				createAddressableQueryManagement(
					eventStoreManagement,
					loadersManagement,
				).AddressableQuery,
				{ kind: 10019, pubkey: pointer.pubkey, relays: pointer.relays },
			)
			.pipe(
				map((event) => {
					if (!event) return undefined;

					const relays = new Set<string>();
					const mints: string[] = [];
					let pubkey: string | undefined;

					for (const tag of event.tags) {
						switch (tag[0]) {
							case "mint":
								if (tag[1]) mints.push(tag[1]);
								break;

							case "relay":
								if (tag[1] && isSafeRelayURL(tag[1])) {
									mints.push(tag[1]);
								}
								break;

							case "pubkey":
								if (tag[1]) pubkey = tag[1];
								break;
						}
					}

					return { relays, mints, pubkey };
				}),
			);
}
