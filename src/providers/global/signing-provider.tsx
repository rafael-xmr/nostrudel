import React, { useCallback, useContext, useMemo } from "react";
import type {
	EventTemplate,
	NostrEvent,
	UnsignedEvent,
	VerifiedEvent,
} from "nostr-tools";
import { useActiveAccount } from "applesauce-react/hooks";
import { useToast } from "@chakra-ui/react";

import type { IAccount } from "applesauce-accounts";
import { PasswordAccount } from "applesauce-accounts/accounts";
import { verifyEvent } from "~/services/event-store.client";

export class SigningService {
	async unlockAccount(account: IAccount) {
		if (account instanceof PasswordAccount && !account.signer.unlocked) {
			const password = window.prompt("Account unlock password");
			if (!password) throw new Error("Password required");
			await account.signer.unlock(password);
		}
	}

	async finalizeDraft(
		draft: EventTemplate,
		account: IAccount,
	): Promise<UnsignedEvent> {
		return {
			...draft,
			pubkey: account.pubkey,
		};
	}

	async requestSignature(
		draft: UnsignedEvent | EventTemplate,
		account: IAccount,
	): Promise<VerifiedEvent> {
		await this.unlockAccount(account);

		if (!Reflect.has(draft, "pubkey"))
			draft = await this.finalizeDraft(draft, account);

		if (!account.signer) throw new Error("Account missing signer");
		const signed = await account.signer.signEvent(draft);
		if (signed.pubkey !== account.pubkey)
			throw new Error("Signed with the wrong pubkey");

		if (!verifyEvent(signed)) throw new Error("Invalid signature");

		return signed;
	}

	async nip04Encrypt(plaintext: string, pubkey: string, account: IAccount) {
		await this.unlockAccount(account);

		if (!account.signer) throw new Error("Account missing signer");
		if (!account.signer.nip04)
			throw new Error("Signer does not support NIP-04");
		return account.signer.nip04.encrypt(pubkey, plaintext);
	}

	async nip04Decrypt(ciphertext: string, pubkey: string, account: IAccount) {
		await this.unlockAccount(account);

		if (!account.signer) throw new Error("Account missing signer");
		if (!account.signer.nip04)
			throw new Error("Signer does not support NIP-04");
		return account.signer.nip04.decrypt(pubkey, ciphertext);
	}

	async nip44Encrypt(plaintext: string, pubkey: string, account: IAccount) {
		await this.unlockAccount(account);

		if (!account.signer) throw new Error("Account missing signer");
		if (!account.signer.nip44)
			throw new Error("Signer does not support NIP-44");
		return account.signer.nip44.encrypt(pubkey, plaintext);
	}

	async nip44Decrypt(ciphertext: string, pubkey: string, account: IAccount) {
		await this.unlockAccount(account);

		if (!account.signer) throw new Error("Account missing signer");
		if (!account.signer.nip44)
			throw new Error("Signer does not support NIP-44");
		return account.signer.nip44.decrypt(pubkey, ciphertext);
	}
}

export type SigningContextType = {
	signingService: SigningService;
	finalizeDraft(draft: EventTemplate): Promise<UnsignedEvent>;
	requestSignature(
		draft: UnsignedEvent | EventTemplate,
	): Promise<VerifiedEvent>;
	requestDecrypt(data: string, pubkey: string): Promise<string>;
	requestEncrypt(data: string, pubkey: string): Promise<string>;
};

export const SigningContext = React.createContext<SigningContextType | null>(
	null,
);

export function useSigningContext() {
	return useContext(SigningContext);
}

export function SigningProvider({ children }: { children: React.ReactNode }) {
	const toast = useToast();
	const account = useActiveAccount();

	const signingService = new SigningService();

	const finalizeDraft = useCallback(
		async (draft: EventTemplate) => {
			if (!account) throw new Error("No account");
			return await signingService.finalizeDraft(draft, account);
		},
		[toast, account],
	);
	const requestSignature = useCallback(
		async (draft: UnsignedEvent) => {
			if (!account) throw new Error("No account");
			return await signingService.requestSignature(
				draft,
				account,
				verifyEventMethod,
			);
		},
		[toast, account],
	);
	const requestDecrypt = useCallback(
		async (data: string, pubkey: string) => {
			if (!account) throw new Error("No account");
			return await signingService.nip04Decrypt(data, pubkey, account);
		},
		[toast, account],
	);
	const requestEncrypt = useCallback(
		async (data: string, pubkey: string) => {
			if (!account) throw new Error("No account");
			return await signingService.nip04Encrypt(data, pubkey, account);
		},
		[toast, account],
	);

	const context = useMemo(
		() => ({
			signingService,
			requestSignature,
			requestDecrypt,
			requestEncrypt,
			finalizeDraft,
		}),
		[
			signingService,
			requestSignature,
			requestDecrypt,
			requestEncrypt,
			finalizeDraft,
		],
	);

	return (
		<SigningContext.Provider value={context}>
			{children}
		</SigningContext.Provider>
	);
}
