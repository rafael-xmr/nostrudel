import { IconButton, IconButtonProps, useDisclosure } from "@chakra-ui/react";
import { useActiveAccount } from "applesauce-react/hooks";

import useEventZaps from "../../hooks/use-event-zaps";
import eventZapsService from "../../services/event-zaps";
import { NostrEvent } from "../../types/nostr-event";
import { LightningIcon } from "../icons";
import ZapModal from "../event-zap-modal";
import { getEventUID } from "../../helpers/nostr/event";
import { useReadRelays } from "../../hooks/use-client-relays";

export default function EventZapIconButton({
	event,
	...props
}: { event: NostrEvent } & Omit<IconButtonProps, "icon" | "onClick">) {
	const account = useActiveAccount();
	const zaps = useEventZaps(getEventUID(event)) ?? [];
	const { isOpen, onOpen, onClose } = useDisclosure();

	const readRelays = useReadRelays();
	const onZapped = () => {
		onClose();
		eventZapsService.requestZaps(getEventUID(event), readRelays, true);
	};

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
					onZapped={onZapped}
				/>
			)}
		</>
	);
}
