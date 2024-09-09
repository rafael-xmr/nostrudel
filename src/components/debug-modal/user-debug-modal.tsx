import {
	Flex,
	Modal,
	ModalBody,
	ModalCloseButton,
	ModalContent,
	ModalOverlay,
} from "@chakra-ui/react";
import type { ModalProps } from "@chakra-ui/react";
import { kinds, nip19 } from "nostr-tools";

import useUserMetadata from "../../hooks/use-user-metadata";
import RawValue from "./raw-value";
import RawJson from "./raw-json";
import { useSharableProfileId } from "../../hooks/use-shareable-profile-id";
import replaceableEventsService from "../../services/replaceable-events";

export default function UserDebugModal({
	pubkey,
	...props
}: { pubkey: string } & Omit<ModalProps, "children">) {
	const npub = nip19.npubEncode(pubkey);
	const metadata = useUserMetadata(pubkey);
	const nprofile = useSharableProfileId(pubkey);
	const relays = replaceableEventsService.getEvent(
		kinds.RelayList,
		pubkey,
	).value;

	return (
		<Modal {...props}>
			<ModalOverlay />
			<ModalContent>
				<ModalCloseButton />
				<ModalBody p="4">
					<Flex gap="2" direction="column">
						<RawValue heading="Hex pubkey" value={pubkey} />
						{npub && <RawValue heading="npub" value={npub} />}
						<RawValue heading="nprofile" value={nprofile} />
						<RawJson heading="Parsed Metadata (kind 0)" json={metadata} />
						{relays && (
							<RawJson heading="Relay List (kind 10002)" json={relays} />
						)}
					</Flex>
				</ModalBody>
			</ModalContent>
		</Modal>
	);
}
