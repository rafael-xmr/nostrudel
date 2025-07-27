import { useMemo } from "react";
import { Link, type LinkProps } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { nip19 } from "nostr-tools";

import { truncatedId } from "../../helpers/nostr/event";
import { useLocalSettings } from "~/providers/global/preferences";

export type NoteLinkProps = LinkProps & {
	noteId: string;
};

export function NoteLink({
	children,
	noteId,
	color = "blue.500",
	...props
}: NoteLinkProps) {
	const { relayHintsManagement } = useLocalSettings();
	const nevent = useMemo(() => {
		const relays = relayHintsManagement
			.getEventPointerRelayHints(noteId)
			.slice(0, 2);
		return nip19.neventEncode({ id: noteId, relays });
	}, [noteId]);

	return (
		<Link as={RouterLink} to={`/n/${nevent}`} color={color} {...props}>
			{children || truncatedId(nevent)}
		</Link>
	);
}

export default NoteLink;
