import { useEffect } from "react";
import { Queries } from "applesauce-core";
import { useStoreQuery } from "applesauce-react/hooks";

import { useReadRelays } from "./use-client-relays";
import { useSingleEventLoader } from "~/providers/global/single-event-loader-provider";

export default function useSingleEvents(
	ids?: string[],
	additionalRelays?: Iterable<string>,
) {
	const readRelays = useReadRelays(additionalRelays);
	const singleEventLoader = useSingleEventLoader();

	useEffect(() => {
		if (!ids) return;

		for (const id of ids) {
			singleEventLoader?.next({ id, relays: [...readRelays] });
		}
	}, [singleEventLoader, ids, readRelays.join("|")]);

	return (
		useStoreQuery(Queries.TimelineQuery, ids ? [{ ids }] : undefined) ?? []
	);
}
