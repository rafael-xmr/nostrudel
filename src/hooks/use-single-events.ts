import { useEventStore, useObservableMemo } from "applesauce-react/hooks";
import hash_sum from "hash-sum";
import type { NostrEvent } from "nostr-tools";
import { combineLatest, map } from "rxjs";

import EventQuery from "../models/events";
import { useLocalSettings } from "~/providers/global/preferences";

export default function useSingleEvents(
	ids?: string[],
	relays?: string[],
): NostrEvent[] {
	const eventStore = useEventStore();
	const { loadersManagement } = useLocalSettings();

	return (
		useObservableMemo(() => {
			const models =
				ids?.map((id) =>
					eventStore.model(EventQuery, { id, relays }, loadersManagement),
				) ?? [];

			return combineLatest(models).pipe(
				map((events) => events.filter((e) => !!e)),
			);
		}, [hash_sum(ids), eventStore, hash_sum(relays)]) ?? []
	);
}
