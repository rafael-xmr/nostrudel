import { kinds } from "nostr-tools";
import { EMPTY } from "rxjs";
import {
	createAddressLoader,
	createEventLoader,
	createReactionsLoader,
	createSocialGraphLoader,
	createTagValueLoader,
	createUserListsLoader,
} from "applesauce-loaders/loaders";

import type { PreferenceSubject } from "~/classes/preference-subject";
import type { EventStoreManagement } from "~/services/event-store";
import type { RelayPoolManagement } from "~/services/pool";

export interface LoadersManagement {
	addressLoader: ReturnType<typeof createAddressLoader>;
	profileLoader: ReturnType<typeof createAddressLoader>;
	eventLoader: ReturnType<typeof createEventLoader>;
	reactionsLoader: ReturnType<typeof createReactionsLoader>;
	userSetsLoader: ReturnType<typeof createUserListsLoader>;
	channelMetadataLoader: ReturnType<typeof createTagValueLoader>;
	groupInfoLoader: ReturnType<typeof createTagValueLoader>;
	socialGraphLoader: ReturnType<typeof createSocialGraphLoader>;
}

export default function createLoadersManagement(
	relayPoolManagement: RelayPoolManagement,
	eventStoreManagement: EventStoreManagement,
	readRelays: PreferenceSubject<string[]>,
	lookupRelays: PreferenceSubject<string[]>,
): LoadersManagement {
	const { pool } = relayPoolManagement;
	const { eventStore } = eventStoreManagement;

	/** Loader for replaceable events based on coordinate */
	const addressLoader = createAddressLoader(pool, {
		cacheRequest: () => EMPTY, // Will be replaced after cache management is created
		eventStore,
		bufferTime: 500,
		extraRelays: readRelays,
	});

	/** Loader for replaceable events based on coordinate */
	const profileLoader = createAddressLoader(pool, {
		cacheRequest: () => EMPTY, // Will be replaced after cache management is created
		eventStore,
		bufferTime: 200,
		extraRelays: readRelays,
		lookupRelays: lookupRelays,
	});

	/** Loader for single events based on id */
	const eventLoader = createEventLoader(pool, {
		cacheRequest: () => EMPTY, // Will be replaced after cache management is created
		eventStore,
		bufferTime: 500,
		extraRelays: readRelays,
	});

	const reactionsLoader = createReactionsLoader(pool, {
		cacheRequest: () => EMPTY, // Will be replaced after cache management is created
		eventStore,
		extraRelays: readRelays,
	});

	const userSetsLoader = createUserListsLoader(pool, {
		cacheRequest: () => EMPTY, // Will be replaced after cache management is created
		eventStore,
		extraRelays: readRelays,
	});

	const channelMetadataLoader = createTagValueLoader(pool, "e", {
		kinds: [kinds.ChannelMetadata],
		cacheRequest: () => EMPTY, // Will be replaced after cache management is created
		extraRelays: readRelays,
	});

	// A loader to load the group info from the relays
	const groupInfoLoader = createTagValueLoader(pool, "d", {
		kinds: [39000],
	});

	/** Loader for loading a users social graph */
	const socialGraphLoader = createSocialGraphLoader(profileLoader, {
		eventStore,
		extraRelays: readRelays,
		hints: false,
	});

	return {
		addressLoader,
		profileLoader,
		eventLoader,
		reactionsLoader,
		userSetsLoader,
		channelMetadataLoader,
		groupInfoLoader,
		socialGraphLoader,
	};
}
