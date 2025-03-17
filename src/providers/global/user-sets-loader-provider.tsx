import {
	createContext,
	type PropsWithChildren,
	useContext,
	useEffect,
	useMemo,
} from "react";
import _throttle from "lodash.throttle";
import { UserSetsLoader } from "applesauce-loaders";
import { useRxNostr } from "./rx-nostr-provider";
import { eventStore } from "~/services/event-store";
import { cacheRequest } from "~/services/cache-relay";

const UserSetsLoaderContext = createContext<UserSetsLoader | undefined>(
	undefined,
);

export function useUserSetsLoader() {
	return useContext(UserSetsLoaderContext);
}

export default function UserSetsLoaderProvider({
	children,
}: PropsWithChildren) {
	const rxNostr = useRxNostr();

	const userSetsLoader = useMemo(() => {
		if (!rxNostr) return undefined;

		return new UserSetsLoader(rxNostr, { cacheRequest });
	}, [rxNostr]);

	useEffect(() => {
		if (!userSetsLoader) return;

		const subscription = userSetsLoader.subscribe((packet) =>
			eventStore.add(packet.event, packet.from),
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
