import {
	createContext,
	type PropsWithChildren,
	useContext,
	useMemo,
} from "react";
import _throttle from "lodash.throttle";
import { BehaviorSubject } from "rxjs";
import { createDefer, type Deferred } from "applesauce-core/promise";
import { useAccountManagerProvider } from "./accounts-provider";
import signingService from "~/services/signing";
import { logger } from "~/helpers/debug";

type EncryptionType = "nip04" | "nip44";

const DecryptionCacheServiceContext = createContext<
	DecryptionCache | undefined
>(undefined);

export function useDecryptionCacheService() {
	return useContext(DecryptionCacheServiceContext);
}

class DecryptionContainer {
	id: string;
	type: EncryptionType = "nip04";
	pubkey: string;
	cipherText: string;

	plaintext = new BehaviorSubject<string | undefined>(undefined);
	error = new BehaviorSubject<Error | undefined>(undefined);

	constructor(
		id: string,
		type: EncryptionType,
		pubkey: string,
		cipherText: string,
	) {
		this.id = id;
		this.pubkey = pubkey;
		this.cipherText = cipherText;
		this.type = type;
	}
}

class DecryptionCache {
	containers = new Map<string, DecryptionContainer>();
	log = logger.extend("DecryptionCache");

	constructor(private accounts: any) {}

	getContainer(id: string) {
		return this.containers.get(id);
	}
	getOrCreateContainer(
		id: string,
		type: EncryptionType,
		pubkey: string,
		cipherText: string,
	) {
		let container = this.containers.get(id);
		if (!container) {
			container = new DecryptionContainer(id, type, pubkey, cipherText);
			this.containers.set(id, container);
		}
		return container;
	}

	private async decryptContainer(container: DecryptionContainer) {
		const account = this.accounts.active;
		if (!account) throw new Error("Missing account");

		switch (container.type) {
			case "nip04":
				return await signingService.nip04Decrypt(
					container.cipherText,
					container.pubkey,
					account,
				);
			case "nip44":
				return await signingService.nip44Decrypt(
					container.cipherText,
					container.pubkey,
					account,
				);
		}
	}

	promises = new Map<DecryptionContainer, Deferred<string>>();

	private decryptQueue: DecryptionContainer[] = [];
	private decryptQueueRunning = false;
	private async decryptNext() {
		const container = this.decryptQueue.pop();
		if (!container) {
			this.decryptQueueRunning = false;
			this.decryptQueue = [];
			return;
		}

		const promise = this.promises.get(container)!;

		try {
			if (!container.plaintext.value) {
				const plaintext = await this.decryptContainer(container);

				container.plaintext.next(plaintext);
				promise.resolve(plaintext);

				this.promises.delete(container);
			}

			setTimeout(() => this.decryptNext(), 100);
		} catch (e) {
			if (e instanceof Error) {
				container.error.next(e);
				promise.reject(e);

				this.decryptQueueRunning = false;
				this.decryptQueue = [];
			}
		}
	}

	startDecryptionQueue() {
		if (!this.decryptQueueRunning) {
			this.decryptQueueRunning = true;
			this.decryptNext();
		}
	}

	requestDecrypt(container: DecryptionContainer) {
		if (container.plaintext.value)
			return Promise.resolve(container.plaintext.value);

		let p = this.promises.get(container);
		if (!p) {
			p = createDefer<string>();
			this.promises.set(container, p);

			this.decryptQueue.unshift(container);
			this.startDecryptionQueue();
		}
		return p;
	}
}

export default function DecryptionCacheServiceProvider({
	children,
}: PropsWithChildren) {
	const { accountManager } = useAccountManagerProvider();

	const decryptionCacheService = useMemo(() => {
		if (!accountManager) return undefined;

		const service = new DecryptionCache(accountManager);

		return service;
	}, [accountManager]);

	return (
		<DecryptionCacheServiceContext.Provider value={decryptionCacheService}>
			{children}
		</DecryptionCacheServiceContext.Provider>
	);
}
