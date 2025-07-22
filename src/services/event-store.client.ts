import { EventStore, logger } from "applesauce-core";
import { isFromCache } from "applesauce-core/helpers";

import {
	type NostrEvent,
	verifyEvent as internalVerifyEvent,
} from "nostr-tools";
import { setNostrWasm, verifyEvent as wasmVerifyEvent } from "nostr-tools/wasm";
import { fakeVerifyEvent } from "applesauce-core/helpers/event";
import { distinctUntilChanged } from "rxjs";
import { QueryStore } from "./query-store";
import localSettings from "./preferences";

const log = logger.extend("VerifyEvent");
let verifyEventMethod: typeof internalVerifyEvent;
let alwaysVerifyMethod: typeof internalVerifyEvent;

function loadWithTimeout() {
	return new Promise<typeof internalVerifyEvent>((res, rej) => {
		const timeout = setTimeout(() => {
			log("Timeout");
			rej(new Error("Timeout"));
		}, 5_000);

		return import("nostr-wasm").then(({ initNostrWasm }) => {
			log("Initializing WebAssembly");

			return initNostrWasm().then((nw) => {
				clearTimeout(timeout);
				setNostrWasm(nw);
				res(wasmVerifyEvent);
				return wasmVerifyEvent;
			});
		});
	});
}

function verifyEvent(event: NostrEvent) {
	return verifyEventMethod(event);
}

async function updateVerifyMethod() {
	try {
		switch (localSettings.verifyEventMethod.value) {
			case "wasm":
				if (typeof window !== "undefined") {
					if (!("WebAssembly" in window))
						throw new Error("WebAssembly not supported");
				}
				log("Loading WebAssembly module");
				verifyEventMethod = alwaysVerifyMethod = await loadWithTimeout();
				log("Loaded");
				break;
			case "none":
				log("Using fake verify event method");
				verifyEventMethod = fakeVerifyEvent;
				alwaysVerifyMethod = internalVerifyEvent;
				break;
			// case "internal":
			default:
				log("Using internal nostr-tools");
				verifyEventMethod = alwaysVerifyMethod = internalVerifyEvent;
				break;
		}
	} catch (error) {
		console.error("Failed to initialize event verification method, disabling");
		console.log(error);

		localSettings.verifyEventMethod.next("none");
		verifyEventMethod = alwaysVerifyMethod = internalVerifyEvent;
	}
}

localSettings.verifyEventMethod
	.pipe(distinctUntilChanged())
	.subscribe(updateVerifyMethod);

const eventStore = new EventStore();
const queryStore = new QueryStore(eventStore);

eventStore.verifyEvent = (event) => {
	return isFromCache(event) || verifyEvent(event);
};

export { eventStore, queryStore, verifyEvent, alwaysVerifyMethod };
