import {
	Alert,
	AlertIcon,
	Box,
	Button,
	ButtonGroup,
	Divider,
	Flex,
	Heading,
	SimpleGrid,
	Spinner,
	Text,
} from "@chakra-ui/react";
import { addRelayHintsToPointer } from "applesauce-core/helpers";
import { useActiveAccount } from "applesauce-react/hooks";
import { type NostrEvent, nip19 } from "nostr-tools";
import { Link as RouterLink } from "react-router-dom";

import { ExternalLinkIcon } from "../../components/icons";
import FileSearch01 from "../../components/icons/file-search-01";
import GitBranch01 from "../../components/icons/git-branch-01";
import MarkdownContent from "../../components/markdown/markdown";
import EventQuoteButton from "../../components/note/event-quote-button";
import EventVoteButtons from "../../components/reactions/event-vote-buttions";
import Timestamp from "../../components/timestamp";
import UserLink from "../../components/user/user-link";
import VerticalPageLayout from "../../components/vertical-page-layout";
import { WIKI_RELAYS } from "../../const";
import {
	getPageDefer,
	getPageForks,
	getPageSummary,
	getPageTitle,
	getPageTopic,
} from "../../helpers/nostr/wiki";
import { useReadRelays } from "../../hooks/use-client-relays";
import useParamsAddressPointer from "../../hooks/use-params-address-pointer";
import useReplaceableEvent from "../../hooks/use-replaceable-event";
import useWikiPages from "../../hooks/use-wiki-pages";
import { useLocalSettings } from "~/providers/global/preferences";
import WikiPageHeader from "./components/wiki-page-header";
import WikiPageMenu from "./components/wiki-page-menu";
import WikiPageResult from "./components/wiki-page-result";

function ForkAlert({
	page,
	address,
}: {
	page: NostrEvent;
	address: nip19.AddressPointer;
}) {
	const topic = getPageTopic(page);

	return (
		<Alert status="info" display="flex" flexWrap="wrap">
			<AlertIcon>
				<GitBranch01 boxSize={5} />
			</AlertIcon>
			<Text>
				This page was forked from{" "}
				<UserLink pubkey={address.pubkey} fontWeight="bold" /> version
			</Text>
			<ButtonGroup variant="link" ml="auto">
				<Button
					leftIcon={<ExternalLinkIcon />}
					as={RouterLink}
					to={`/wiki/page/${nip19.naddrEncode(address)}`}
				>
					Original
				</Button>
				<Button
					leftIcon={<FileSearch01 />}
					as={RouterLink}
					to={`/wiki/compare/${topic}/${address.pubkey}/${page.pubkey}`}
				>
					Compare
				</Button>
			</ButtonGroup>
		</Alert>
	);
}

function DeferAlert({
	address,
}: {
	page: NostrEvent;
	address: nip19.AddressPointer;
}) {
	return (
		<Alert status="warning" display="flex" flexWrap="wrap">
			<AlertIcon />
			<Text>
				The author of this page has deferred to{" "}
				<UserLink pubkey={address.pubkey} fontWeight="bold" /> version
			</Text>
			<Button
				leftIcon={<ExternalLinkIcon />}
				as={RouterLink}
				to={`/wiki/page/${nip19.naddrEncode(address)}`}
				variant="link"
				ml="4"
			>
				View
			</Button>
		</Alert>
	);
}

export function WikiPagePage({ page }: { page: NostrEvent }) {
	const account = useActiveAccount();

	const { address } = getPageForks(page);
	const defer = getPageDefer(page);
	const summary = getPageSummary(page, false);
	const { relayHintsManagement } = useLocalSettings();

	return (
		<>
			<Flex gap="2" wrap="wrap">
				<Box flex={1}>
					<Heading>{getPageTitle(page)}</Heading>
					<Text>
						by <UserLink pubkey={page.pubkey} /> -{" "}
						<Timestamp timestamp={page.created_at} />
					</Text>
				</Box>
				<Flex direction="column" gap="2" ml="auto">
					<ButtonGroup ml="auto" size="sm">
						{page.pubkey === account?.pubkey && (
							<Button
								as={RouterLink}
								colorScheme="primary"
								to={`/wiki/edit/${getPageTopic(page)}`}
							>
								Edit
							</Button>
						)}
						{page.pubkey !== account?.pubkey && (
							<Button
								as={RouterLink}
								colorScheme="primary"
								to={`/wiki/create?fork=${relayHintsManagement.getSharableEventAddress(page)}`}
							>
								Fork
							</Button>
						)}
					</ButtonGroup>
					<Flex alignItems="flex-end" gap="2" ml="auto">
						<EventVoteButtons event={page} inline chevrons={false} />
						<ButtonGroup size="sm">
							<EventQuoteButton event={page} />
							<WikiPageMenu page={page} aria-label="Page Options" />
						</ButtonGroup>
					</Flex>
				</Flex>
			</Flex>
			{address && <ForkAlert page={page} address={address} />}
			{defer?.address && <DeferAlert page={page} address={defer.address} />}
			<Divider />
			{summary && <Text fontStyle="italic">{summary}</Text>}
			<MarkdownContent event={page} />
		</>
	);
}

function WikiPageFooter({ page }: { page: NostrEvent }) {
	const { socialGraphManagement } = useLocalSettings();
	const topic = getPageTopic(page);

	const readRelays = useReadRelays();
	const pages = useWikiPages(topic, readRelays, true);

	let forks = pages
		? Array.from(pages.values()).filter(
				(p) => getPageForks(p).address?.pubkey === page.pubkey,
			)
		: [];
	forks = socialGraphManagement.sortByDistanceAndConnections(
		forks,
		(p) => p.pubkey,
	);

	let other = pages
		? Array.from(pages.values()).filter(
				(p) => !forks.includes(p) && p.pubkey !== page.pubkey,
			)
		: [];
	other = socialGraphManagement.sortByDistanceAndConnections(
		other,
		(p) => p.pubkey,
	);

	return (
		<>
			{forks.length > 0 && (
				<>
					<Heading size="lg" mt="4">
						Forks:
					</Heading>
					<SimpleGrid spacing="2" columns={{ base: 1, lg: 2, xl: 3 }}>
						{forks.map((p) => (
							<WikiPageResult key={p.id} page={p} compare={page} />
						))}
					</SimpleGrid>
				</>
			)}
			{other.length > 0 && (
				<>
					<Heading size="lg" mt="4">
						Other Versions:
					</Heading>
					<SimpleGrid spacing="2" columns={{ base: 1, lg: 2, xl: 3 }}>
						{other.map((p) => (
							<WikiPageResult key={p.id} page={p} compare={page} />
						))}
					</SimpleGrid>
				</>
			)}
		</>
	);
}

export default function WikiPageView() {
	const pointer = useParamsAddressPointer("naddr");
	const event = useReplaceableEvent(
		addRelayHintsToPointer(pointer, WIKI_RELAYS),
	);

	if (!event) return <Spinner />;
	return (
		<VerticalPageLayout>
			<WikiPageHeader />
			<WikiPagePage page={event} />
			<WikiPageFooter page={event} />
		</VerticalPageLayout>
	);
}
