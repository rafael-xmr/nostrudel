import { useEffect, useMemo } from "react";
import { useStoreQuery } from "applesauce-react/hooks";
import type { EventPointer } from "nostr-tools/nip19";
import { Queries } from "applesauce-core";

import { useReadRelays } from "./use-client-relays";

export default function useSingleEvent(
	id?: string | EventPointer,
	additionalRelays?: Iterable<string>,
) {
	const pointer = useMemo(() => (typeof id === "string" ? { id } : id), [id]);
	const readRelays = useReadRelays();

	useEffect(() => {
		if (pointer)
			window.singleEventLoader.next({
				id: pointer.id,
				relays: [
					...(pointer.relays ?? []),
					...readRelays,
					...(additionalRelays ?? []),
				],
			});
	}, [pointer, readRelays.join("|")]);

	return useStoreQuery(
		Queries.SingleEventQuery,
		pointer ? [pointer.id] : undefined,
	);
}
