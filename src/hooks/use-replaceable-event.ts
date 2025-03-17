import { useEffect, useMemo } from "react";
import { useStoreQuery } from "applesauce-react/hooks";
import { ReplaceableQuery } from "applesauce-core/queries";

import { useReadRelays } from "./use-client-relays";
import {
	type CustomAddressPointer,
	parseCoordinate,
} from "../helpers/nostr/event";
import { useReplaceableEventLoader } from "~/providers/global/replaceable-loader-provider";

export default function useReplaceableEvent(
	cord: string | CustomAddressPointer | undefined,
	additionalRelays?: Iterable<string>,
	force?: boolean,
) {
	const readRelays = useReadRelays(additionalRelays);
	const parsed = useMemo(
		() => (typeof cord === "string" ? parseCoordinate(cord) : cord),
		[cord],
	);

	const replaceableEventLoader = useReplaceableEventLoader();

	useEffect(() => {
		if (!parsed) return;

		replaceableEventLoader?.next({
			kind: parsed.kind,
			pubkey: parsed.pubkey,
			identifier: parsed.identifier,
			relays: [...readRelays, ...(parsed.relays ?? [])],
			force,
		});
	}, [
		replaceableEventLoader,
		parsed?.kind,
		parsed?.pubkey,
		parsed?.identifier,
		readRelays.join("|"),
		force,
	]);

	return useStoreQuery(
		ReplaceableQuery,
		parsed ? [parsed.kind, parsed.pubkey, parsed.identifier] : undefined,
	);
}
