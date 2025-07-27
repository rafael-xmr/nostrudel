import { useEventModel } from "applesauce-react/hooks";
import type { ProfilePointer } from "nostr-tools/nip19";
import { UserListsQuery } from "../models/lists";
import { useMemo } from "react";
import { useLocalSettings } from "~/providers/global/preferences";

export default function useUserSets(pubkey?: string | ProfilePointer) {
	const pointer = useMemo(
		() => (typeof pubkey === "string" ? { pubkey } : pubkey),
		[pubkey],
	);
	const { loadersManagement } = useLocalSettings();
	return useEventModel(
		UserListsQuery,
		pointer ? [pointer, loadersManagement] : undefined,
	);
}
