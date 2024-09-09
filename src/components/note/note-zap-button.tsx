import {
	// Button,
	type ButtonProps,
	IconButton,
	useDisclosure,
} from "@chakra-ui/react";

// import { totalZaps } from "../../helpers/nostr/zaps";
import useCurrentAccount from "../../hooks/use-current-account";
import useEventZaps from "../../hooks/use-event-zaps";
import clientRelaysService from "../../services/client-relays";
import eventZapsService from "../../services/event-zaps";
import ZapModal from "../event-zap-modal";
import useUserXMRMetadata from "../../hooks/use-user-xmr-metadata";
import { getEventUID } from "../../helpers/nostr/event";

import type { NostrEvent } from "nostr-tools";
import Monero from "../icons/monero";

export type NoteZapButtonProps = Omit<ButtonProps, "children"> & {
	event: NostrEvent;
	allowComment?: boolean;
	showEventPreview?: boolean;
};

export default function NoteZapButton({
	event,
	allowComment,
	showEventPreview,
	...props
}: NoteZapButtonProps) {
	const account = useCurrentAccount();
	const { address } = useUserXMRMetadata(event.pubkey);
	const zaps = useEventZaps(getEventUID(event));
	const { isOpen, onOpen, onClose } = useDisclosure();

	// const hasZapped =
	// 	!!account && zaps.some((zap) => zap.request.pubkey === account.pubkey);

	const onZapped = () => {
		onClose();
		eventZapsService.requestZaps(
			getEventUID(event),
			clientRelaysService.outbox,
			true,
		);
	};

	// const total = totalZaps(zaps);
	const canZap = !!address || event.tags.some((t) => t[0] === "zap");

	return (
		<>
			{/* TODO: zaps/amounts
          total > 0 ? (
				<Button
					leftIcon={<Monero verticalAlign="sub" />}
					aria-label="Zap Note"
					title="Zap Note"
					colorScheme={hasZapped ? "primary" : undefined}
					{...props}
					onClick={onOpen}
					isDisabled={!canZap}
				>
					{readablizeSats(total / 1000)}
				</Button>
			) : (
				<IconButton
					icon={<Monero verticalAlign="sub" />}
					aria-label="Zap Note"
					title="Zap Note"
					{...props}
					onClick={onOpen}
					isDisabled={!canZap}
				/>
			)*/}
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
					onZapped={onZapped}
					allowComment={allowComment}
					showEmbed={showEventPreview}
				/>
			)}
		</>
	);
}
