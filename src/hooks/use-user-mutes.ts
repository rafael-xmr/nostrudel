import { useEventModel } from "applesauce-react/hooks";
import type { ProfilePointer } from "nostr-tools/nip19";

import { MutesQuery } from "../models/mutes";
import { useLocalSettings } from "~/providers/global/preferences";

export default function useUserMutes(pubkey?: string | ProfilePointer) {
	const { eventStoreManagement, loadersManagement } = useLocalSettings();
	return useEventModel(
		MutesQuery,
		pubkey ? [pubkey, eventStoreManagement, loadersManagement] : undefined,
	);
}
