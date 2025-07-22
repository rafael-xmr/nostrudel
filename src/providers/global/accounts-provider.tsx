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
	registerCommonAccountTypes,
} from "applesauce-accounts/accounts";
import { skip, type Subscription } from "rxjs";
import AndroidSignerAccount from "~/classes/accounts/android-signer-account";
import { localStorageWrapper } from "~/utils/localStorage";
import db from "~/services/db/index.client";
import { CAP_IS_NATIVE } from "~/env";
import { logger } from "~/helpers/debug";
import type { AppSettings } from "~/helpers/app-settings";
import AppSettingsQuery from "~/queries/app-settings";
import { useQueryStore } from "applesauce-react/hooks";

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

let cachedAccountManager: AccountManager | undefined;
let sub: Subscription | undefined = undefined;

export default function AccountManagerProvider({
	children,
}: PropsWithChildren) {
	const queryStore = useQueryStore();

	const [settings, setSettings] = useState<AppSettings | undefined>(undefined);

	const accountManager = useMemo(() => {
		if (cachedAccountManager) return cachedAccountManager;
		if (!db) return undefined;

		const manager = new AccountManager();

		registerCommonAccountTypes(manager);
		manager.registerType(AmberClipboardAccount);
		if (CAP_IS_NATIVE) manager.registerType(AndroidSignerAccount);

		cachedAccountManager = manager;
		return manager;
	}, []);

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
							.subscribe((e) =>
								setSettings((prev) => {
									if (e && (!prev || prev !== e)) return e;
								}),
							);
				} else {
					localStorageWrapper.removeItem("active-account");
				}
			});

		return () => {
			subscription.unsubscribe();
			activeSubscription.unsubscribe();
		};
	}, [accountManager]);

	return (
		<AccountManagerContext.Provider value={{ accountManager, settings }}>
			{children}
		</AccountManagerContext.Provider>
	);
}
