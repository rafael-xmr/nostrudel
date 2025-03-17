import {
	createContext,
	type PropsWithChildren,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import { AccountManager } from "applesauce-accounts";
import {
	AmberClipboardAccount,
	NostrConnectAccount,
	registerCommonAccountTypes,
} from "applesauce-accounts/accounts";
import { skip, type Subscription } from "rxjs";
import AndroidSignerAccount from "~/classes/accounts/android-signer-account";
import { createNostrConnectConnection } from "~/classes/nostr-connect-connection";
import { localStorageWrapper } from "~/utils/localStorage";
import { useDB } from "./db-provider";
import { CAP_IS_NATIVE } from "~/env";
import { logger } from "~/helpers/debug";
import { useRxNostr } from "./rx-nostr-provider";
import type { AppSettings } from "~/helpers/app-settings";
import { queryStore } from "~/services/event-store";
import AppSettingsQuery from "~/queries/app-settings";

type AccountsContextType = {
	accountManager: AccountManager | undefined;
	settings: AppSettings | undefined;
};

const AccountManagerContext = createContext<AccountsContextType>(
	{} as AccountsContextType,
);

export function useAccountManagerProvider() {
	return useContext(AccountManagerContext);
}

const log = logger.extend("Accounts");

export default function AccountManagerProvider({
	children,
}: PropsWithChildren) {
	const { db } = useDB();
	const rxNostr = useRxNostr();

	const [settings, setSettings] = useState<AppSettings | undefined>(undefined);
	let sub: Subscription | undefined = undefined;

	const accountManager = useMemo(() => {
		if (!db) return undefined;

		const manager = new AccountManager();

		registerCommonAccountTypes(manager);
		manager.registerType(AmberClipboardAccount);
		if (CAP_IS_NATIVE) manager.registerType(AndroidSignerAccount);

		NostrConnectAccount.createConnectionMethods = () =>
			createNostrConnectConnection(rxNostr!);

		return manager;
	}, [rxNostr, db]);

	useEffect(() => {
		if (!db || !accountManager) return;

		const loadAccounts = async () => {
			log("Loading accounts...");
			const existing = await db.getAll("accounts");
			accountManager.fromJSON(existing, true);

			const lastPubkey = localStorageWrapper.getItem("active-account");
			const lastAccount =
				lastPubkey && accountManager.getAccountForPubkey(lastPubkey);
			if (lastAccount) accountManager.setActive(lastAccount);
		};

		loadAccounts();

		const subscription = accountManager.accounts$
			.pipe(skip(1))
			.subscribe(async () => {
				const json = accountManager.toJSON();
				for (const account of json) await db.put("accounts", account);

				const existing = await db.getAll("accounts");
				if (!existing) return;

				for (const { id } of existing) {
					if (!accountManager.getAccount(id)) await db.delete("accounts", id);
				}
			});

		const activeSubscription = accountManager.active$
			.pipe(skip(1))
			.subscribe((account) => {
				if (account) {
					localStorageWrapper.setItem("active-account", account.pubkey);

					if (sub) sub.unsubscribe();
					else
						sub = queryStore
							.createQuery(AppSettingsQuery, account.pubkey)
							.subscribe(setSettings);
				} else {
					localStorageWrapper.removeItem("active-account");
				}
			});

		return () => {
			subscription.unsubscribe();
			activeSubscription.unsubscribe();
		};
	}, [db, sub, accountManager]);

  console.log("AccountManagerContext", accountManager);

	return (
		<AccountManagerContext.Provider
			value={{
				accountManager,
				settings,
			}}
		>
			{children}
		</AccountManagerContext.Provider>
	);
}
