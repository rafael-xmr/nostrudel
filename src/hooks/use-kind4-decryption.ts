import { useCallback, useMemo } from "react";
import type { NostrEvent } from "nostr-tools";
import { useActiveAccount, useObservable } from "applesauce-react/hooks";

import { getDMRecipient, getDMSender } from "../helpers/nostr/dms";
import { useDecryptionCacheService } from "~/providers/global/decryption-cache-provider";

export function useKind4Decrypt(event: NostrEvent, pubkey?: string) {
	const account = useActiveAccount()!;
	const decryptionCacheService = useDecryptionCacheService();

	pubkey =
		pubkey || event.pubkey === account.pubkey
			? getDMRecipient(event)
			: getDMSender(event);

	const container = useMemo(
		() =>
			decryptionCacheService?.getOrCreateContainer(
				event.id,
				"nip04",
				pubkey,
				event.content,
			),
		[decryptionCacheService, event, pubkey],
	);

	const plaintext = useObservable(container?.plaintext);
	const error = useObservable(container?.error);

	const requestDecrypt = useCallback(() => {
		const p = decryptionCacheService!.requestDecrypt(container!);
		decryptionCacheService!.startDecryptionQueue();
		return p;
	}, [decryptionCacheService, container]);

	return { container, error, plaintext, requestDecrypt };
}
