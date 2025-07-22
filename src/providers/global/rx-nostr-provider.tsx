import {
	createContext,
	type PropsWithChildren,
	useContext,
	useEffect,
	useMemo,
} from "react";
import { type ConnectionState, createRxNostr, noopVerifier } from "rx-nostr";
import { BehaviorSubject, combineLatest } from "rxjs";
import { unixNow } from "applesauce-core/helpers";
import { nanoid } from "nanoid";
import { useAuthenticationSigner } from "./authentication-signer-provider";
import { unique } from "~/helpers/array";
import { NostrConnectAccount } from "applesauce-accounts/accounts";
import { createNostrConnectConnection } from "~/classes/nostr-connect-connection";
import localSettings from "~/services/preferences";

export const connections$ = new BehaviorSubject<
	Record<string, ConnectionState>
>({});

export const notices$ = new BehaviorSubject<
	{ id: string; from: string; message: string; timestamp: number }[]
>([]);

const RxNostrContext = createContext<
	ReturnType<typeof createRxNostr> | undefined
>(undefined);

export function useRxNostr() {
	return useContext(RxNostrContext);
}

let cachedRxNostr: ReturnType<typeof createRxNostr> | undefined;

export default function RxNostrProvider({ children }: PropsWithChildren) {
	const authenticationSigner = useAuthenticationSigner();

	const rxNostr = useMemo(() => {
		if (cachedRxNostr) return cachedRxNostr;
		if (!authenticationSigner) return undefined;

		const rxNostrInstance = createRxNostr({
			verifier: noopVerifier,
			skipVerify: true,
			authenticator: { signer: authenticationSigner },
			connectionStrategy: "lazy-keep",
			disconnectTimeout: 120_000,
		});

		NostrConnectAccount.createConnectionMethods = () =>
			createNostrConnectConnection(rxNostrInstance);

		cachedRxNostr = rxNostrInstance;
		return rxNostrInstance;
	}, [authenticationSigner]);

	useEffect(() => {
		if (!rxNostr) return;

		const subscription = combineLatest([
			localSettings.readRelays,
			localSettings.writeRelays,
		]).subscribe(([read, write]) => {
			const relays = unique([...read, ...write]);

			rxNostr.setDefaultRelays(
				relays.map((url) => ({
					url,
					read: read.includes(url),
					write: write.includes(url),
				})),
			);
		});

		const connectionSubscription = rxNostr
			.createConnectionStateObservable()
			.subscribe((packet) => {
				authenticationSigner!.handleRelayConnectionState(packet);

				if (packet.from !== "") {
					const url = new URL(packet.from).toString();
					connections$.next({ ...connections$.value, [url]: packet.state });
				}
			});

		const messageSubscription = rxNostr
			.createAllMessageObservable()
			.subscribe((packet) => {
				if (packet.type === "NOTICE") {
					const from = new URL(packet.from).toString();

					const notice = {
						id: nanoid(),
						from,
						message: packet.notice,
						timestamp: unixNow(),
					};
					notices$.next([...notices$.value, notice]);
				}
			});

		return () => {
			subscription.unsubscribe();
			connectionSubscription.unsubscribe();
			messageSubscription.unsubscribe();
		};
	}, [rxNostr, authenticationSigner]);

	return (
		<RxNostrContext.Provider value={rxNostr}>
			{children}
		</RxNostrContext.Provider>
	);
}
