import { useOutletContext, Link as RouterLink } from "react-router-dom";
import {
	Box,
	Button,
	Flex,
	Heading,
	IconButton,
	Image,
	Link,
	Text,
	useDisclosure,
} from "@chakra-ui/react";
import { nip19 } from "nostr-tools";

import { getUserDisplayName } from "../../../helpers/nostr/user-metadata";
import { type EmbedableContent, embedUrls } from "../../../helpers/embeds";
import { truncatedId } from "../../../helpers/nostr/event";
import { parseAddress } from "../../../services/dns-identity";
import { useAdditionalRelayContext } from "../../../providers/local/additional-relay-context";
import useUserMetadata from "../../../hooks/use-user-metadata";
import {
	embedNostrLinks,
	renderGenericUrl,
} from "../../../components/embed-types";
import {
	ChevronDownIcon,
	ChevronUpIcon,
	AtIcon,
	ExternalLinkIcon,
	KeyIcon,
} from "../../../components/icons";
import { CopyIconButton } from "../../../components/copy-icon-button";
import { QrIconButton } from "../components/share-qr-button";
import { UserDnsIdentityIcon } from "../../../components/user/user-dns-identity-icon";
import UserAvatar from "../../../components/user/user-avatar";
import { ChatIcon } from "@chakra-ui/icons";
import { UserFollowButton } from "../../../components/user/user-follow-button";
import UserZapButton from "../components/user-zap-button";
import { UserProfileMenu } from "../components/user-profile-menu";
import { useSharableProfileId } from "../../../hooks/use-shareable-profile-id";
import UserProfileBadges from "./user-profile-badges";
import UserJoinedCommunities from "./user-joined-communities";
import UserPinnedEvents from "./user-pinned-events";
import UserStatsAccordion from "./user-stats-accordion";
import UserJoinedChanneled from "./user-joined-channels";
import Monero from "../../../components/icons/monero";
import { getXMREndpoint } from "../../../helpers/monero";

function buildDescriptionContent(description: string) {
	let content: EmbedableContent = [description.trim()];

	content = embedNostrLinks(content);
	content = embedUrls(content, [renderGenericUrl]);

	return content;
}

export default function UserAboutTab() {
	const expanded = useDisclosure();
	const { pubkey } = useOutletContext() as { pubkey: string };
	const contextRelays = useAdditionalRelayContext();

	const metadata = useUserMetadata(pubkey, contextRelays);
	const npub = nip19.npubEncode(pubkey);
	const nprofile = useSharableProfileId(pubkey);

	const aboutContent =
		metadata?.about && buildDescriptionContent(metadata?.about);
	const parsedNip05 = metadata?.nip05
		? parseAddress(metadata.nip05)
		: undefined;

	return (
		<Flex
			overflowY="auto"
			overflowX="hidden"
			direction="column"
			gap="2"
			pt={metadata?.banner ? 0 : "2"}
			pb="8"
			minH="90vh"
		>
			<Box
				pt={!expanded.isOpen ? "20vh" : 0}
				px={!expanded.isOpen ? "2" : 0}
				pb={!expanded.isOpen ? "4" : 0}
				w="full"
				position="relative"
				backgroundImage={!expanded.isOpen ? metadata?.banner : ""}
				backgroundPosition="center"
				backgroundSize="cover"
				backgroundRepeat="no-repeat"
			>
				{expanded.isOpen && <Image src={metadata?.banner} w="full" />}
				<Flex
					bottom="0"
					right="0"
					left="0"
					p="2"
					position="absolute"
					direction={["column", "row"]}
					bg="linear-gradient(180deg, rgb(255 255 255 / 0%) 0%, var(--chakra-colors-chakra-body-bg) 100%)"
					gap="2"
					alignItems={["flex-start", "flex-end"]}
				>
					<UserAvatar pubkey={pubkey} size={["lg", "lg", "xl"]} noProxy />
					<Box overflow="hidden">
						<Heading isTruncated>
							{getUserDisplayName(metadata, pubkey)}
						</Heading>
						<UserDnsIdentityIcon pubkey={pubkey} />
					</Box>

					<Flex gap="2" ml="auto">
						<UserZapButton pubkey={pubkey} size="sm" variant="link" />

						<IconButton
							as={RouterLink}
							size="sm"
							icon={<ChatIcon />}
							aria-label="Message"
							to={`/dm/${npub ?? pubkey}`}
						/>
						<UserFollowButton pubkey={pubkey} size="sm" showLists />
						<UserProfileMenu
							pubkey={pubkey}
							aria-label="More Options"
							size="sm"
						/>
					</Flex>
				</Flex>
				<IconButton
					icon={expanded.isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
					aria-label="expand"
					onClick={expanded.onToggle}
					top="2"
					right="2"
					variant="solid"
					position="absolute"
				/>
			</Box>
			{aboutContent && (
				<Box whiteSpace="pre-wrap" px="2">
					{aboutContent}
				</Box>
			)}

			<Flex gap="2" px="2" direction="column">
				{metadata?.cryptocurrency_addresses?.monero && (
					<Flex gap="2">
						<Monero />
						<Link
							href={getXMREndpoint(metadata.cryptocurrency_addresses.monero)}
							isExternal
              overflow="hidden"
						>
							{metadata.cryptocurrency_addresses.monero}
						</Link>
						<CopyIconButton
							value={metadata.cryptocurrency_addresses.monero}
							title="Copy monero address"
							aria-label="Copy monero address"
							size="xs"
						/>
						<QrIconButton
							xmrAddress={metadata.cryptocurrency_addresses.monero}
							title="Show QrCode"
							aria-label="Show QrCode"
							size="xs"
						/>
					</Flex>
				)}
				{parsedNip05 && (
					<Flex gap="2">
						<AtIcon />
						<Link
							href={`//${parsedNip05.domain}/.well-known/nostr.json?name=${parsedNip05.name}`}
							isExternal
						>
							<UserDnsIdentityIcon pubkey={pubkey} />
						</Link>
					</Flex>
				)}
				{metadata?.website && (
					<Flex gap="2">
						<ExternalLinkIcon />
						<Link
							href={metadata.website}
							target="_blank"
							color="blue.500"
							isExternal
						>
							{metadata.website}
						</Link>
					</Flex>
				)}
				{npub && (
					<Flex gap="2">
						<KeyIcon />
						<Text>{truncatedId(npub, 10)}</Text>
						<CopyIconButton
							value={npub}
							title="Copy npub"
							aria-label="Copy npub"
							size="xs"
						/>
						<QrIconButton
							pubkey={pubkey}
							title="Show QrCode"
							aria-label="Show QrCode"
							size="xs"
						/>
					</Flex>
				)}
			</Flex>

			<UserProfileBadges pubkey={pubkey} px="2" />
			<UserStatsAccordion pubkey={pubkey} />

			<Flex gap="2" wrap="wrap">
				<Button
					as={Link}
					href={`https://nosta.me/${nprofile}`}
					leftIcon={
						<Image src="https://nosta.me/images/favicon-32x32.png" w="1.2em" />
					}
					rightIcon={<ExternalLinkIcon />}
					isExternal
				>
					Nosta.me page
				</Button>
				<Button
					as={Link}
					href={`https://slidestr.net/${npub}`}
					leftIcon={<Image src="https://slidestr.net/slidestr.svg" w="1.2em" />}
					rightIcon={<ExternalLinkIcon />}
					isExternal
				>
					Slidestr Slideshow
				</Button>
				<Button
					as={Link}
					href={`https://nostree.me/${npub}`}
					leftIcon={<Image src="https://nostree.me/favicon.svg" w="1.2em" />}
					rightIcon={<ExternalLinkIcon />}
					isExternal
				>
					Nostree page
				</Button>
			</Flex>

			<UserPinnedEvents pubkey={pubkey} />
			<UserJoinedCommunities pubkey={pubkey} />
			<UserJoinedChanneled pubkey={pubkey} />
		</Flex>
	);
}
