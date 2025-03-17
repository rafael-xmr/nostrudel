import {
	createContext,
	type PropsWithChildren,
	useContext,
	useMemo,
} from "react";
import { ActionHub } from "applesauce-actions";
import { kinds } from "nostr-tools";
import { getOutboxes } from "applesauce-core/helpers";
import { useRxNostr } from "./rx-nostr-provider";
import { eventStore } from "~/services/event-store";
import { useEventFactory } from "applesauce-react/hooks";

const ActionHubContext = createContext<ActionHub | undefined>(undefined);

export function useActionHubProvider() {
	return useContext(ActionHubContext);
}

export default function ActionHubProvider({ children }: PropsWithChildren) {
	const rxNostr = useRxNostr();
	const factory = useEventFactory();

	const actions = useMemo(() => {
		if (!rxNostr || !factory) return undefined;

		return new ActionHub(eventStore, factory, async (event) => {
			const mailboxes = eventStore.getReplaceable(
				kinds.RelayList,
				event.pubkey,
			);
			const outboxes = mailboxes && getOutboxes(mailboxes);

			eventStore.add(event);
			rxNostr.send(event, { on: { relays: outboxes } });
		});
	}, [factory, rxNostr]);

  console.log("ActionHubContext", actions);

	return (
		<ActionHubContext.Provider value={actions}>
			{children}
		</ActionHubContext.Provider>
	);
}
