import { WorkerRelayInterface } from "@snort/worker-relay";
import WorkerVite from "@snort/worker-relay/src/worker?worker";
import { markFromCache } from "applesauce-core/helpers";
import dayjs from "dayjs";
import { nanoid } from "nanoid";
import type { NostrEvent } from "nostr-tools";
import { Observable, tap } from "rxjs";

import { logger } from "../../helpers/debug";
import type { PreferenceSubject } from "~/classes/preference-subject";
import type { EventCache } from "./interface";

export interface WasmWorkerManagement {
	worker: WorkerRelayInterface;
	cache: EventCache;
	pruneInterval: NodeJS.Timeout | null;
	startPruning: () => void;
	stopPruning: () => void;
}

export default function createWasmWorkerManagement(
	wasmPersistForDays: PreferenceSubject<number | null>,
): WasmWorkerManagement {
	const log = logger.extend(`wasm-worker`);

	const workerScript = import.meta.env.DEV
		? new URL("@snort/worker-relay/dist/esm/worker.mjs", import.meta.url)
		: new WorkerVite();

	const worker = new WorkerRelayInterface(workerScript);
	worker.init({ databasePath: "nostrudel.db", insertBatchSize: 100 });

	const wasmWorkerCache: EventCache = {
		type: "wasm-worker",
		read(filters) {
			return new Observable<NostrEvent>((observer) => {
				const id = nanoid();

				worker
					.query(["REQ", id, ...filters])
					.then((events) => {
						for (const event of events) observer.next(event);
					})
					.catch((err) => observer.error(err))
					.finally(() => observer.complete());
			}).pipe(tap((e) => markFromCache(e)));
		},
		async write(events) {
			return Promise.all(events.map((event) => worker.event(event)));
		},
		async clear() {
			await worker.wipe();
		},
	};

	let pruneInterval: NodeJS.Timeout | null = null;

	const startPruning = () => {
		if (pruneInterval) return; // Already running

		pruneInterval = setInterval(() => {
			const days = wasmPersistForDays.value;
			if (days) {
				log(`Removing all events older than ${days} days in WASM relay`);
				worker.delete([
					"REQ",
					"prune",
					{ until: dayjs().subtract(days, "days").unix() },
				]);
			}
		}, 60_000);
	};

	const stopPruning = () => {
		if (pruneInterval) {
			clearInterval(pruneInterval);
			pruneInterval = null;
		}
	};

	// Debug exposure
	if (import.meta.env.DEV && typeof window !== "undefined") {
		// @ts-expect-error debug
		window.workerRelay = worker;
	}

	return {
		worker,
		cache: wasmWorkerCache,
		pruneInterval,
		startPruning,
		stopPruning,
	};
}
