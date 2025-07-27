import { MenuItem } from "@chakra-ui/react";
import type { NostrEvent } from "nostr-tools";
import { useCallback, useContext, useMemo } from "react";

import { AppHandlerContext } from "../../providers/route/app-handler-provider";
import { useLocalSettings } from "~/providers/global/preferences";
import { ExternalLinkIcon } from "../icons";

export default function OpenInAppMenuItem({ event }: { event: NostrEvent }) {
	const { relayHintsManagement } = useLocalSettings();
	const address = useMemo(
		() => relayHintsManagement.getSharableEventAddress(event),
		[event],
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
