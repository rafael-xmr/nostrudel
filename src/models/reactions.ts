import type { Model } from "applesauce-core";
import { defer, ignoreElements, mergeWith } from "rxjs";
import type { NostrEvent } from "nostr-tools";
import type { LoadersManagement } from "~/services/loaders";

export function ReactionsQuery(
	event: NostrEvent,
	loadersManagement: LoadersManagement,
	relays?: string[],
): Model<NostrEvent[]> {
	return (events) =>
		defer(() => loadersManagement.reactionsLoader(event, relays)).pipe(
			ignoreElements(),
			mergeWith(events.reactions(event)),
		);
}
