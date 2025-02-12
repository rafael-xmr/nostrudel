import { type MouseEventHandler, useCallback, useMemo } from "react";
import {
	Button,
	Card,
	CardBody,
	CardHeader,
	Flex,
	Heading,
	Link,
	Text,
} from "@chakra-ui/react";
import { WarningIcon } from "@chakra-ui/icons";

import {
	RECOMMENDED_READ_RELAYS,
	RECOMMENDED_WRITE_RELAYS,
} from "../../../const";
import AddRelayForm from "./add-relay-form";
import {
	useReadRelays,
	useWriteRelays,
} from "../../../hooks/use-client-relays";
import { useActiveAccount } from "applesauce-react/hooks";
import RelayControl from "./relay-control";
import { getRelaysFromExt } from "../../../helpers/nip07";
import { useUserDNSIdentity } from "../../../hooks/use-user-dns-identity";
import useUserContactRelays from "../../../hooks/use-user-contact-relays";
import { mergeRelaySets, safeRelayUrls } from "../../../helpers/relay";
import HoverLinkOverlay from "../../../components/hover-link-overlay";
import SimpleView from "../../../components/layout/presets/simple-view";
import localSettings from "../../../services/local-settings";
import { addAppRelay, RelayMode } from "../../../services/app-relays";
import useUserMailboxes from "../../../hooks/use-user-mailboxes";

const JAPANESE_RELAYS = safeRelayUrls([
	"wss://r.kojira.io",
	"wss://nrelay-jp.c-stellar.net",
	"wss://nostr.fediverse.jp",
	"wss://nostr.holybea.com",
	"wss://relay-jp.nostr.wirednet.jp",
]);

export const MONERO_RELAYS = safeRelayUrls([
	"wss://nostr.portemonero.com",
	"wss://xmr.usenostr.org",
	"wss://nostr.xmr.rocks",
	"wss://nerostr.xmr.rocks",
	"wss://xmr.ithurtswhenip.ee",
	"wss://relay.mostard.org",
]);

export const ONION_RELAYS = safeRelayUrls([
	"ws://oxtrdevav64z64yb7x6rjg4ntzqjhedm5b5zjqulugknhzr46ny2qbad.onion",
	"wss://skzzn6cimfdv5e2phjc4yr5v7ikbxtn5f7dkwn5c7v47tduzlbosqmqd.onion",
	"ws://2jsnlhfnelig5acq6iacydmzdbdmg7xwunm4xl6qwbvzacw4lwrjmlyd.onion",
	"ws://nostrland2gdw7g3y77ctftovvil76vquipymo7tsctlxpiwknevzfid.onion",
	"ws://bitcoinr6de5lkvx4tpwdmzrdfdpla5sya2afwpcabjup2xpi5dulbad.onion",
	"ws://nerostrrgb5fhj6dnzhjbgmnkpy2berdlczh6tuh2jsqrjok3j4zoxid.onion",
]);

function RelaySetCard({
	label,
	desc,
	read,
	write,
}: {
	label: string;
	desc?: JSX.Element | string;
	read: Iterable<string>;
	write: Iterable<string>;
}) {
	const handleClick = useCallback<MouseEventHandler>((e) => {
		e.preventDefault();
		localSettings.readRelays.next(Array.from(read));
		localSettings.writeRelays.next(Array.from(write));
	}, []);

	return (
		<>
			<Heading size="sm">{label}:</Heading>
			{desc ? <Text fontStyle="italic">{desc}</Text> : <></>}
			<Card w="full" variant="outline">
				<CardHeader px="4" pt="4" pb="2">
					<Heading size="sm">
						<HoverLinkOverlay href="#" onClick={handleClick}>
							{label}:
						</HoverLinkOverlay>
					</Heading>
				</CardHeader>
				<CardBody px="4" pt="0" pb="4">
					{mergeRelaySets(read, write).map((url) => (
						<Text key={url} whiteSpace="pre" isTruncated>
							{url}
						</Text>
					))}
				</CardBody>
			</Card>
		</>
	);
}
export default function AppRelaysView() {
	const account = useActiveAccount();
	const readRelays = useReadRelays();
	const writeRelays = useWriteRelays();
	const mailboxes = useUserMailboxes(account?.pubkey);
	const nip05 = useUserDNSIdentity(account?.pubkey);
	const contactRelays = useUserContactRelays(account?.pubkey);

	const sorted = useMemo(
		() => mergeRelaySets(readRelays, writeRelays).sort(),
		[readRelays, writeRelays],
	);

	return (
		<SimpleView title="App Relays" maxW="6xl">
			<Text fontStyle="italic" px="2" mt="-2">
				These relays are stored locally and are used for everything in the app
			</Text>

			{sorted.map((url) => (
				<RelayControl key={url} url={url} />
			))}
			<AddRelayForm
				onSubmit={(url) => {
					addAppRelay(url, RelayMode.BOTH);
				}}
			/>

			{writeRelays.length === 0 && (
				<Text color="yellow.500">
					<WarningIcon /> There are no write relays set, any note you create
					might not be saved
				</Text>
			)}

			<Heading size="md" mt="2">
				Set from
			</Heading>
			<Flex wrap="wrap" gap="2">
				{window.nostr && (
					<Button
						onClick={async () => {
							const { read, write } = await getRelaysFromExt();
							localSettings.readRelays.next(Array.from(read));
							localSettings.writeRelays.next(Array.from(write));
						}}
					>
						Extension
					</Button>
				)}
				{mailboxes && (
					<Button
						onClick={() => {
							localSettings.readRelays.next(mailboxes.inboxes);
							localSettings.writeRelays.next(mailboxes.outboxes);
						}}
					>
						NIP-65 (Mailboxes)
					</Button>
				)}
				{nip05?.relays && (
					<Button
						onClick={() => {
							if (!nip05.relays) return;
							localSettings.readRelays.next(Array.from(nip05.relays));
							localSettings.writeRelays.next(Array.from(nip05.relays));
						}}
					>
						NIP-05
					</Button>
				)}
				{contactRelays && (
					<Button
						onClick={() => {
							localSettings.readRelays.next(contactRelays.inbox);
							localSettings.writeRelays.next(contactRelays.outbox);
						}}
					>
						Contact List (Legacy)
					</Button>
				)}
			</Flex>

			<Heading size="md" mt="2">
				Presets
			</Heading>

			<RelaySetCard
				label="Monero Relays"
				desc={
					<>
						Find them at{" "}
						<Link
							href="https://github.com/hundehausen/monero-nostr-relays"
							isExternal
							color="blue.500"
						>
							https://github.com/hundehausen/monero-nostr-relays
						</Link>{" "}
						These relays are whitelisted or require a Monero payment to use. (so
						less spam)
					</>
				}
				read={MONERO_RELAYS}
				write={MONERO_RELAYS}
			/>
			{/* TODO: check if onion connection (?) */}
			<RelaySetCard
				label="Onion Relays"
				desc={
					<>
						Find them at{" "}
						<Link
							href="https://github.com/0xtrr/onion-service-nostr-relays"
							isExternal
							color="blue.500"
						>
							https://github.com/0xtrr/onion-service-nostr-relays
						</Link>
					</>
				}
				read={ONION_RELAYS}
				write={ONION_RELAYS}
			/>
			<RelaySetCard
				label="Popular Relays"
				desc="Mainstream relays, find most activity (and spam) here."
				read={RECOMMENDED_READ_RELAYS}
				write={RECOMMENDED_WRITE_RELAYS}
			/>
			<RelaySetCard
				label="Japanese relays"
				read={JAPANESE_RELAYS}
				write={JAPANESE_RELAYS}
			/>
		</SimpleView>
	);
}
