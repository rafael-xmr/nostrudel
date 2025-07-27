import type { AddressPointerWithoutD } from "applesauce-core/helpers";
import { useEventModel } from "applesauce-react/hooks";
import hash_sum from "hash-sum";
import type { AddressPointer } from "nostr-tools/nip19";
import { useMemo } from "react";

import { parseCoordinate } from "../helpers/nostr/event";

import createAddressableQueryManagement from "../models/addressable";
import { useLocalSettings } from "~/providers/global/preferences";

export default function useReplaceableEvent(
	cord: string | AddressPointer | AddressPointerWithoutD | undefined,
) {
	const { eventStoreManagement, loadersManagement } = useLocalSettings();

	const parsed = useMemo(
		() => (typeof cord === "string" ? parseCoordinate(cord) : cord),
		[hash_sum(cord)],
	);

	return useEventModel(
		createAddressableQueryManagement(eventStoreManagement, loadersManagement)
			.AddressableQuery,
		parsed ? [parsed] : undefined,
	);
}
