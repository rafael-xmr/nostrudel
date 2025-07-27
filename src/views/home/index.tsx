import { useCallback, useEffect, useMemo } from "react";
import { Flex, Spacer, useDisclosure } from "@chakra-ui/react";
import { kinds } from "nostr-tools";

import { isReply, isRepost } from "~/helpers/nostr/event";
import useTimelineLoader from "~/hooks/use-timeline-loader";
import type { NostrEvent } from "nostr-tools";
import TimelinePage, {
	useTimelinePageEventFilter,
} from "~/components/timeline-page";
import TimelineViewTypeButtons from "~/components/timeline-page/timeline-view-type";
import PeopleListSelection from "~/components/people-list-selection/people-list-selection";
import PeopleListProvider, {
	usePeopleListContext,
} from "~/providers/local/people-list-provider";
import useClientSideMuteFilter from "~/hooks/use-client-side-mute-filter";
import NoteFilterTypeButtons from "~/components/note-filter-type-buttons";
import KindSelectionProvider, {
	useKindSelectionContext,
} from "~/providers/local/kind-selection-provider";
import { useReadRelays } from "~/hooks/use-client-relays";
import { localStorageWrapper } from "~/utils/localStorage";

const defaultKinds = [kinds.ShortTextNote, kinds.Repost, kinds.GenericRepost];

function HomePage() {
	const showReplies = useDisclosure({
		defaultIsOpen: localStorageWrapper.getItem("show-replies") === "true",
	});
	useEffect(() => {
		localStorageWrapper.setItem("show-replies", String(showReplies.isOpen));
	}, [showReplies.isOpen]);

	const showReposts = useDisclosure({
		defaultIsOpen: localStorageWrapper.getItem("show-reposts") !== "false",
	});
	useEffect(() => {
		localStorageWrapper.setItem("show-reposts", String(showReposts.isOpen));
	}, [showReposts.isOpen]);

	const timelinePageEventFilter = useTimelinePageEventFilter();
	const muteFilter = useClientSideMuteFilter();
	const eventFilter = useCallback(
		(event: NostrEvent) => {
			if (muteFilter(event)) return false;
			if (!showReplies.isOpen && isReply(event)) return false;
			if (!showReposts.isOpen && isRepost(event)) return false;
			return timelinePageEventFilter(event);
		},
		[
			timelinePageEventFilter,
			showReplies.isOpen,
			showReposts.isOpen,
			muteFilter,
		],
	);

	const relays = useReadRelays();
	const { filter } = usePeopleListContext();
	const { kinds } = useKindSelectionContext();

	const { loader, timeline } = useTimelineLoader(
		relays,
		{ ...(filter || {}), kinds, limit: 100 },
		{ eventFilter },
	);

	const header = useMemo(
		() => (
			<Flex gap="2" wrap="wrap" alignItems="center">
				<PeopleListSelection />
				<NoteFilterTypeButtons
					showReplies={showReplies}
					showReposts={showReposts}
				/>
				<Spacer />
				<TimelineViewTypeButtons />
			</Flex>
		),
		[showReplies.isOpen, showReposts.isOpen],
	);

	return (
		<TimelinePage
			loader={loader}
			timeline={timeline}
			header={header}
			pt="2"
			pb="12"
			px="2"
		/>
	);
}

export default function HomeView() {
	return (
		<PeopleListProvider>
			<KindSelectionProvider initKinds={defaultKinds}>
				<HomePage />
			</KindSelectionProvider>
		</PeopleListProvider>
	);
}
