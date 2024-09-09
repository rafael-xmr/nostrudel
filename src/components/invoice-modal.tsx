import { useState } from "react";
import {
	Button,
	Flex,
	IconButton,
	Input,
	Modal,
	ModalBody,
	ModalContent,
	ModalOverlay,
	type ModalProps,
	useDisclosure,
} from "@chakra-ui/react";

import { ExternalLinkIcon, QrCodeIcon } from "./icons";
import QrCodeSvg from "./qr-code/qr-code-svg";
import { CopyIconButton } from "./copy-icon-button";
import { useBreakpointValue } from "../providers/global/breakpoint-provider";

type CommonProps = { address?: string; amount: number; onPaid: () => void };

export function InvoiceModalContent({ address, amount, onPaid }: CommonProps) {
	const isMobile = useBreakpointValue({ base: true, md: false });
	const showQr = useDisclosure({ isOpen: !isMobile });
	const [payingApp, setPayingApp] = useState(false);
	const uri = `monero:${address}?tx_amount=${amount}`;

	const payWithApp = async () => {
		setPayingApp(true);
		window.open(uri);

		const listener = () => {
			if (document.visibilityState === "visible") {
				if (onPaid) onPaid();
				document.removeEventListener("visibilitychange", listener);
				setPayingApp(false);
			}
		};
		setTimeout(() => {
			document.addEventListener("visibilitychange", listener);
		}, 1000 * 2);
	};

	return (
		<Flex gap="2" direction="column">
			{showQr.isOpen && <QrCodeSvg content={uri} />}
			<Flex gap="2">
				<Input value={uri} readOnly />
				<IconButton
					icon={<QrCodeIcon />}
					aria-label="Show QrCode"
					onClick={showQr.onToggle}
					variant="solid"
					size="md"
					isDisabled={false}
				/>
				<CopyIconButton
					value={uri}
					aria-label="Copy Invoice"
					variant="solid"
					size="md"
					isDisabled={false}
				/>
			</Flex>
			<Flex gap="2">
				<Button
					leftIcon={<ExternalLinkIcon />}
					onClick={payWithApp}
					flex={1}
					variant="solid"
					size="md"
					isLoading={payingApp}
					isDisabled={false}
				>
					Open App
				</Button>
			</Flex>
		</Flex>
	);
}

export default function InvoiceModal({
	address,
	amount,
	onClose,
	onPaid,
	...props
}: Omit<ModalProps, "children"> & CommonProps) {
	const isMobile = useBreakpointValue({ base: true, md: false });
	return (
		<Modal onClose={onClose} size={isMobile ? "full" : "xl"} {...props}>
			<ModalOverlay />
			<ModalContent>
				<ModalBody padding="4">
					<InvoiceModalContent
						address={address}
						amount={amount}
						onPaid={() => {
							if (onPaid) onPaid();
							onClose();
						}}
					/>
				</ModalBody>
			</ModalContent>
		</Modal>
	);
}
