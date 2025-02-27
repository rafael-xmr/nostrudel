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
import type { EmbedProps } from "../embed-event";
import InputStep from "./input-step";
import UserLink from "../user/user-link";
import useUserXMRMetadata from "../../hooks/use-user-xmr-metadata";
import { useBreakpointValue } from "../../providers/global/breakpoint-provider";
import { getXMR } from "../../helpers/monero";

export type ZapModalContentsProps = {
	description?: string;
	address?: string;
	pubkey?: string;
  amount?: number;
	event?: NostrEvent;
	relays?: string[];
	initialComment?: string;
	initialAmount?: number;
	allowComment?: boolean;
	showEmbed?: boolean;
	embedProps?: EmbedProps;
	additionalRelays?: Iterable<string>;
	onZapped?: () => void;
};

export type ZapModalProps = Omit<ModalProps, "children"> &
	ZapModalContentsProps;

export function ZapModalContents({
	description,
	event,
	address: addressParam,
  amount: defaultAmount,
	pubkey,
	initialComment,
	initialAmount,
	showEmbed = true,
	embedProps,
}: ZapModalContentsProps) {
	let address = addressParam;

	if (!address) {
		const { address: userAddress } = useUserXMRMetadata(
			event?.pubkey || pubkey!,
		);
		const contentAddress = event && getXMR(event.content);
		address = addressParam || contentAddress || userAddress;
	}

	return (
		<ModalBody p={0}>
			{description && <ModalHeader px={0} pt={0} pb={4}>{description}</ModalHeader>}

			<InputStep
				address={address}
				pubkey={pubkey}
				event={event}
				initialComment={initialComment}
				initialAmount={initialAmount}
        defaultAmount={defaultAmount}
				showEmbed={showEmbed}
				embedProps={embedProps}
			/>
		</ModalBody>
	);
}

export function ZapModalHeader({
	event,
	pubkey,
}: {
	event?: NostrEvent;
	pubkey?: string;
}) {
	return (
		<ModalHeader p="4">
			{event ? (
				"Tip Event"
			) : pubkey ? (
				<>
					Tip <UserLink pubkey={pubkey} fontWeight="bold" />
				</>
			) : (
				"Tip Address"
			)}
		</ModalHeader>
	);
}

export default function ZapModal({
	description,
	address: addressParam,
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
	...props
}: ZapModalProps) {
	const isMobile = useBreakpointValue({ base: true, md: false });
	return (
		<Modal onClose={onClose} size={isMobile ? "full" : "xl"} {...props}>
			<ModalOverlay />
			<ModalContent>
				<ModalCloseButton />

				<ZapModalHeader />

				<ZapModalContents
					description={description}
					event={event}
					address={addressParam}
					pubkey={pubkey}
					initialComment={initialComment}
					initialAmount={initialAmount}
					showEmbed={showEmbed}
					embedProps={embedProps}
				/>
			</ModalContent>
		</Modal>
	);
}
