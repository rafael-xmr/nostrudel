import { type ButtonProps, Button, useDisclosure } from "@chakra-ui/react";

import TipModal from "../event-tip-modal";

import type { NostrEvent } from "nostr-tools";
import useEventXMRAddress from "~/hooks/use-event-xmr-address";
import MoneroWhite from "../icons/monero-white";

export type NoteTipButtonProps = Omit<ButtonProps, "children"> & {
	event: NostrEvent;
	allowComment?: boolean;
	showEventPreview?: boolean;
};

export default function EventTipButton({
	event,
	allowComment,
	showEventPreview,
	...props
}: NoteTipButtonProps) {
	const { address, isUserTip } = useEventXMRAddress(event);
	const { isOpen, onOpen, onClose } = useDisclosure();

	const title = isUserTip ? "Tip User" : "Tip Note";

	return (
		<>
			<Button
				m={0}
				rightIcon={<MoneroWhite verticalAlign="sub" />}
				aria-label={title}
				title={title}
				{...props}
				onClick={onOpen}
				isDisabled={!address}
			>
				Tip
			</Button>

			{isOpen && (
				<TipModal
					isOpen={isOpen}
					onClose={onClose}
					event={event}
					allowComment={allowComment}
					showEmbed={showEventPreview}
				/>
			)}
		</>
	);
}
