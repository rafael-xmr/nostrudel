import { ButtonProps, IconButton, useDisclosure } from "@chakra-ui/react";

import { NostrEvent } from "../../types/nostr-event";
import { LightningIcon } from "../icons";
import ZapModal from "../event-zap-modal";

export type SingleZapButton = Omit<ButtonProps, "children"> & {
	event: NostrEvent;
	allowComment?: boolean;
	showEventPreview?: boolean;
};

export default function SingleZapButton({
	event,
	allowComment,
	showEventPreview,
	...props
}: SingleZapButton) {
	const { isOpen, onOpen, onClose } = useDisclosure();

	return (
		<>
			<IconButton
				icon={<LightningIcon color="yellow.400" verticalAlign="sub" />}
				aria-label="Zap"
				title="Zap"
				{...props}
				onClick={onOpen}
			/>

			{isOpen && (
				<ZapModal
					isOpen={isOpen}
					pubkey={event.pubkey}
					event={event}
					onClose={onClose}
					onZapped={onClose}
					allowComment={allowComment}
					showEmbed={showEventPreview}
				/>
			)}
		</>
	);
}
