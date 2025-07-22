import {
	createContext,
	type PropsWithChildren,
	useContext,
	useEffect,
} from "react";
import { kinds } from "nostr-tools";
import type { IAccount } from "applesauce-accounts";
import { combineLatest, distinct } from "rxjs";
import { USER_BLOSSOM_SERVER_LIST_KIND } from "blossom-client-sdk";
import { createRxOneshotReq } from "rx-nostr";
import { useAccountManagerProvider } from "./accounts-provider";
import replaceableEventLoader from "~/services/replaceable-loader.client";
import { useRxNostr } from "./rx-nostr-provider";
import { COMMON_CONTACT_RELAYS } from "~/const";
import { logger } from "~/helpers/debug";
import {
	APP_SETTING_IDENTIFIER,
	APP_SETTINGS_KIND,
} from "~/helpers/app-settings";
import { useQueryStore } from "applesauce-react/hooks";
import localSettings from "~/services/preferences";

type UserEventSyncContextType = {
	downloadEvents: (account: IAccount, relays: string[]) => void;
};

const UserEventSyncContext = createContext<UserEventSyncContextType>({
	downloadEvents: () => {},
});

export function useUserEventSync() {
	return useContext(UserEventSyncContext);
}

export default function UserEventSyncProvider({ children }: PropsWithChildren) {
	const { accountManager } = useAccountManagerProvider();
	const rxNostr = useRxNostr();

	const queryStore = useQueryStore();

	const log = logger.extend("UserEventSync");

	const downloadEvents = (account: IAccount, relays: string[]) => {
		const cleanup: (() => void)[] = [];

		const requestReplaceable = (
			relays: Iterable<string>,
			kind: number,
			d?: string,
		) => {
			replaceableEventLoader.next({
				relays: [...relays],
				kind,
				pubkey: account.pubkey,
				identifier: d,
				force: true,
			});
		};

		log("Loading outboxes");
		requestReplaceable([...relays, ...COMMON_CONTACT_RELAYS], kinds.RelayList);

		const mailboxesSub = queryStore
			.mailboxes(account.pubkey)
			.subscribe((mailboxes) => {
				log("Loading user information");
				requestReplaceable(mailboxes?.outboxes || relays, kinds.Metadata);
				requestReplaceable(
					mailboxes?.outboxes || relays,
					USER_BLOSSOM_SERVER_LIST_KIND,
				);
				requestReplaceable(
					mailboxes?.outboxes || relays,
					kinds.SearchRelaysList,
				);
				requestReplaceable(
					mailboxes?.outboxes || relays,
					APP_SETTINGS_KIND,
					APP_SETTING_IDENTIFIER,
				);

				log("Loading contacts list");
				replaceableEventLoader.next({
					relays: [...localSettings.readRelays.value, ...COMMON_CONTACT_RELAYS],
					kind: kinds.Contacts,
					pubkey: account.pubkey,
					force: true,
				});

				if (mailboxes?.outboxes && mailboxes.outboxes.length > 0) {
					log("Loading delete events");
					const req = createRxOneshotReq({
						filters: [
							{ kinds: [kinds.EventDeletion], authors: [account.pubkey] },
						],
						rxReqId: "delete-events",
					});
					const sub = rxNostr
						?.use(req, { on: { relays: mailboxes.outboxes } })
						.subscribe((packet) => {
							queryStore?.store?.add(packet.event, packet.from);
						});

					cleanup.push(() => sub?.unsubscribe());
				}
			});

		return () => {
			for (const fn of cleanup) fn();
			mailboxesSub.unsubscribe();
		};
	};

	useEffect(() => {
		if (!accountManager || !rxNostr) return;

		const subscription = combineLatest([
			accountManager.active$.pipe(distinct((a) => a?.pubkey)),
			localSettings.readRelays,
		]).subscribe(([account, relays]) => {
			if (account && relays.length > 0) {
				const cleanup = downloadEvents(account, relays);
				return cleanup;
			}
		});

		return () => {
			subscription.unsubscribe();
		};
	}, [accountManager, rxNostr]);

	return (
		<UserEventSyncContext.Provider
			value={{
				downloadEvents,
			}}
		>
			{children}
		</UserEventSyncContext.Provider>
	);
}
