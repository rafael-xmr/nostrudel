import { useEffect } from "react";
import type { NostrEvent } from "nostr-tools";
import { getEventUID } from "applesauce-core/helpers";
import { useStoreQuery } from "applesauce-react/hooks";
import { ReactionsQuery } from "applesauce-core/queries";

import { useReadRelays } from "./use-client-relays";
import { useReactionsLoader } from "~/providers/global/event-reactions-loader-provider";

export default function useEventReactions(
	event: NostrEvent,
	additionalRelays?: string[],
	force?: boolean,
) {
	const relays = useReadRelays(additionalRelays);
	const reactionsLoader = useReactionsLoader();

	useEffect(() => {
		reactionsLoader.requestReactions(getEventUID(event), relays, force);
	}, [reactionsLoader, event, relays.join(","), force]);

	return useStoreQuery(ReactionsQuery, [event]);
}
