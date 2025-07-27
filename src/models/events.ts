import { type Model, withImmediateValueOrDefault } from "applesauce-core";
import type { NostrEvent } from "nostr-tools";
import type { EventPointer } from "nostr-tools/nip19";
import { defer, EMPTY, ignoreElements, mergeWith } from "rxjs";
import type { LoadersManagement } from "~/services/loaders";

/** Loads and subscribes to an event */
export default function EventQuery(
	event: string | EventPointer,
	loadersManagement: LoadersManagement,
): Model<NostrEvent | undefined> {
	const pointer = typeof event === "string" ? { id: event } : event;

	return (events) =>
		defer(() =>
			events.hasEvent(pointer.id)
				? EMPTY
				: loadersManagement.eventLoader(pointer),
		).pipe(
			ignoreElements(),
			mergeWith(events.event(pointer.id)),
			withImmediateValueOrDefault(undefined),
		);
}
