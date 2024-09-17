import { memo, useMemo, useRef, useState } from "react";
import {
	Alert,
	AlertIcon,
	Button,
	ButtonGroup,
	Flex,
	IconButton,
	Link,
	Spacer,
	useDisclosure,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import ReplyForm from "./reply-form";
import { ReplyIcon } from "../../../components/icons";
import { countReplies, type ThreadItem } from "../../../helpers/thread";
import { TrustProvider } from "../../../providers/local/trust";
import useClientSideMuteFilter from "../../../hooks/use-client-side-mute-filter";
import UserAvatarLink from "../../../components/user/user-avatar-link";
import UserLink from "../../../components/user/user-link";
import Timestamp from "../../../components/timestamp";
import Expand01 from "../../../components/icons/expand-01";
import Minus from "../../../components/icons/minus";
import { useBreakpointValue } from "../../../providers/global/breakpoint-provider";
import { UserDnsIdentityIcon } from "../../../components/user/user-dns-identity-icon";
import EventInteractionDetailsModal from "../../../components/event-interactions-modal";
import { getSharableEventAddress } from "../../../helpers/nip19";
import { useRegisterIntersectionEntity } from "../../../providers/local/intersection-observer";
import useAppSettings from "../../../hooks/use-app-settings";
import useThreadColorLevelProps from "../../../hooks/use-thread-color-level-props";
import POWIcon from "../../../components/pow/pow-icon";
import RepostButton from "../../../components/note/timeline-note/components/repost-button";
import QuoteRepostButton from "../../../components/note/quote-repost-button";
import NoteZapButton from "../../../components/note/note-zap-button";
import NoteProxyLink from "../../../components/note/timeline-note/components/note-proxy-link";
import { NoteDetailsButton } from "../../../components/note/timeline-note/components/note-details-button";
import BookmarkButton from "../../../components/note/bookmark-button";
import NoteMenu from "../../../components/note/note-menu";
import NoteCommunityMetadata from "../../../components/note/timeline-note/note-community-metadata";
import { TextNoteContents } from "../../../components/note/timeline-note/text-note-contents";
import NoteReactions from "../../../components/note/timeline-note/components/note-reactions";
import useUserMetadata from "../../../hooks/use-user-metadata";

export type ThreadItemProps = {
	post: ThreadItem;
	initShowReplies?: boolean;
	focusId?: string;
	level?: number;
};

export const ThreadPost = memo(
	({ post, initShowReplies, focusId, level = -1 }: ThreadItemProps) => {
		const { showReactions } = useAppSettings();

		const userMetadata = useUserMetadata(post.event.pubkey);
		const muteFilter = useClientSideMuteFilter();
		const isMuted = muteFilter(post.event, userMetadata);

		const replies = post.replies.filter((r) => {
			// filters if a reply is a direct copy of the parent note's content (reply guy spam)
			const replyGuyCopy =
				post.event.content === r.event.content.replace(/\s(\w-?\.?)+$/g, "");
			console.info(r.event.content, !muteFilter(r.event) && !replyGuyCopy);
			return !muteFilter(r.event) && !replyGuyCopy;
		});
		const numberOfReplies = countReplies(replies);

		const expanded = useDisclosure({
			defaultIsOpen: initShowReplies ?? (level < 2 || replies.length <= 1),
		});
		const replyForm = useDisclosure();
		const detailsModal = useDisclosure();

		const [alwaysShow, setAlwaysShow] = useState(false);
		const muteAlert = (
			<Alert status="warning">
				<AlertIcon />
				Muted user or note
				<Button size="xs" ml="auto" onClick={() => setAlwaysShow(true)}>
					Show anyway
				</Button>
			</Alert>
		);

		const colorProps = useThreadColorLevelProps(
			level,
			focusId === post.event.id,
		);

		const header = (
			<Flex gap="2" alignItems="center">
				<UserAvatarLink pubkey={post.event.pubkey} size="sm" />
				<UserLink pubkey={post.event.pubkey} fontWeight="bold" isTruncated />
				<UserDnsIdentityIcon pubkey={post.event.pubkey} onlyIcon />
				<POWIcon event={post.event} boxSize={5} />
				<Link
					as={RouterLink}
					whiteSpace="nowrap"
					color="current"
					to={`/n/${getSharableEventAddress(post.event)}`}
				>
					<Timestamp timestamp={post.event.created_at} />
				</Link>
				{replies.length > 0 ? (
					<Button
						variant="ghost"
						onClick={expanded.onToggle}
						rightIcon={expanded.isOpen ? <Minus /> : <Expand01 />}
					>
						({numberOfReplies})
					</Button>
				) : (
					<IconButton
						variant="ghost"
						onClick={expanded.onToggle}
						icon={expanded.isOpen ? <Minus /> : <Expand01 />}
						aria-label={expanded.isOpen ? "Collapse" : "Expand"}
						title={expanded.isOpen ? "Collapse" : "Expand"}
					/>
				)}
			</Flex>
		);

		const renderContent = () => {
			return isMuted && !alwaysShow ? (
				muteAlert
			) : (
				<>
					<NoteCommunityMetadata event={post.event} pl="2" />
					<TrustProvider
						trust={focusId === post.event.id ? true : undefined}
						event={post.event}
					>
						<TextNoteContents event={post.event} pl="2" />
					</TrustProvider>
				</>
			);
		};

		const showReactionsOnNewLine = useBreakpointValue({
			base: true,
			lg: false,
		});
		const reactionButtons = showReactions && (
			<NoteReactions
				event={post.event}
				flexWrap="wrap"
				variant="ghost"
				size="sm"
			/>
		);
		const footer = (
			<Flex gap="2" alignItems="center">
				<ButtonGroup variant="ghost" size="sm">
					<IconButton
						aria-label="Reply"
						title="Reply"
						onClick={replyForm.onToggle}
						icon={<ReplyIcon />}
					/>
					<RepostButton event={post.event} />
					<QuoteRepostButton event={post.event} />
					<NoteZapButton event={post.event} />
				</ButtonGroup>
				{!showReactionsOnNewLine && reactionButtons}
				<Spacer />
				<ButtonGroup size="sm" variant="ghost">
					<NoteProxyLink event={post.event} />
					<NoteDetailsButton event={post.event} onClick={detailsModal.onOpen} />
					<BookmarkButton event={post.event} aria-label="Bookmark" />
					<NoteMenu
						event={post.event}
						aria-label="More Options"
						detailsClick={detailsModal.onOpen}
					/>
				</ButtonGroup>
			</Flex>
		);

		const ref = useRef<HTMLDivElement | null>(null);
		useRegisterIntersectionEntity(ref, post.event.id);

		if (isMuted && replies.length === 0) return null;

		return (
			<>
				<Flex
					direction="column"
					gap="2"
					p="2"
					borderRadius="md"
					borderWidth=".1rem .1rem .1rem .35rem"
					{...colorProps}
					ref={ref}
				>
					{header}
					{expanded.isOpen && renderContent()}
					{expanded.isOpen && showReactionsOnNewLine && reactionButtons}
					{expanded.isOpen && footer}
				</Flex>
				{replyForm.isOpen && (
					<ReplyForm
						item={post}
						onCancel={replyForm.onClose}
						onSubmitted={replyForm.onClose}
					/>
				)}
				{replies.length > 0 && expanded.isOpen && (
					<Flex direction="column" gap="2" pl={{ base: 2, md: 4 }}>
						{replies.map((child) => (
							<ThreadPost
								key={child.event.id}
								post={child}
								focusId={focusId}
								level={level + 1}
							/>
						))}
					</Flex>
				)}
				{detailsModal.isOpen && (
					<EventInteractionDetailsModal
						isOpen
						onClose={detailsModal.onClose}
						event={post.event}
					/>
				)}
			</>
		);
	},
);
