import { useEventModel } from "applesauce-react/hooks";

import type { CustomAddressPointer } from "../helpers/nostr/event";

import createAddressableQueryManagement from "../models/addressable";
import { useLocalSettings } from "~/providers/global/preferences";

export default function useAddressableEvent(
	address: CustomAddressPointer | undefined,
) {
	const { eventStoreManagement, loadersManagement } = useLocalSettings();

	return useEventModel(
		createAddressableQueryManagement(eventStoreManagement, loadersManagement)
			.AddressableQuery,
		address ? [address] : undefined,
	);
}
