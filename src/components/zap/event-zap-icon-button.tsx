import {
	IconButton,
	type IconButtonProps,
	useDisclosure,
} from "@chakra-ui/react";

import type { NostrEvent } from "../../types/nostr-event";
import { LightningIcon } from "../icons";
import ZapModal from "../event-zap-modal";

export default function EventZapIconButton({
	event,
	...props
}: { event: NostrEvent } & Omit<IconButtonProps, "icon" | "onClick">) {
	const { isOpen, onOpen, onClose } = useDisclosure();

	return (
		<>
			<IconButton
				icon={<LightningIcon verticalAlign="sub" color="yellow.400" />}
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
				/>
			)}
		</>
	);
}
