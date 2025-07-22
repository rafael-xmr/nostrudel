import {
	type PropsWithChildren,
	createContext,
	useContext,
	useEffect,
	useMemo,
} from "react";
import { type NostrEvent, kinds } from "nostr-tools";
import { useActiveAccount, useEventStore } from "applesauce-react/hooks";
import _throttle from "lodash.throttle";
import { getPubkeysFromList } from "../../helpers/nostr/lists";
import { PubkeyGraph } from "../../classes/pubkey-graph";
import { COMMON_CONTACT_RELAYS } from "../../const";
import replaceableEventLoader from "~/services/replaceable-loader.client";
import type { IEventStore } from "applesauce-core";

// Utility function (no hooks)
export function loadSocialGraph(
	eventStore: IEventStore,
	graph: PubkeyGraph,
	kind: number,
	pubkey: string,
	relay?: string,
	maxLvl = 0,
	walked: Set<string> = new Set(),
	handleEventCallback?: (event: NostrEvent) => void,
) {
	let newEvents = 0;
	const contacts = eventStore.getReplaceable(kind, pubkey);
	walked.add(pubkey);

	const handleEvent = (event: NostrEvent) => {
		graph.handleEvent(event);
		newEvents++;
		graph.throttleCompute();

		if (maxLvl > 0) {
			for (const person of getPubkeysFromList(event)) {
				if (walked.has(person.pubkey)) continue;

				loadSocialGraph(
					eventStore,
					graph,
					kind,
					person.pubkey,
					person.relay,
					maxLvl - 1,
					walked,
					handleEventCallback,
				);
			}
		}
		if (handleEventCallback) handleEventCallback(event);
	};

	if (contacts) {
		handleEvent(contacts);
	}

	replaceableEventLoader.next({
		relays: relay ? [relay, ...COMMON_CONTACT_RELAYS] : COMMON_CONTACT_RELAYS,
		kind,
		pubkey,
	});

	const sub = eventStore.replaceable(kind, pubkey).subscribe((e) => {
		if (e) {
			handleEvent(e);
			sub.unsubscribe();
		}
	});

	return newEvents;
}

// Custom hook to manage social graph loading
function useSocialGraphLoader(pubkey?: string, maxLvl = 1) {
	const eventStore = useEventStore();
	const graph = useMemo(
		() => (pubkey ? new PubkeyGraph(pubkey) : null),
		[pubkey],
	);

	useEffect(() => {
		if (!graph || !pubkey) return;

		loadSocialGraph(
			eventStore,
			graph,
			kinds.Contacts,
			pubkey,
			undefined,
			maxLvl,
			new Set(),
		);
	}, [graph, pubkey]);

	return graph;
}

const WebOfTrustContext = createContext<PubkeyGraph | null>(null);

export function useWebOfTrust() {
	return useContext(WebOfTrustContext);
}

export default function WebOfTrustProvider({
	pubkey,
	children,
}: PropsWithChildren<{ pubkey?: string }>) {
	const account = useActiveAccount();
	const effectivePubkey = pubkey || account?.pubkey;
	const graph = useSocialGraphLoader(effectivePubkey);

	return (
		<WebOfTrustContext.Provider value={graph}>
			{children}
		</WebOfTrustContext.Provider>
	);
}
