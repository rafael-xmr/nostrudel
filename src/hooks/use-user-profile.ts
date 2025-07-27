import { useEventModel } from "applesauce-react/hooks";
import type { ProfilePointer } from "nostr-tools/nip19";
import { ProfileQuery } from "../models";
import { useLocalSettings } from "~/providers/global/preferences";

export default function useUserProfile(pubkey?: string | ProfilePointer) {
	const { loadersManagement } = useLocalSettings();
	return useEventModel(
		ProfileQuery,
		pubkey ? [pubkey, loadersManagement] : undefined,
	);
}
