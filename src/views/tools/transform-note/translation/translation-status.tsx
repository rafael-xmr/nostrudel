import { MouseEventHandler, useState } from "react";
import { Button, Flex, Spacer, Text, useToast } from "@chakra-ui/react";

import type { NostrEvent } from "../../../../types/nostr-event";
import UserAvatarLink from "../../../../components/user/user-avatar-link";
import UserLink from "../../../../components/user/user-link";
import { LightningIcon } from "../../../../components/icons";
import { humanReadableSats } from "../../../../helpers/lightning";

export default function TranslationStatus({ status }: { status: NostrEvent }) {
	const toast = useToast();

	const amountTag = status.tags.find((t) => t[0] === "amount" && t[1] && t[2]);
	const amountMsat = amountTag?.[1] && Number.parseInt(amountTag[1]);
	const invoice = amountTag?.[2];

	const [paid, setPaid] = useState(false);
	const [paying, setPaying] = useState(false);

	return (
		<>
			<Flex gap="2" alignItems="center" grow={1}>
				<UserAvatarLink pubkey={status.pubkey} size="sm" />
				<UserLink pubkey={status.pubkey} fontWeight="bold" />
				<Text>Responded</Text>
				<Spacer />

				{invoice && amountMsat && (
					<Button
						colorScheme="yellow"
						size="sm"
						variant="solid"
						leftIcon={<LightningIcon />}
						onClick={() => {}}
						isLoading={paying || paid}
						isDisabled={true}
					>
						Pay {humanReadableSats(amountMsat / 1000)} sats
					</Button>
				)}
			</Flex>
			<Text>{status.content}</Text>
		</>
	);
}
