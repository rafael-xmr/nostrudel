import { WorkerRelayInterface } from "@snort/worker-relay";
import WorkerVite from "@snort/worker-relay/src/worker?worker";

const workerScript = process.env.NEXT_PUBLIC_DEV
	? new URL("@snort/worker-relay/dist/esm/worker.mjs", import.meta.url)
	: new WorkerVite();

const workerRelay = new WorkerRelayInterface(workerScript);
await workerRelay.init({ databasePath: "nostrudel.db", insertBatchSize: 100 });

export default workerRelay;
