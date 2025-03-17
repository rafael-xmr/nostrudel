import { useCallback, useContext, useMemo } from "react";
import { MenuItem } from "@chakra-ui/react";

import type { NostrEvent } from "../../types/nostr-event";
import { ExternalLinkIcon } from "../icons";
import { AppHandlerContext } from "../../providers/route/app-handler-provider";
import { useRelayHints } from "~/providers/global/relay-hints-provider";

export default function OpenInAppMenuItem({ event }: { event: NostrEvent }) {
	const relayHints = useRelayHints();
	const address = useMemo(
		() => relayHints.getSharableEventAddress(event),
		[relayHints, event],
	);
	const { openAddress } = useContext(AppHandlerContext);
	const open = useCallback(
		() => address && openAddress(address),
		[address, openAddress],
	);

	if (!address) return null;
	return (
		<MenuItem icon={<ExternalLinkIcon />} onClick={open}>
			View in app...
		</MenuItem>
	);
}
