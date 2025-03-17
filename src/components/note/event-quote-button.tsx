import { useContext } from "react";
import { IconButton, type IconButtonProps } from "@chakra-ui/react";
import type { NostrEvent } from "nostr-tools";

import { QuoteEventIcon } from "../icons";
import { PostModalContext } from "../../providers/route/post-modal-provider";
import { useRelayHints } from "~/providers/global/relay-hints-provider";

export default function EventQuoteButton({
	event,
	"aria-label": ariaLabel,
	title = "Quote Event",
	...props
}: Omit<IconButtonProps, "children" | "onClick" | "aria-label"> & {
	event: NostrEvent;
	"aria-label"?: string;
}) {
	const relayHints = useRelayHints();
	const { openModal } = useContext(PostModalContext);

	const handleClick = () => {
		const nevent = relayHints.getSharableEventAddress(event);
		openModal({ cacheFormKey: null, initContent: "\nnostr:" + nevent });
	};

	return (
		<IconButton
			icon={<QuoteEventIcon />}
			onClick={handleClick}
			aria-label={ariaLabel || title}
			title={title}
			{...props}
		/>
	);
}
