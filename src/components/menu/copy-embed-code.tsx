import { MenuItem } from "@chakra-ui/react";
import type { NostrEvent } from "nostr-tools";

import { useLocalSettings } from "~/providers/global/preferences";
import { CopyToClipboardIcon } from "../icons";

export default function CopyEmbedCodeMenuItem({
	event,
}: {
	event: NostrEvent;
}) {
	const { relayHintsManagement } = useLocalSettings();
	const address = relayHintsManagement.getSharableEventAddress(event);

	return (
		address && (
			<MenuItem
				onClick={() => window.navigator.clipboard.writeText("nostr:" + address)}
				icon={<CopyToClipboardIcon />}
			>
				Copy embed code
			</MenuItem>
		)
	);
}
