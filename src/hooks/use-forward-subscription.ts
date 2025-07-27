import { mapEventsToStore } from "applesauce-core";
import { useObservableMemo } from "applesauce-react/hooks";
import { useEventStore } from "applesauce-react/hooks/use-event-store";
import { onlyEvents } from "applesauce-relay";
import hash_sum from "hash-sum";
import { nanoid } from "nanoid";
import type { Filter } from "nostr-tools";
import { useMemo } from "react";
import { useLocalSettings } from "~/providers/global/preferences";

export default function useSimpleSubscription(
	relays?: string[],
	filters?: Filter | Filter[],
) {
	const { relayPoolManagement } = useLocalSettings();
	const eventStore = useEventStore();
	const id = useMemo(() => nanoid(10), []);

	return useObservableMemo(
		() =>
			relays &&
			filters &&
			relayPoolManagement.pool
				.subscription(relays, filters, { id })
				.pipe(onlyEvents(), mapEventsToStore(eventStore)),
		[hash_sum(relays), hash_sum(filters), id, eventStore],
	);
}
