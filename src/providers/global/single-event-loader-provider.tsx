import {
	createContext,
	type PropsWithChildren,
	useContext,
	useEffect,
	useMemo,
} from "react";
import _throttle from "lodash.throttle";
import { SingleEventLoader } from "applesauce-loaders";
import { useRelayPoolProvider } from "./pool";
import { useEventStore } from "applesauce-react/hooks";

const SingleEventLoaderContext = createContext<SingleEventLoader | undefined>(
	undefined,
);

export function useSingleEventLoader() {
	return useContext(SingleEventLoaderContext);
}

export default function SingleEventLoaderProvider({
	children,
}: PropsWithChildren) {
	const pool = useRelayPoolProvider();
	const eventStore = useEventStore();

	const singleEventLoader = useMemo(() => {
		if (!pool?.nostrRequest) return undefined;

		// return new SingleEventLoader(pool?.nostrRequest!, { cacheRequest });
		return new SingleEventLoader(pool?.nostrRequest!);
	}, [pool?.nostrRequest]);

	useEffect(() => {
		if (!singleEventLoader) return;

		const subscription = singleEventLoader.subscribe((event) =>
			eventStore.add(event),
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
