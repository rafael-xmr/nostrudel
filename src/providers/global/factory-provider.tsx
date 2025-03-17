import {
	createContext,
	useContext,
	useEffect,
	useState,
	type PropsWithChildren,
} from "react";
import { useRelayHints } from "./relay-hints-provider";
import { useAccountManagerProvider } from "./accounts-provider";
import { EventFactory } from "applesauce-factory";
import { NIP_89_CLIENT_APP } from "~/const";

const EventFactoryContext = createContext<EventFactory | undefined>(undefined);

export function useEventFactory() {
	return useContext(EventFactoryContext);
}

export default function EventFactoryProvider({ children }: PropsWithChildren) {
	const { accountManager } = useAccountManagerProvider();
	const relayHints = useRelayHints();

	const [factory, setFactory] = useState<EventFactory>();

	useEffect(() => {
		if (!accountManager || !relayHints) return;

		const newFactory = new EventFactory({
			signer: accountManager.signer,
			getEventRelayHint: relayHints.getEventRelayHint,
			getPubkeyRelayHint: relayHints.getPubkeyRelayHint,
			client: NIP_89_CLIENT_APP,
		});

		setFactory(newFactory);
	}, [accountManager, relayHints]);

  console.log("EventFactoryContext", factory);

	return (
		<EventFactoryContext.Provider value={factory}>
			{children}
		</EventFactoryContext.Provider>
	);
}
