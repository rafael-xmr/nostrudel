import _throttle from "lodash.throttle";
import { SingleEventLoader } from "applesauce-loaders";

import { eventStore } from "./event-store";
import { cacheRequest } from "./cache-relay";

let topLevelSingleEventLoader: SingleEventLoader | null = null;

export default async function getSingleEventLoader() {
	if (topLevelSingleEventLoader) return topLevelSingleEventLoader;

	const singleEventLoader = new SingleEventLoader(window.rxNostr, {
		cacheRequest,
	});

	singleEventLoader.subscribe((packet) =>
		eventStore.add(packet.event, packet.from),
	);

	if (typeof window !== "undefined") {
		//@ts-expect-error
		window.singleEventLoader = singleEventLoader;
	}

	topLevelSingleEventLoader = singleEventLoader;

	return singleEventLoader;
}
