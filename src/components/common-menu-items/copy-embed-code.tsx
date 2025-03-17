import { MenuItem } from "@chakra-ui/react";

import type { NostrEvent } from "../../types/nostr-event";
import { CopyToClipboardIcon } from "../icons";
import { useRelayHints } from "~/providers/global/relay-hints-provider";

export default function CopyEmbedCodeMenuItem({
	event,
}: { event: NostrEvent }) {
	const relayHints = useRelayHints();
	const address = relayHints.getSharableEventAddress(event);

	return (
		address && (
			<MenuItem
				onClick={() => window.navigator.clipboard.writeText(`nostr:${address}`)}
				icon={<CopyToClipboardIcon />}
			>
				Copy embed code
			</MenuItem>
		)
	);
}
