import { useEventModel } from "applesauce-react/hooks";
import type { EventPointer } from "nostr-tools/nip19";
import { useMemo } from "react";

import EventQuery from "../models/events";
import { useLocalSettings } from "~/providers/global/preferences";

export default function useSingleEvent(id?: string | EventPointer) {
	const pointer = useMemo(() => (typeof id === "string" ? { id } : id), [id]);
	const { loadersManagement } = useLocalSettings();

	return useEventModel(
		EventQuery,
		pointer ? [pointer, loadersManagement] : undefined,
	);
}
