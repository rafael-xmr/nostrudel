import {
	createContext,
	type PropsWithChildren,
	useContext,
	useEffect,
	useMemo,
} from "react";
import { kinds } from "nostr-tools";
import {
	getCoordinateFromAddressPointer,
	isAddressPointer,
	isEventPointer,
} from "applesauce-core/helpers";
import type { AddressPointer, EventPointer } from "nostr-tools/nip19";
import { TagValueLoader } from "applesauce-loaders";
import { useRxNostr } from "./rx-nostr-provider";
import { cacheRequest } from "~/services/cache-relay";
import { eventStore } from "~/services/event-store";

type ZapsLoaderContextType = {
	requestZaps: (
		id: string | EventPointer | AddressPointer,
		relays: string[],
		force?: boolean,
	) => void;
	replaceableEventsZapsLoader?: TagValueLoader;
	singleEventsZapsLoader?: TagValueLoader;
};

const ZapsLoaderContext = createContext<ZapsLoaderContextType>({
	requestZaps: () => {},
});

export function useZapsLoader() {
	return useContext(ZapsLoaderContext);
}

export default function ZapsLoaderProvider({ children }: PropsWithChildren) {
	const rxNostr = useRxNostr();

	const replaceableEventsZapsLoader = useMemo(() => {
		if (!rxNostr) return undefined;
		return new TagValueLoader(rxNostr, "a", {
			name: "zaps",
			kinds: [kinds.Zap],
			cacheRequest,
		});
	}, [rxNostr]);

	const singleEventsZapsLoader = useMemo(() => {
		if (!rxNostr) return undefined;
		return new TagValueLoader(rxNostr, "e", {
			name: "zaps",
			kinds: [kinds.Zap],
			cacheRequest,
		});
	}, [rxNostr]);

	const requestZaps = (
		id: string | EventPointer | AddressPointer,
		relays: string[],
		force?: boolean,
	) => {
		if (!replaceableEventsZapsLoader || !singleEventsZapsLoader) return;

		if (typeof id === "string") {
			if (id.includes(":"))
				replaceableEventsZapsLoader.next({ value: id, relays, force });
			else singleEventsZapsLoader.next({ value: id, relays, force });
		} else if (isEventPointer(id)) {
			singleEventsZapsLoader.next({ value: id.id, relays, force });
		} else if (isAddressPointer(id)) {
			replaceableEventsZapsLoader.next({
				value: getCoordinateFromAddressPointer(id),
				relays,
				force,
			});
		}
	};

	useEffect(() => {
		if (!replaceableEventsZapsLoader || !singleEventsZapsLoader) return;

		const replaceableSub = replaceableEventsZapsLoader.subscribe((packet) => {
			eventStore.add(packet.event, packet.from);
		});
		const singleSub = singleEventsZapsLoader.subscribe((packet) => {
			eventStore.add(packet.event, packet.from);
		});

		return () => {
			replaceableSub.unsubscribe();
			singleSub.unsubscribe();
		};
	}, [replaceableEventsZapsLoader, singleEventsZapsLoader]);

	return (
		<ZapsLoaderContext.Provider
			value={{
				requestZaps,
				replaceableEventsZapsLoader,
				singleEventsZapsLoader,
			}}
		>
			{children}
		</ZapsLoaderContext.Provider>
	);
}
