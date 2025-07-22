import {
	createContext,
	useContext,
	useMemo,
	type PropsWithChildren,
} from "react";
import { useRelayHints } from "./relay-hints-provider";
import { useAccountManagerProvider } from "./accounts-provider";
import { EventFactory } from "applesauce-factory";
import { NIP_89_CLIENT_APP } from "~/const";

const EventFactoryContext = createContext<EventFactory | undefined>(undefined);

export function useEventFactoryProvider() {
	return useContext(EventFactoryContext);
}

let cachedFactory: EventFactory | undefined;

export default function EventFactoryProvider({ children }: PropsWithChildren) {
	const { accountManager } = useAccountManagerProvider();
	const relayHints = useRelayHints();

	const factory = useMemo(() => {
		if (cachedFactory) return cachedFactory;
		if (!accountManager || !relayHints) return;

		const newFactory = new EventFactory({
			signer: accountManager.signer,
			getEventRelayHint: relayHints.getEventRelayHint,
			getPubkeyRelayHint: relayHints.getPubkeyRelayHint,
			client: NIP_89_CLIENT_APP,
		});

		cachedFactory = newFactory;
		return newFactory;
	}, [accountManager, relayHints]);

	return (
		<EventFactoryContext.Provider value={factory}>
			{children}
		</EventFactoryContext.Provider>
	);
}
