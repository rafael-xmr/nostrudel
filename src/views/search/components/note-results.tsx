import { useMemo } from "react";
import type { NostrEvent } from "nostr-tools";
import { Button, Flex, Heading, useDisclosure } from "@chakra-ui/react";

import { TimelineNote } from "../../../components/note/timeline-note";
import useClientSideMuteFilter from "~/hooks/use-client-side-mute-filter";

const MAX_NOTES = 4;

export default function NoteSearchResults({ notes }: { notes: NostrEvent[] }) {
	const more = useDisclosure();

	const muteFilter = useClientSideMuteFilter();
	const muted = useMemo(
		() => notes.filter((event) => !muteFilter(event)),
		[notes, muteFilter],
	);
	const filtered = useMemo(
		() => (more.isOpen ? muted : Array.from(muted).slice(0, MAX_NOTES)),
		[muted, more.isOpen],
	);

	return (
		<>
			<Flex justifyContent="space-between" gap="2" alignItems="flex-end">
				<Heading size="md">Notes ({muted.length})</Heading>
				{filtered.length > MAX_NOTES && (
					<Button size="sm" variant="ghost" onClick={more.onToggle}>
						Show {more.isOpen ? "less" : "all"}
					</Button>
				)}
			</Flex>
			{filtered.map((note) => (
				<TimelineNote key={note.id} event={note} />
			))}
			{!more.isOpen && muted.length > MAX_NOTES && (
				<Button
					mx="auto"
					size="lg"
					variant="ghost"
					onClick={more.onOpen}
					px="10"
				>
					Show all
				</Button>
			)}
		</>
	);
}
