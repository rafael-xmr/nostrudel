import { ReplaceableLoader } from "applesauce-loaders/loaders";

import { eventStore } from "./event-store.client";
import { nostrRequest } from "./pool.client";
import { DEFAULT_LOOKUP_RELAYS } from "../const";
import { cacheRequest } from "./cache-relay.client";
import localSettings from "./preferences";

const replaceableEventLoader = new ReplaceableLoader(nostrRequest, {
	cacheRequest,
	lookupRelays: DEFAULT_LOOKUP_RELAYS,
});

// Subscribe to loader and send events to event store
replaceableEventLoader.subscribe((event) => eventStore.add(event));

// Set loaders extra relays to app relays
localSettings.readRelays.subscribe((relays) => {
	replaceableEventLoader.extraRelays = relays;
});

export default replaceableEventLoader;
