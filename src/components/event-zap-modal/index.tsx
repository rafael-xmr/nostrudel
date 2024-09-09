import { useState } from "react";
import {
	Modal,
	ModalBody,
	ModalCloseButton,
	ModalContent,
	ModalHeader,
	ModalOverlay,
	type ModalProps,
} from "@chakra-ui/react";

import type { NostrEvent } from "../../types/nostr-event";
import { getZapSplits } from "../../helpers/nostr/zaps";
import type { EmbedProps } from "../embed-event";
import InputStep from "./input-step";
import PayStep from "./pay-step";
import UserLink from "../user/user-link";
import useUserXMRMetadata from "../../hooks/use-user-xmr-metadata";
import { useBreakpointValue } from "../../providers/global/breakpoint-provider";

export type PayRequest = {
	pubkey: string;
	address?: string;
	amount: number;
	comment?: string;
};

async function getPayRequestsForEvent(
	event: NostrEvent,
	amount: number,
	address?: string,
	comment?: string,
	fallbackPubkey?: string,
	// additionalRelays?: Iterable<string>,
) {
	const splits = getZapSplits(event, fallbackPubkey);

	const draftZapRequests: PayRequest[] = [];
	for (const { pubkey, percent } of splits) {
		const splitAmount = amount * percent;
		draftZapRequests.push({ address, pubkey, amount: splitAmount, comment });
	}

	return draftZapRequests;
}

export type ZapModalProps = Omit<ModalProps, "children"> & {
	pubkey: string;
	event?: NostrEvent;
	relays?: string[];
	initialComment?: string;
	initialAmount?: number;
	allowComment?: boolean;
	showEmbed?: boolean;
	embedProps?: EmbedProps;
	additionalRelays?: Iterable<string>;
	onZapped: () => void;
};

export default function ZapModal({
	event,
	pubkey,
	relays,
	onClose,
	initialComment,
	initialAmount,
	allowComment = true,
	showEmbed = true,
	embedProps,
	additionalRelays = [],
	onZapped,
	...props
}: ZapModalProps) {
	const { address } = useUserXMRMetadata(pubkey);
	const [callbacks, setCallbacks] = useState<PayRequest[]>();

	const renderContent = () => {
		if (callbacks) {
			return <PayStep callbacks={callbacks} onComplete={onZapped} />;
		}

		return (
			<InputStep
				pubkey={pubkey}
				event={event}
				initialComment={initialComment}
				initialAmount={initialAmount}
				showEmbed={showEmbed}
				embedProps={embedProps}
				allowComment={allowComment}
				onSubmit={async (values) => {
					if (event) {
						setCallbacks(
							await getPayRequestsForEvent(
								event,
								values.amount,
								address,
								values.comment,
								pubkey,
								// additionalRelays,
							),
						);
					} else {
						setCallbacks([
							{
								pubkey,
								address,
								amount: values.amount,
								comment: values.comment,
							},
						]);
					}
				}}
			/>
		);
	};

	const isMobile = useBreakpointValue({ base: true, md: false });
	return (
		<Modal onClose={onClose} size={isMobile ? "full" : "xl"} {...props}>
			<ModalOverlay />
			<ModalContent>
				<ModalCloseButton />
				<ModalHeader px="4" pb="0" pt="4">
					{event ? (
						"Tip Event"
					) : (
						<>
							Tip <UserLink pubkey={pubkey} fontWeight="bold" />
						</>
					)}
				</ModalHeader>
				<ModalBody padding="4">{renderContent()}</ModalBody>
			</ModalContent>
		</Modal>
	);
}
