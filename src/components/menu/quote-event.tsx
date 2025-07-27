import { MenuItem, useToast } from "@chakra-ui/react";
import type { NostrEvent } from "nostr-tools";
import { useCallback, useContext, useMemo } from "react";

import useUserProfile from "../../hooks/use-user-profile";
import { PostModalContext } from "../../providers/route/post-modal-provider";
import { useLocalSettings } from "~/providers/global/preferences";
import { QuoteIcon } from "../icons";

export default function QuoteEventMenuItem({ event }: { event: NostrEvent }) {
	const toast = useToast();
	const { relayHintsManagement } = useLocalSettings();
	const address = useMemo(
		() => relayHintsManagement.getSharableEventAddress(event),
		[event],
	);
	const metadata = useUserProfile(event.pubkey);
	const { openModal } = useContext(PostModalContext);

	const share = useCallback(async () => {
		let content = "";

		content += "\nnostr:" + address;
		openModal({ cacheFormKey: null, initContent: content });
	}, [metadata, event, toast, address]);

	return (
		address && (
			<MenuItem onClick={share} icon={<QuoteIcon />}>
				Quote Event
			</MenuItem>
		)
	);
}
