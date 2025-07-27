import { EventStore } from "applesauce-core";
import { isFromCache } from "applesauce-core/helpers";
import type { EventVerificationManagement } from "./verify-event";

export interface EventStoreManagement {
	eventStore: EventStore;
}

export default function createEventStoreManagement(
	eventVerificationManagement: EventVerificationManagement,
): EventStoreManagement {
	const eventStore = new EventStore();

	// verify all events added to the store
	eventStore.verifyEvent = (event) => {
		return isFromCache(event) || eventVerificationManagement.verifyEvent(event);
	};

	// Debug exposure
	if (import.meta.env.DEV && typeof window !== "undefined") {
		// @ts-expect-error debug
		window.eventStore = eventStore;
	}

	return {
		eventStore,
	};
}
