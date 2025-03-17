import {
	createContext,
	type PropsWithChildren,
	useContext,
	useMemo,
} from "react";
import { kinds, nip19, type NostrEvent } from "nostr-tools";
import type { AddressPointer, EventPointer } from "nostr-tools/nip19";
import { useRelayScoreboard } from "./relay-scoreboard-provider";
import { eventStore } from "~/services/event-store";
import {
	getOutboxes,
	getSeenRelays,
	getTagValue,
	isReplaceable,
} from "applesauce-core/helpers";

type RelayHintsContextType = {
	getEventRelayHints: (event: NostrEvent, count?: number) => string[];
	getAddressPointerRelayHints: (pointer: AddressPointer) => string[];
	getEventPointerRelayHints: (pointerOrId: string | EventPointer) => string[];
	getEventPointerRelayHint: (
		pointerOrId: string | EventPointer,
	) => string | undefined;
	getEventRelayHint: (id: string) => string | undefined;
	getPubkeyRelayHint: (pubkey: string) => string | undefined;
	getSharableEventAddress: (
		event: NostrEvent,
		relays?: Iterable<string>,
	) => string | null;
};

const RelayHintsContext = createContext<RelayHintsContextType>({
	getEventRelayHints: () => [],
	getAddressPointerRelayHints: () => [],
	getEventPointerRelayHints: () => [],
	getEventPointerRelayHint: () => undefined,
	getEventRelayHint: () => undefined,
	getPubkeyRelayHint: () => undefined,
	getSharableEventAddress: () => null,
});

export function useRelayHints() {
	return useContext(RelayHintsContext);
}

function pickBestRelays(relays: Iterable<string>, relayScoreboardService: any) {
	const urls = Array.from(relays).filter(
		(url) => !url.includes("://localhost") && !url.includes("://192.168"),
	);
	return relayScoreboardService.getRankedRelays(urls);
}

function getAuthorHints(pubkey: string) {
	const mailboxes = eventStore.getReplaceable(kinds.RelayList, pubkey);
	const outbox = mailboxes && getOutboxes(mailboxes);
	return outbox ? Array.from(outbox) : [];
}

function getSeenHints(id: string | NostrEvent) {
	let event: NostrEvent | undefined = undefined;
	if (typeof id === "string") event = eventStore.getEvent(id);
	else event = id;

	if (!event) return [];
	const seen = getSeenRelays(event);
	if (!seen) return [];
	return Array.from(seen);
}

export default function RelayHintsProvider({ children }: PropsWithChildren) {
	const relayScoreboardService = useRelayScoreboard();

	const relayHints = useMemo(() => {
		const getEventRelayHints = (event: NostrEvent, count = 2): string[] => {
			if (!relayScoreboardService) return [];
			return pickBestRelays(
				[...getAuthorHints(event.pubkey), ...getSeenHints(event)],
				relayScoreboardService,
			).slice(0, count);
		};

		const getAddressPointerRelayHints = (pointer: AddressPointer): string[] => {
			if (!relayScoreboardService) return [];
			return pickBestRelays(
				[...getAuthorHints(pointer.pubkey)],
				relayScoreboardService,
			);
		};

		const getEventPointerRelayHints = (
			pointerOrId: string | EventPointer,
		): string[] => {
			if (typeof pointerOrId === "string") {
				const event = eventStore.getEvent(pointerOrId);
				return event ? getEventRelayHints(event) : [];
			}

			const event = eventStore.getEvent(pointerOrId.id);
			if (event) return getEventRelayHints(event);
			if (pointerOrId.author) return getAuthorHints(pointerOrId.author);
			return [];
		};

		const getEventPointerRelayHint = (
			pointerOrId: string | EventPointer,
		): string | undefined => {
			return getEventPointerRelayHints(pointerOrId)[0];
		};

		const getEventRelayHint = (id: string): string | undefined => {
			const event = eventStore.getEvent(id);
			return event && getEventRelayHints(event, 1)[0];
		};

		const getPubkeyRelayHint = (pubkey: string): string | undefined => {
			return getAuthorHints(pubkey)[0];
		};

		const getSharableEventAddress = (
			event: NostrEvent,
			relays?: Iterable<string>,
		): string | null => {
			relays = relays || getEventRelayHints(event, 2);

			if (isReplaceable(event.kind)) {
				const d = getTagValue(event, "d");
				if (!d) return null;
				return nip19.naddrEncode({
					kind: event.kind,
					identifier: d,
					pubkey: event.pubkey,
					relays: Array.from(relays),
				});
			}

			return nip19.neventEncode({
				id: event.id,
				kind: event.kind,
				relays: Array.from(relays),
				author: event.pubkey,
			});
		};

		return {
			getEventRelayHints,
			getAddressPointerRelayHints,
			getEventPointerRelayHints,
			getEventPointerRelayHint,
			getEventRelayHint,
			getPubkeyRelayHint,
			getSharableEventAddress,
		};
	}, [relayScoreboardService]);

	return (
		<RelayHintsContext.Provider value={relayHints}>
			{children}
		</RelayHintsContext.Provider>
	);
}
