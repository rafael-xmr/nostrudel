import channelMetadataService from "./channel-metadata-loader";
import { eventStore, queryStore } from "./event-store";
import localSettings from "./local-settings";
import readStatusService from "./read-status";
import relayInfoService from "./relay-info";
import timelineCacheService from "./timeline-cache";
import { userSearchDirectory } from "./username-search";

const noStrudel = {
	rxNostr: window.rxNostr,

	/**
	 * Internal applesauce EventStore
	 * @see https://hzrd149.github.io/applesauce/classes/applesauce_core.EventStore.html
	 */
	eventStore,
	/**
	 * Internal applesauce QueryStore
	 * @see https://hzrd149.github.io/applesauce/classes/applesauce_core.QueryStore.html
	 */
	queryStore,

	/** Account management */
	accounts: window.accounts,

	// other internal services
	replaceableEventLoader: window.replaceableEventLoader,
	singleEventLoader: window.singleEventLoader,
	userSetsLoader: window.userSetsLoader,
	userSearchDirectory,
	readStatusService,
	relayInfoService,
	channelMetadataService,
	timelineCacheService,
	localSettings,
};

localSettings.debugApi.subscribe((enabled) => {
	if (enabled) Reflect.set(window, "noStrudel", noStrudel);
	if (typeof window !== "undefined") delete window.noStrudel;
});
