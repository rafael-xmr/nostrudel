import {
	createContext,
	type PropsWithChildren,
	useContext,
	useEffect,
	useMemo,
} from "react";
import _throttle from "lodash.throttle";
import { SingleEventLoader } from "applesauce-loaders";
import { useRxNostr } from "./rx-nostr-provider";
import { eventStore } from "~/services/event-store";
import { cacheRequest } from "~/services/cache-relay";

const SingleEventLoaderContext = createContext<SingleEventLoader | undefined>(
	undefined,
);

export function useSingleEventLoader() {
	return useContext(SingleEventLoaderContext);
}

export default function SingleEventLoaderProvider({
	children,
}: PropsWithChildren) {
	const rxNostr = useRxNostr();

	const singleEventLoader = useMemo(() => {
		if (!rxNostr) return undefined;

		return new SingleEventLoader(rxNostr, { cacheRequest });
	}, [rxNostr]);

	useEffect(() => {
		if (!singleEventLoader) return;

		const subscription = singleEventLoader.subscribe((packet) =>
			eventStore.add(packet.event, packet.from),
		);

		return () => {
			subscription.unsubscribe();
		};
	}, [singleEventLoader]);

	return (
		<SingleEventLoaderContext.Provider value={singleEventLoader}>
			{children}
		</SingleEventLoaderContext.Provider>
	);
}
