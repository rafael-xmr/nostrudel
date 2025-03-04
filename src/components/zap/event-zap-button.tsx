import { type ButtonProps, IconButton, useDisclosure } from "@chakra-ui/react";

import ZapModal from "../event-zap-modal";
import useUserXMRMetadata from "../../hooks/use-user-xmr-metadata";

import type { NostrEvent } from "nostr-tools";
import Monero from "../icons/monero";
import { getXMR } from "../../helpers/monero";

export type NoteZapButtonProps = Omit<ButtonProps, "children"> & {
	event: NostrEvent;
	allowComment?: boolean;
	showEventPreview?: boolean;
};

export default function EventZapButton({
	event,
	allowComment,
	showEventPreview,
	...props
}: NoteZapButtonProps) {
	// const account = useCurrentAccount();
	const { address: userAddress } = useUserXMRMetadata(event.pubkey);
	const contentAddress = getXMR(event.content);
	const address = userAddress || contentAddress;
	const isUserTip = address === userAddress;
	const { isOpen, onOpen, onClose } = useDisclosure();

	// const total = totalZaps(zaps);
	const canZap = !!address;
	const title = isUserTip ? "Tip User" : "Tip Note";

	return (
		<>
			<IconButton
				icon={<Monero verticalAlign="sub" />}
				aria-label={title}
				title={title}
				{...props}
				onClick={onOpen}
				opacity={!canZap ? "0.4" : "1"}
			/>

			{isOpen && (
				<ZapModal
					isOpen={isOpen}
					pubkey={event.pubkey}
					event={event}
					onClose={onClose}
					onZapped={() => {}}
					allowComment={allowComment}
					showEmbed={showEventPreview}
				/>
			)}
		</>
	);
}
