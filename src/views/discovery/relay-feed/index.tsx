import {
	Alert,
	AlertDescription,
	AlertIcon,
	AlertTitle,
	Button,
	Flex,
	Text,
} from "@chakra-ui/react";
import { mapEventsToStore } from "applesauce-core";
import {
	useActiveAccount,
	useObservableEagerMemo,
	useObservableMemo,
} from "applesauce-react/hooks";
import { onlyEvents } from "applesauce-relay";
import { kinds, type NostrEvent } from "nostr-tools";
import { Navigate, useParams } from "react-router-dom";
import {
	type Observable,
	ReplaySubject,
	scan,
	share,
	startWith,
	timer,
} from "rxjs";

import SimpleView from "../../../components/layout/presets/simple-view";
import RouterLink from "../../../components/router-link";
import GenericNoteTimeline from "../../../components/timeline-page/generic-note-timeline";
import { useAppTitle } from "../../../hooks/use-app-title";
import useAsyncAction from "../../../hooks/use-async-action";
import { useLocalSettings } from "~/providers/global/preferences";
import type { RelayPoolManagement } from "../../../services/pool";
import RelayFavicon from "../../../components/relay-favicon";
import type { EventStoreManagement } from "~/services/event-store";

function RelayAuthAlert({ relay }: { relay: string }) {
	const { relayPoolManagement, authenticationSignerManagement } =
		useLocalSettings();
	const pool = relayPoolManagement.pool;

	const account = useActiveAccount();
	const authenticated = useObservableMemo(
		() => pool.relay(relay).authenticated$,
		[relay],
	);
	const required = useObservableMemo(
		() => pool.relay(relay).authRequiredForRead$,
		[relay],
	);
	const response = useObservableMemo(
		() => pool.relay(relay).authenticationResponse$,
		[relay],
	);

	const authenticate = useAsyncAction(async () => {
		if (!account) throw new Error("No account");
		await authenticationSignerManagement.authenticate(relay);
	});

	if (!required || authenticated) return null;

	if (response?.ok === false && response.message)
		return (
			<Alert status="error">
				<AlertIcon />
				<AlertTitle>Authentication error</AlertTitle>
				<AlertDescription>{response.message}</AlertDescription>
			</Alert>
		);

	return (
		<Alert status="warning">
			<AlertIcon />
			<AlertTitle>Authentication required</AlertTitle>
			<AlertDescription>
				This relay requires authentication to read.
			</AlertDescription>
			<Button
				ms="auto"
				colorScheme="primary"
				onClick={authenticate.run}
				isLoading={authenticate.loading}
			>
				Authenticate
			</Button>
		</Alert>
	);
}

const cache = new Map<string, Observable<NostrEvent[]>>();

function getRelayFeed(
	relay: string,
	eventStoreManagement: EventStoreManagement,
	relayPoolManagement: RelayPoolManagement,
) {
	if (cache.has(relay)) return cache.get(relay)!;
	const observable = relayPoolManagement.pool
		.relay(relay)
		.subscription({ kinds: [kinds.ShortTextNote] })
		.pipe(
			onlyEvents(),
			mapEventsToStore(eventStoreManagement.eventStore),
			scan((acc, event) => [...acc, event], [] as NostrEvent[]),
			startWith([] as NostrEvent[]),
			// cache feed for 2 minutes
			share({
				connector: () => new ReplaySubject(1),
				resetOnRefCountZero: () => timer(120_000),
			}),
		);

	cache.set(relay, observable);
	return observable;
}

function RelayFeedPage({ relay }: { relay: string }) {
	useAppTitle(`${relay} - Feed`);
	const { eventStoreManagement, relayPoolManagement } = useLocalSettings();

	const timeline = useObservableEagerMemo(
		() => getRelayFeed(relay, eventStoreManagement, relayPoolManagement),
		[relay],
	);

	return (
		<SimpleView
			title={
				<Flex gap="2" alignItems="center">
					<RelayFavicon relay={relay} size="sm" />
					<Text fontWeight="bold">{relay}</Text>
				</Flex>
			}
			center
			maxW="container.xl"
			actions={
				<Button
					variant="ghost"
					as={RouterLink}
					to={`/relays/${encodeURIComponent(relay)}`}
					ms="auto"
				>
					Details
				</Button>
			}
		>
			<RelayAuthAlert relay={relay} />

			{timeline && <GenericNoteTimeline timeline={timeline} />}
		</SimpleView>
	);
}

export default function RelayFeedView() {
	const { relay } = useParams();
	if (!relay) return <Navigate to="/discovery" />;

	return <RelayFeedPage relay={relay} />;
}
