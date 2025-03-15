import { type ConnectionState, createRxNostr, noopVerifier } from "rx-nostr";
import { BehaviorSubject, combineLatest } from "rxjs";
import { unixNow } from "applesauce-core/helpers";
import { nanoid } from "nanoid";

import localSettings from "./local-settings";
import { unique } from "../helpers/array";

let topLevelRxNostr: ReturnType<typeof createRxNostr> | null = null;

// keep track of all relay connection states
export const connections$ = new BehaviorSubject<
	Record<string, ConnectionState>
>({});

// capture all notices sent from relays
export const notices$ = new BehaviorSubject<
	{ id: string; from: string; message: string; timestamp: number }[]
>([]);

export async function getRxNostr() {
	if (topLevelRxNostr) return topLevelRxNostr;

	if (typeof window === "undefined") return topLevelRxNostr;

	const rxNostr = createRxNostr({
		verifier: noopVerifier,
		// don't verify the events at the rx-nostr level
		skipVerify: true,
		authenticator: { signer: window.authenticationSigner },
		connectionStrategy: "lazy-keep",
		disconnectTimeout: 120_000,
	});

	// Set the default relays based on local app settings
	combineLatest([
		localSettings.readRelays,
		localSettings.writeRelays,
	]).subscribe(([read, write]) => {
		const relays = unique([...read, ...write]);

		// update the default relays
		rxNostr.setDefaultRelays(
			relays.map((url) => ({
				url,
				read: read.includes(url),
				write: write.includes(url),
			})),
		);
	});

	rxNostr.createConnectionStateObservable().subscribe((packet) => {
		// pass to authentication signer so it can cleanup
		window.authenticationSigner.handleRelayConnectionState(packet);

		const url = new URL(packet.from).toString();
		connections$.next({ ...connections$.value, [url]: packet.state });
	});

	rxNostr.createAllMessageObservable().subscribe((packet) => {
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

	topLevelRxNostr = rxNostr;

	if (typeof window !== "undefined") {
		window.rxNostr = rxNostr;
	}

	return rxNostr;
}

export default topLevelRxNostr;
