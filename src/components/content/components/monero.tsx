import { Button, Flex, Tooltip, useDisclosure } from "@chakra-ui/react";
import type { MoneroAddressToken } from "../transform/monero-notation";
import { MoneroIcon } from "~/components/icons";
import ZapModal from "~/components/event-zap-modal";

export default function MoneroDefinition({
	node,
}: { node: MoneroAddressToken }) {
	const { isOpen, onOpen, onClose } = useDisclosure();

	return (
		<Tooltip label={node.name} aria-label={node.name}>
			<Flex gap="1" alignItems="center">
				<MoneroIcon />
				<Button
					variant="link"
					textDecoration="underline"
					aria-label={node.name}
					title={node.name}
					onClick={onOpen}
				>
					{node.value}
				</Button>

				{isOpen && (
					<ZapModal isOpen={isOpen} onClose={onClose} address={node.address} />
				)}
			</Flex>
		</Tooltip>
	);
}
