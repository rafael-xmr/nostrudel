import { Link, Tooltip, useDisclosure } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import { type EmbedableContent, embedJSX } from "../../helpers/embeds";
import type { DraftNostrEvent, NostrEvent } from "../../types/nostr-event";
import UserLink from "../user/user-link";
import {
	getMatchHashtag,
	getMatchNostrLink,
	stripInvisibleChar,
} from "../../helpers/regexp";
import { safeDecode } from "../../helpers/nip19";
import { EmbedEventPointer } from "../embed-event";
import { NIP_NAMES } from "../../views/relays/components/supported-nips";
import { XMR_REGEX } from "../../helpers/monero";
import Monero from "../icons/monero";
import ZapModal from "../event-zap-modal";

// nostr:nevent1qqsthg2qlxp9l7egtwa92t8lusm7pjknmjwa75ctrrpcjyulr9754fqpz3mhxue69uhhyetvv9ujuerpd46hxtnfduq36amnwvaz7tmwdaehgu3dwp6kytnhv4kxcmmjv3jhytnwv46q2qg5q9
// nostr:nevent1qqsq3wc73lqxd70lg43m5rul57d4mhcanttjat56e30yx5zla48qzlspz9mhxue69uhkummnw3e82efwvdhk6qgdwaehxw309ahx7uewd3hkcq5hsum
export function embedNostrLinks(content: EmbedableContent, inline = false) {
	return embedJSX(content, {
		name: "nostr-link",
		regexp: getMatchNostrLink(),
		render: (match) => {
			const decoded = safeDecode(match[2]);
			if (!decoded) return null;

			switch (decoded.type) {
				case "npub":
					return <UserLink color="blue.500" pubkey={decoded.data} showAt />;
				case "nprofile":
					return (
						<UserLink color="blue.500" pubkey={decoded.data.pubkey} showAt />
					);
				case "note":
				case "nevent":
				case "naddr":
				case "nrelay":
					return inline === false ? (
						<EmbedEventPointer pointer={decoded} />
					) : null;
				default:
					return null;
			}
		},
	});
}

/** @deprecated */
export function embedNostrMentions(
	content: EmbedableContent,
	event: NostrEvent | DraftNostrEvent,
) {
	return embedJSX(content, {
		name: "nostr-mention",
		regexp: /#\[(\d+)\]/g,
		render: (match) => {
			const index = Number.parseInt(match[1]);
			const tag = event?.tags[index];

			if (tag) {
				if (tag[0] === "p" && tag[1]) {
					return <UserLink color="blue.500" pubkey={tag[1]} showAt />;
				}
				if (tag[0] === "e" && tag[1]) {
					return (
						<EmbedEventPointer
							pointer={{
								type: "nevent",
								data: { id: tag[1], relays: tag[2] ? [tag[2]] : undefined },
							}}
						/>
					);
				}
			}

			return null;
		},
	});
}

export function embedNostrHashtags(
	content: EmbedableContent,
	event: NostrEvent | DraftNostrEvent,
) {
	const hashtags = event.tags
		.filter((t) => t[0] === "t" && t[1])
		.map((t) => t[1]?.toLowerCase())
		.map(stripInvisibleChar);

	return embedJSX(content, {
		name: "nostr-hashtag",
		regexp: getMatchHashtag(),
		getLocation: (match) => {
			if (match.index === undefined)
				throw new Error("match dose not have index");

			const start = match.index + match[1].length;
			const end = start + 1 + match[2].length;
			return { start, end };
		},
		render: (match) => {
			const hashtag = match[2].toLowerCase();

			if (hashtags.includes(hashtag)) {
				return (
					<Link as={RouterLink} to={`/t/${hashtag}`} color="blue.500">
						#{match[2]}
					</Link>
				);
			}

			return null;
		},
	});
}

export function embedNipDefinitions(content: EmbedableContent) {
	return embedJSX(content, {
		name: "nip-definition",
		regexp: /nip-?(\d\d)/gi,
		render: (match) => {
			if (NIP_NAMES[match[1]]) {
				return (
					<Tooltip label={NIP_NAMES[match[1]]} aria-label="NIP Definition">
						<Link
							isExternal
							href={`https://github.com/nostr-protocol/nips/blob/master/${match[1]}.md`}
							textDecoration="underline"
						>
							{match[0]}
						</Link>
					</Tooltip>
				);
			}
			return null;
		},
	});
}

export function embedMoneroAddress(content: EmbedableContent) {
	return embedJSX(content, {
		name: "monero-address",
		regexp: XMR_REGEX,
		render: (match) => {
			const { isOpen, onOpen, onClose } = useDisclosure();

			return (
				<Tooltip label="Monero Address" aria-label="Monero Address">
					<Link
						onClick={onOpen}
						textDecoration="underline"
						display="inline-flex"
						alignItems="flex-start"
						maxW="full"
						wordBreak="break-all"
						overflowWrap="break-word"
					>
						<Monero flexShrink={0} marginRight="8px" marginTop="6px" />
						{match[0]}

						{isOpen && (
							<ZapModal
								isOpen={isOpen}
								address={match[0]}
								onClose={onClose}
								onZapped={() => {}}
								allowComment={false}
								showEmbed={false}
							/>
						)}
					</Link>
				</Tooltip>
			);
		},
	});
}
