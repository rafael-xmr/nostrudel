import {
	createContext,
	type PropsWithChildren,
	useContext,
	useEffect,
	useMemo,
} from "react";
import _throttle from "lodash.throttle";
import { UserSetsLoader } from "applesauce-loaders";
import { useRelayPoolProvider } from "./pool";
import { useEventStore } from "applesauce-react/hooks";

const UserSetsLoaderContext = createContext<UserSetsLoader | undefined>(
	undefined,
);

export function useUserSetsLoader() {
	return useContext(UserSetsLoaderContext);
}

export default function UserSetsLoaderProvider({
	children,
}: PropsWithChildren) {
	const pool = useRelayPoolProvider();
	const eventStore = useEventStore();

	const userSetsLoader = useMemo(() => {
		if (!pool?.nostrRequest) return undefined;

		// return new UserSetsLoader(!pool?.nostrRequest!, { cacheRequest });
		return new UserSetsLoader(pool?.nostrRequest!);
	}, [!pool?.nostrRequest]);

	useEffect(() => {
		if (!userSetsLoader) return;

		const subscription = userSetsLoader.subscribe((event) =>
			eventStore.add(event),
		);

		return () => {
			subscription.unsubscribe();
		};
	}, [userSetsLoader]);

	return (
		<UserSetsLoaderContext.Provider value={userSetsLoader}>
			{children}
		</UserSetsLoaderContext.Provider>
	);
}
