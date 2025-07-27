import { useEventStore, useObservableMemo } from "applesauce-react/hooks";
import type { NostrEvent } from "nostr-tools";

import hash_sum from "hash-sum";
import { combineLatest, map, of } from "rxjs";
import {
	type CustomAddressPointer,
	parseCoordinate,
} from "../helpers/nostr/event";

import createAddressableQueryManagement from "../models/addressable";
import { useLocalSettings } from "~/providers/global/preferences";

export default function useReplaceableEvents(
	coordinates: string[] | CustomAddressPointer[] | undefined,
): NostrEvent[] {
	const { eventStoreManagement, loadersManagement } = useLocalSettings();
	const eventStore = useEventStore();

	return (
		useObservableMemo(() => {
			if (!coordinates) return of([]);

			const models = coordinates
				.map((str) => (typeof str === "string" ? parseCoordinate(str) : str))
				.filter((c) => c !== null)
				.map((cord) =>
					eventStore.model(
						createAddressableQueryManagement(
							eventStoreManagement,
							loadersManagement,
						).AddressableQuery,
						cord,
					),
				);

			return combineLatest(models).pipe(
				map((events) => events.filter((e) => e !== undefined)),
			);
		}, [hash_sum(coordinates), eventStore]) ?? []
	);
}
