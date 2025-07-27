import type {
	NostrPublishMethod,
	NostrSubscriptionMethod,
} from "applesauce-signers";

import { onlyEvents } from "applesauce-relay";
import { useLocalSettings } from "~/providers/global/preferences";

export const nostrConnectSubscription: NostrSubscriptionMethod = (
	relays,
	filters,
) => {
	const { relayPoolManagement } = useLocalSettings();
	return relayPoolManagement.pool
		.subscription(relays, filters)
		.pipe(onlyEvents());
};
export const nostrConnectPublish: NostrPublishMethod = async (
	relays,
	event,
) => {
	const { relayPoolManagement } = useLocalSettings();
	await relayPoolManagement.pool.publish(relays, event);
};
