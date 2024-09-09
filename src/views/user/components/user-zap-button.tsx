import {
	IconButton,
	type IconButtonProps,
	useDisclosure,
} from "@chakra-ui/react";
import useUserMetadata from "../../../hooks/use-user-metadata";
import ZapModal from "../../../components/event-zap-modal";
import { useInvoiceModalContext } from "../../../providers/route/invoice-modal";
import Monero from "../../../components/icons/monero";
import useUserXMRMetadata from "../../../hooks/use-user-xmr-metadata";

export default function UserZapButton({
	pubkey,
	...props
}: { pubkey: string } & Omit<IconButtonProps, "aria-label">) {
	const { isOpen, onOpen, onClose } = useDisclosure();
	const { requestPay } = useInvoiceModalContext();

	const { address } = useUserXMRMetadata(pubkey);

	if (!address) return null;

	return (
		<>
			<IconButton
				onClick={onOpen}
				aria-label="Send Tip"
				title="Send Tip"
				icon={<Monero />}
				{...props}
			/>
			{isOpen && (
				<ZapModal
					isOpen={isOpen}
					onClose={onClose}
					pubkey={pubkey}
					onZapped={async () => {
						onClose();
					}}
				/>
			)}
		</>
	);
}
