import {
	createContext,
	type PropsWithChildren,
	useContext,
	useEffect,
	useMemo,
} from "react";
import { kinds } from "nostr-tools";
import type { AddressPointer, EventPointer } from "nostr-tools/nip19";
import {
	getCoordinateFromAddressPointer,
	isAddressPointer,
	isEventPointer,
} from "applesauce-core/helpers";
import { TagValueLoader } from "applesauce-loaders";
import { useRelayPoolProvider } from "./pool";
import { useEventStore } from "applesauce-react/hooks";

type ReactionsLoaderContextType = {
	requestReactions: (
		id: string | EventPointer | AddressPointer,
		relays: string[],
		force?: boolean,
	) => void;
	replaceableEventsReactionsLoader?: TagValueLoader;
	singleEventsReactionsLoader?: TagValueLoader;
};

const ReactionsLoaderContext = createContext<ReactionsLoaderContextType>({
	requestReactions: () => {},
});

export function useReactionsLoader() {
	return useContext(ReactionsLoaderContext);
}

export default function ReactionsLoaderProvider({
	children,
}: PropsWithChildren) {
	const pool = useRelayPoolProvider();
	const eventStore = useEventStore();

	const replaceableEventsReactionsLoader = useMemo(() => {
		if (!pool?.nostrRequest) return undefined;

		return new TagValueLoader(pool?.nostrRequest!, "a", {
			name: "reactions",
			kinds: [kinds.Reaction],
			// cacheRequest,
		});
	}, [pool?.nostrRequest]);

	const singleEventsReactionsLoader = useMemo(() => {
		if (!pool?.nostrRequest) return undefined;

		return new TagValueLoader(pool?.nostrRequest!, "e", {
			name: "reactions",
			kinds: [kinds.Reaction],
			// cacheRequest,
		});
	}, [pool?.nostrRequest]);

	const requestReactions = (
		id: string | EventPointer | AddressPointer,
		relays: string[],
		force?: boolean,
	) => {
		if (!replaceableEventsReactionsLoader || !singleEventsReactionsLoader)
			return;

		if (typeof id === "string") {
			if (id.includes(":"))
				replaceableEventsReactionsLoader.next({ value: id, relays, force });
			else singleEventsReactionsLoader.next({ value: id, relays, force });
		} else if (isEventPointer(id)) {
			singleEventsReactionsLoader.next({ value: id.id, relays, force });
		} else if (isAddressPointer(id)) {
			replaceableEventsReactionsLoader.next({
				value: getCoordinateFromAddressPointer(id),
				relays,
				force,
			});
		}
	};

	useEffect(() => {
		if (!replaceableEventsReactionsLoader || !singleEventsReactionsLoader)
			return;

		const replaceableSub = replaceableEventsReactionsLoader.subscribe(
			(event) => {
				eventStore.add(event);
			},
		);
		const singleSub = singleEventsReactionsLoader.subscribe((packet) => {
			eventStore.add(packet);
		});

		return () => {
			replaceableSub.unsubscribe();
			singleSub.unsubscribe();
		};
	}, [replaceableEventsReactionsLoader, singleEventsReactionsLoader]);

	return (
		<ReactionsLoaderContext.Provider
			value={{
				requestReactions,
				replaceableEventsReactionsLoader,
				singleEventsReactionsLoader,
			}}
		>
			{children}
		</ReactionsLoaderContext.Provider>
	);
}
