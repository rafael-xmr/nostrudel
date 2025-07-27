import { useEventModel } from "applesauce-react/hooks";
import type { ProfilePointer } from "nostr-tools/nip19";
import { MailboxesQuery } from "../models/mailboxes";
import { useLocalSettings } from "~/providers/global/preferences";

export default function useUserMailboxes(user?: string | ProfilePointer) {
	const { eventStoreManagement, loadersManagement } = useLocalSettings();
	return useEventModel(
		MailboxesQuery,
		user ? [user, eventStoreManagement, loadersManagement] : undefined,
	);
}

export function useUserInbox(pubkey?: string) {
	return useUserMailboxes(pubkey)?.inboxes;
}
export function useUserOutbox(pubkey?: string) {
	return useUserMailboxes(pubkey)?.outboxes;
}
