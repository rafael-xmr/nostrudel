import {
	type NostrEvent,
	type VerifiedEvent,
	verifyEvent as internalVerifyEvent,
} from "nostr-tools";
import { setNostrWasm, verifyEvent as wasmVerifyEvent } from "nostr-tools/wasm";
import { fakeVerifyEvent } from "applesauce-core/helpers";
import { map, distinctUntilChanged } from "rxjs";
import type { Observable } from "react-use/lib/useObservable";

import { logger } from "~/helpers/debug";
import type { PreferenceSubject } from "~/classes/preference-subject";

export type VerifyEventMethod = "wasm" | "internal" | "none";

export interface EventVerificationManagement {
	verifyEvent: (event: NostrEvent) => event is VerifiedEvent;
	alwaysVerify: (event: NostrEvent) => event is VerifiedEvent;
	currentMethod$: Observable<VerifyEventMethod>;
}

export default function createEventVerificationManagement(
	verifyEventMethod: PreferenceSubject<string>,
): EventVerificationManagement {
	const log = logger.extend("VerifyEvent");
	let verifyEventFunction: typeof internalVerifyEvent;
	let alwaysVerifyFunction: typeof internalVerifyEvent;

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

	async function updateVerifyMethod() {
		try {
			switch (verifyEventMethod.value) {
				case "wasm":
					if (!("WebAssembly" in window))
						throw new Error("WebAssembly not supported");
					log("Loading WebAssembly module");
					verifyEventFunction = alwaysVerifyFunction = await loadWithTimeout();
					log("Loaded");
					break;
				case "none":
					log("Using fake verify event method");
					verifyEventFunction = fakeVerifyEvent;
					alwaysVerifyFunction = internalVerifyEvent;
					break;
				// case "internal":
				default:
					log("Using internal nostr-tools");
					verifyEventFunction = alwaysVerifyFunction = internalVerifyEvent;
					break;
			}
		} catch (error) {
			console.error(
				"Failed to initialize event verification method, disabling",
			);
			console.log(error);

			verifyEventMethod.next("none");
			verifyEventFunction = alwaysVerifyFunction = internalVerifyEvent;
		}
	}

	// Initialize with default method
	verifyEventFunction = alwaysVerifyFunction = internalVerifyEvent;

	// Subscribe to method changes
	verifyEventMethod.pipe(distinctUntilChanged()).subscribe(updateVerifyMethod);

	// Initialize the method on startup
	updateVerifyMethod();

	const currentMethod$ = verifyEventMethod.pipe(
		map((method) => method as VerifyEventMethod),
		distinctUntilChanged(),
	);

	return {
		verifyEvent: (event: NostrEvent) => verifyEventFunction(event),
		alwaysVerify: (event: NostrEvent) => alwaysVerifyFunction(event),
		currentMethod$,
	};
}
