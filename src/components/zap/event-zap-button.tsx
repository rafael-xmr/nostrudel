import { type ButtonProps, IconButton, useDisclosure } from "@chakra-ui/react";

import ZapModal from "../event-zap-modal";
import useUserXMRMetadata from "../../hooks/use-user-xmr-metadata";
import { useReadRelays } from "../../hooks/use-client-relays";

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
	const { isOpen, onOpen, onClose } = useDisclosure();

	const readRelays = useReadRelays();

	// const total = totalZaps(zaps);
	const canZap = !!address;

	return (
		<>
			<IconButton
				icon={<Monero verticalAlign="sub" />}
				aria-label="Zap Note"
				title="Zap Note"
				{...props}
				onClick={onOpen}
				isDisabled={!canZap}
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
