import * as React from "react";
import { useStoreQuery } from "applesauce-react/hooks";

import { useReadRelays } from "./use-client-relays";
import replaceableEventsService, {
	type RequestOptions,
} from "../services/replaceable-events";
import {
	type CustomAddressPointer,
	parseCoordinate,
} from "../helpers/nostr/event";
import { ReplaceableQuery } from "applesauce-core/queries";

export default function useReplaceableEvent(
	cord: string | CustomAddressPointer | undefined,
	additionalRelays?: Iterable<string>,
	opts: RequestOptions = {},
) {
	const readRelays = useReadRelays(additionalRelays);
	const parsed = React.useMemo(
		() => (typeof cord === "string" ? parseCoordinate(cord) : cord),
		[cord],
	);

	React.useEffect(() => {
		if (!parsed) return;

		replaceableEventsService.requestEvent(
			parsed.relays ? [...readRelays, ...parsed.relays] : readRelays,
			parsed.kind,
			parsed.pubkey,
			parsed.identifier,
			opts,
		);
	}, [
		parsed,
		readRelays.urls.join("|"),
		opts?.alwaysRequest,
		opts?.ignoreCache,
	]);

	return useStoreQuery(
		ReplaceableQuery,
		parsed ? [parsed.kind, parsed.pubkey, parsed.identifier] : undefined,
	);
}
