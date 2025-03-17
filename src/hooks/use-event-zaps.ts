import { useEffect, useMemo } from "react";
import { useStoreQuery } from "applesauce-react/hooks";
import { parseCoordinate } from "applesauce-core/helpers";
import { EventZapsQuery } from "applesauce-core/queries";

import { useReadRelays } from "./use-client-relays";
import { useZapsLoader } from "~/providers/global/event-zaps-loader-provider";

export default function useEventZaps(
	uid: string,
	additionalRelays?: Iterable<string>,
	force?: boolean,
) {
	const relay = useReadRelays(additionalRelays);
	const zapsLoader = useZapsLoader();

	useEffect(() => {
		zapsLoader.requestZaps(uid, relay, force);
	}, [uid, relay.join("|"), force]);

	const pointer = useMemo(() => {
		if (uid.includes(":")) return parseCoordinate(uid, true);
		return uid;
	}, [uid]);

	return useStoreQuery(EventZapsQuery, pointer ? [pointer] : undefined) ?? [];
}
