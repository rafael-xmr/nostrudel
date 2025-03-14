import { ReplaceableLoader } from "applesauce-loaders/loaders";

import { eventStore } from "./event-store";
import { COMMON_CONTACT_RELAYS } from "../const";
import { cacheRequest } from "./cache-relay";

let topLevelReplaceableEventLoader: ReplaceableLoader | null = null;

export async function getReplaceableEventLoader() {
	if (topLevelReplaceableEventLoader) return topLevelReplaceableEventLoader;

	if (typeof window === "undefined") return topLevelReplaceableEventLoader;

	const replaceableEventLoader = new ReplaceableLoader(window.rxNostr, {
		cacheRequest,
		lookupRelays: COMMON_CONTACT_RELAYS,
	});

	replaceableEventLoader.subscribe((packet) =>
		eventStore.add(packet.event, packet.from),
	);

	if (typeof window !== "undefined") {
		//@ts-expect-error debug
		window.replaceableEventLoader = replaceableEventLoader;
	}

	topLevelReplaceableEventLoader = replaceableEventLoader;

	return replaceableEventLoader;
}

export default topLevelReplaceableEventLoader;
