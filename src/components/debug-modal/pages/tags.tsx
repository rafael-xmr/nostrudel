import { Flex } from "@chakra-ui/react";
import type { NostrEvent } from "nostr-tools";

import DebugEventTags from "../event-tags";
import RawJson from "../raw-json";
import { getContentTagRefs } from "../../../helpers/nostr/event";
import { ErrorBoundary } from "../../error-boundary";

export default function DebugTagsPage({ event }: { event: NostrEvent }) {
	return (
		<Flex
			direction="column"
			gap="2"
			alignItems="flex-start"
			justifyContent="flex-start"
		>
			<ErrorBoundary>
				<DebugEventTags event={event} />
			</ErrorBoundary>
			<RawJson
				heading="Tags referenced in content"
				json={getContentTagRefs(event.content, event.tags)}
			/>
		</Flex>
	);
}
