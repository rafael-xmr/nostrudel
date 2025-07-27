import { ActionHub } from "applesauce-actions";
import { kinds } from "nostr-tools";
import { getOutboxes } from "applesauce-core/helpers";

import type { EventStoreManagement } from "./event-store";
import type { EventFactoryManagement } from "./event-factory";
import type { RelayPoolManagement } from "./pool";

export interface ActionsManagement {
	actions: ActionHub;
}

export default function createActionsManagement(
	eventStoreManagement: EventStoreManagement,
	eventFactoryManagement: EventFactoryManagement,
	relayPoolManagement: RelayPoolManagement,
): ActionsManagement {
	const { eventStore } = eventStoreManagement;
	const { factory } = eventFactoryManagement;
	const { pool } = relayPoolManagement;

	const actions = new ActionHub(eventStore, factory, async (event) => {
		const mailboxes = eventStore.getReplaceable(kinds.RelayList, event.pubkey);
		const outboxes = mailboxes && getOutboxes(mailboxes);

		if (!outboxes) throw new Error("Failed to get outboxes");

		// publish the event
		eventStore.add(event);
		pool.publish(outboxes, event);
	});

	return {
		actions,
	};
}
