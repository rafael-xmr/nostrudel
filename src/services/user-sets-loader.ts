import _throttle from "lodash.throttle";
import { UserSetsLoader } from "applesauce-loaders";

import { eventStore } from "./event-store";
import { cacheRequest } from "./cache-relay";

let topLevelUserSetsLoader: UserSetsLoader | null = null;

export default async function getUserSetsLoader() {
	if (topLevelUserSetsLoader) return topLevelUserSetsLoader;

	const userSetsLoader = new UserSetsLoader(window.rxNostr, { cacheRequest });

	userSetsLoader.subscribe((packet) =>
		eventStore.add(packet.event, packet.from),
	);

	if (typeof window !== "undefined") {
		//@ts-expect-error
		window.userSetsLoader = userSetsLoader;
	}

	topLevelUserSetsLoader = userSetsLoader;

	return userSetsLoader;
}
