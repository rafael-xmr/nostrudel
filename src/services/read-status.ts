import dayjs from "dayjs";
import _throttle from "lodash.throttle";
import { BehaviorSubject } from "rxjs";

import SuperMap from "../classes/super-map";
import { logger } from "../helpers/debug";
import type { DatabaseManagement } from "./database";

class ReadStatusService {
	log = logger.extend("ReadStatusService");
	status = new SuperMap<string, BehaviorSubject<boolean | undefined>>(
		() => new BehaviorSubject<boolean | undefined>(undefined),
	);
	ttl = new Map<string, number>();

	constructor(private db: any) {}

	private setTTL(key: string, ttl: number) {
		const current = this.ttl.get(key);
		if (!current || ttl > current) {
			this.ttl.set(key, ttl);
		}
	}

	getStatus(key: string, ttl?: number) {
		const subject = this.status.get(key);

		if (ttl) this.setTTL(key, ttl);
		else this.setTTL(key, dayjs().add(1, "day").unix());

		if (subject.value === undefined && !this.readQueue.has(key)) {
			this.readQueue.add(key);
			this.throttleRead();
		}

		return subject;
	}

	setRead(key: string, read = true, ttl?: number) {
		if (ttl) this.setTTL(key, ttl);
		else this.setTTL(key, dayjs().add(1, "day").unix());

		this.status.get(key).next(read);
		this.writeQueue.add(key);
		this.throttleWrite();
	}

	private readQueue = new Set<string>();
	private throttleRead = _throttle(this.read.bind(this), 100);
	async read() {
		if (this.readQueue.size === 0) return;

		const trans = this.db.transaction("read");

		this.log(`Loading ${this.readQueue.size} from database`);

		await Promise.all(
			Array.from(this.readQueue).map(async (key) => {
				this.readQueue.delete(key);
				const subject = this.status.get(key);
				const status = await trans.store.get(key);

				if (status) {
					subject.next(status.read);
					if (status.ttl) this.setTTL(key, status.ttl);
				} else subject.next(false);
			}),
		);
	}

	private writeQueue = new Set<string>();
	private throttleWrite = _throttle(this.write.bind(this), 100);
	async write() {
		if (this.writeQueue.size === 0) return;

		const trans = this.db.transaction("read", "readwrite");

		let count = 0;
		const defaultTTL = dayjs().add(1, "day").unix();
		for (const key of this.writeQueue) {
			const subject = this.status.get(key);
			if (subject.value !== undefined) {
				trans.store.put({
					key,
					read: subject.value,
					ttl: this.ttl.get(key) ?? defaultTTL,
				});
				count++;
			}
		}

		this.writeQueue.clear();
		await trans.done;

		this.log(`Wrote ${count} to database`);
	}

	async prune() {
		const expired = await this.db.getAllKeysFromIndex(
			"read",
			"ttl",
			IDBKeyRange.upperBound(dayjs().unix()),
		);

		if (expired.length === 0) return;

		const tx = this.db.transaction("read", "readwrite");
		await Promise.all(expired.map((key) => tx.store.delete(key)));
		await tx.done;

		this.log(`Removed ${expired.length} expired entries`);
	}
}

export interface ReadStatusManagement {
	service: ReadStatusService;
	startAutoPrune: () => void;
	stopAutoPrune: () => void;
}

export default async function createReadStatusManagement(
	databaseManagement: DatabaseManagement,
): Promise<ReadStatusManagement> {
	const db = await databaseManagement.database;
	const service = new ReadStatusService(db);

	let autoPruneInterval: NodeJS.Timeout | null = null;

	const startAutoPrune = () => {
		if (autoPruneInterval) return; // Already running

		autoPruneInterval = setInterval(() => {
			service.prune();
		}, 30_000);
	};

	const stopAutoPrune = () => {
		if (autoPruneInterval) {
			clearInterval(autoPruneInterval);
			autoPruneInterval = null;
		}
	};

	// Start auto-prune by default
	startAutoPrune();

	// Debug exposure
	if (import.meta.env.DEV) {
		// @ts-expect-error debug
		window.readStatusService = service;
	}

	return {
		service,
		startAutoPrune,
		stopAutoPrune,
	};
}
