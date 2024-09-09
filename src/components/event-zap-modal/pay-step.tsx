import {
	ButtonGroup,
	Flex,
	IconButton,
	Spacer,
	useDisclosure,
} from "@chakra-ui/react";

import type { PayRequest } from ".";
import UserAvatar from "../user/user-avatar";
import UserLink from "../user/user-link";
import { ChevronDownIcon, ChevronUpIcon } from "../icons";
import { InvoiceModalContent } from "../invoice-modal";
import type { PropsWithChildren } from "react";

function UserCard({
	children,
	pubkey,
}: PropsWithChildren & { pubkey: string }) {
	return (
		<Flex gap="2" alignItems="center" overflow="hidden">
			<UserAvatar pubkey={pubkey} size="md" />
			<UserLink pubkey={pubkey} fontWeight="bold" isTruncated />
			<Spacer />
			{children}
		</Flex>
	);
}
function PayRequestCard({
	pubkey,
	address,
	amount,
	onPaid,
}: { pubkey: string; address?: string; amount: number; onPaid: () => void }) {
	const showMore = useDisclosure({ defaultIsOpen: !window.webln });

	return (
		<Flex direction="column" gap="2">
			<UserCard pubkey={pubkey}>
				<ButtonGroup size="sm">
					<IconButton
						icon={showMore.isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
						aria-label="More Options"
						onClick={showMore.onToggle}
					/>
				</ButtonGroup>
			</UserCard>
			{showMore.isOpen && (
				<InvoiceModalContent
					address={address}
					amount={amount}
					onPaid={onPaid}
				/>
			)}
		</Flex>
	);
}
export default function PayStep({
	callbacks,
}: { callbacks: PayRequest[]; onComplete: () => void }) {
	return (
		<Flex direction="column" gap="4">
			{callbacks.map((callback) => {
				return (
					<PayRequestCard
						key={callback.pubkey}
						pubkey={callback.pubkey}
						address={callback.address}
						amount={callback.amount}
						onPaid={() => {}}
					/>
				);
			})}
		</Flex>
	);
}
