import {
	IconButton,
	type IconButtonProps,
	useDisclosure,
} from "@chakra-ui/react";
import ZapModal from "../../../components/event-zap-modal";
import useUserXMRMetadata from "../../../hooks/use-user-xmr-metadata";
import Monero from "../../../components/icons/monero";

export default function UserZapButton({
	pubkey,
	...props
}: { pubkey: string } & Omit<IconButtonProps, "aria-label">) {
	const { address } = useUserXMRMetadata(pubkey);
	if (!address) return null;

	const { isOpen, onOpen, onClose } = useDisclosure();

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
