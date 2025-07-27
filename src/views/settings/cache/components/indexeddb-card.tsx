import {
	Button,
	Card,
	CardBody,
	CardFooter,
	CardHeader,
	Heading,
	Text,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import { useObservableEagerState } from "applesauce-react/hooks";
import useAsyncAction from "../../../../hooks/use-async-action";
import { useLocalSettings } from "~/providers/global/preferences";
import EnableWithDelete from "./enable-with-delete";

export default function IndexeddbCard() {
	const { eventCacheManagement, indexedDBManagement } = useLocalSettings();
	const eventCache = useObservableEagerState(eventCacheManagement.eventCache$);
	const enabled = eventCache?.type === "nostr-idb";

	const enable = useAsyncAction(async () => {
		await eventCacheManagement.changeEventCache("nostr-idb");
	});

	const wipe = async () => {
		await indexedDBManagement.cache.clear?.();
	};

	return (
		<Card borderColor={enabled ? "primary.500" : undefined} variant="outline">
			<CardHeader p="4" display="flex" gap="2" alignItems="center">
				<Heading size="md">Browser Cache</Heading>
				<EnableWithDelete
					size="sm"
					ml="auto"
					enable={enable.run}
					enabled={enabled}
					wipe={wipe}
					isLoading={enable.loading}
				/>
			</CardHeader>
			<CardBody p="4" pt="0">
				<Text mb="2">Use the browsers built-in database to cache events.</Text>
				<Text>Maximum capacity: 10k events</Text>
				<Text>Performance: Usable, but limited by the browser</Text>
			</CardBody>
			{enabled && (
				<CardFooter p="4" pt="0">
					<Button
						size="sm"
						colorScheme="primary"
						ml="auto"
						as={RouterLink}
						to="/relays/cache/database"
					>
						Database Tools
					</Button>
				</CardFooter>
			)}
		</Card>
	);
}
