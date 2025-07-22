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
import { useEventFactoryProvider } from "./factory-provider";
import { useEventStore } from "applesauce-react/hooks";

const ActionHubContext = createContext<ActionHub | undefined>(undefined);

export function useActionHubProvider() {
	return useContext(ActionHubContext);
}

let cachedActions: ActionHub | undefined;

export default function ActionHubProvider({ children }: PropsWithChildren) {
	const rxNostr = useRxNostr();
	const factory = useEventFactoryProvider();
	const eventStore = useEventStore();

	const actions = useMemo(() => {
		if (cachedActions) return cachedActions;
		if (!rxNostr || !factory) return undefined;

		const actionHub = new ActionHub(eventStore, factory, async (event) => {
			const mailboxes = eventStore.getReplaceable(
				kinds.RelayList,
				event.pubkey,
			);
			const outboxes = mailboxes && getOutboxes(mailboxes);

			eventStore.add(event);
			rxNostr.send(event, { on: { relays: outboxes } });
		});

		cachedActions = actionHub;
		return actionHub;
	}, [factory, rxNostr]);

	return (
		<ActionHubContext.Provider value={actions}>
			{children}
		</ActionHubContext.Provider>
	);
}
