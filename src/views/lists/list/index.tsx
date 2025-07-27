import {
	Button,
	ButtonGroup,
	Flex,
	Heading,
	SimpleGrid,
	Spinner,
	useDisclosure,
} from "@chakra-ui/react";
import {
	type DecodeResult,
	encodeDecodeResult,
	getAddressPointersFromList,
	getEventPointersFromList,
	getProfilePointersFromList,
} from "applesauce-core/helpers";
import { useActiveAccount } from "applesauce-react/hooks";
import { kinds, type NostrEvent } from "nostr-tools";
import { type EventPointer, naddrEncode } from "nostr-tools/nip19";

import GenericCommentSection from "../../../components/comment/generic-comment-section";
import {
	EmbedEventCard,
	EmbedEventPointerCard,
} from "../../../components/embed-event/card";
import SimpleView from "../../../components/layout/presets/simple-view";
import OpenGraphCard from "../../../components/open-graph/open-graph-card";
import UserLink from "../../../components/user/user-link";
import {
	getListTitle,
	getReferencesFromList,
	isSpecialListKind,
} from "../../../helpers/nostr/lists";
import useParamsAddressPointer from "../../../hooks/use-params-address-pointer";
import useReplaceableEvent from "../../../hooks/use-replaceable-event";
import useSingleEvent from "../../../hooks/use-single-event";
import { ContentSettingsProvider } from "../../../providers/local/content-settings";
import ListEditModal from "../components/list-edit-modal";
import ListFavoriteButton from "../components/list-favorite-button";
import ListMenu from "../components/list-menu";
import UserCard from "../components/user-card";
import FollowSetView, { ListPageHeader } from "./follow-set";

function BookmarkedEvent({ pointer }: { pointer: EventPointer }) {
	const event = useSingleEvent(pointer);

	return event ? <EmbedEventCard event={event} /> : <>Loading {pointer.id}</>;
}

function FallbackListPage({ list }: { list: NostrEvent }) {
	const edit = useDisclosure();
	const account = useActiveAccount();

	const title = getListTitle(list);
	const isAuthor = account?.pubkey === list.pubkey;
	const people = getProfilePointersFromList(list);
	const notes = getEventPointersFromList(list);
	const coordinates = getAddressPointersFromList(list);
	const communities = coordinates.filter(
		(cord) => cord.kind === kinds.CommunityDefinition,
	);
	const articles = coordinates.filter(
		(cord) => cord.kind === kinds.LongFormArticle,
	);
	const references = getReferencesFromList(list);

	return (
		<ContentSettingsProvider blurMedia={false}>
			<SimpleView
				title={title}
				maxW="6xl"
				center
				actions={
					<ButtonGroup ms="auto">
						<ListFavoriteButton list={list} />
						{isAuthor && !isSpecialListKind(list.kind) && (
							<Button onClick={edit.onOpen} colorScheme="primary">
								Edit
							</Button>
						)}
						<ListMenu aria-label="More options" list={list} variant="ghost" />
					</ButtonGroup>
				}
			>
				<ListPageHeader list={list} />

				{people.length > 0 && (
					<>
						<Heading size="lg">People</Heading>
						<SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }} spacing="2">
							{people.map(({ pubkey, relays }) => (
								<UserCard
									key={pubkey}
									pubkey={pubkey}
									relay={relays?.[0]}
									list={list}
								/>
							))}
						</SimpleGrid>
					</>
				)}

				{notes.length > 0 && (
					<>
						<Heading size="lg">Notes</Heading>
						<Flex gap="2" direction="column">
							{notes.map((pointer) => (
								<BookmarkedEvent key={pointer.id} pointer={pointer} />
							))}
						</Flex>
					</>
				)}

				{references.length > 0 && (
					<>
						<Heading size="lg">References</Heading>
						<Flex gap="2" direction="column">
							{references.map(({ url, petname }) => (
								<>
									{petname && <Heading size="md">{petname}</Heading>}
									<OpenGraphCard url={new URL(url)} />
								</>
							))}
						</Flex>
					</>
				)}

				{communities.length > 0 && (
					<>
						<Heading size="lg">Communities</Heading>
						<SimpleGrid spacing="2" columns={{ base: 1, lg: 2 }}>
							{communities.map((pointer) => (
								<EmbedEventPointerCard
									key={naddrEncode(pointer)}
									pointer={{ type: "naddr", data: pointer }}
								/>
							))}
						</SimpleGrid>
					</>
				)}

				{articles.length > 0 && (
					<>
						<Heading size="lg">Articles</Heading>
						<Flex gap="2" direction="column">
							{articles.map((pointer) => {
								const decode: DecodeResult = { type: "naddr", data: pointer };
								return (
									<EmbedEventPointerCard
										key={encodeDecodeResult(decode)}
										pointer={decode}
									/>
								);
							})}
						</Flex>
					</>
				)}

				<GenericCommentSection event={list} />

				{edit.isOpen && (
					<ListEditModal isOpen list={list} onClose={edit.onClose} />
				)}
			</SimpleView>
		</ContentSettingsProvider>
	);
}

export default function ListView() {
	const pointer = useParamsAddressPointer("addr", false);

	const list = useReplaceableEvent(pointer);

	if (!list)
		return (
			<>
				<Spinner /> Looking for list "{pointer.identifier}" created by{" "}
				<UserLink pubkey={pointer.pubkey} />
			</>
		);

	switch (list.kind) {
		case kinds.Followsets:
			return <FollowSetView event={list} />;
		default:
			return <FallbackListPage list={list} />;
	}
}
