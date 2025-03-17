import type { NostrConnectConnectionMethods } from "applesauce-signers";
import { lastValueFrom, type Subscription } from "rxjs";
import { createRxForwardReq, type RxNostr } from "rx-nostr";

export function createNostrConnectConnection(
	rxNostr: RxNostr,
): NostrConnectConnectionMethods {
	let sub: Subscription | undefined = undefined;

	return {
		onPublishEvent: async (event, relays) => {
			await lastValueFrom(rxNostr.send(event, { on: { relays } }));
		},
		onSubOpen: async (filters, relays, onEvent) => {
			const req = createRxForwardReq();
			sub = rxNostr
				.use(req, { on: { relays } })
				.subscribe((packet) => onEvent(packet.event));
			req.emit(filters);
		},
		onSubClose: async () => sub?.unsubscribe(),
	};
}
