import { AccountManager } from "applesauce-accounts";
import {
	AmberClipboardAccount,
	registerCommonAccountTypes,
} from "applesauce-accounts/accounts";
import { NostrConnectSigner } from "applesauce-signers";
import { skip } from "rxjs";

import db from "./db/index.client";
import { CAP_IS_NATIVE } from "../env";
import { logger } from "../helpers/debug";
import AndroidSignerAccount from "../classes/accounts/android-signer-account";
import {
	nostrConnectPublish,
	nostrConnectSubscription,
} from "../helpers/applesauce";

// Setup nostr connect signer
NostrConnectSigner.subscriptionMethod = nostrConnectSubscription;
NostrConnectSigner.publishMethod = nostrConnectPublish;

const log = logger.extend("Accounts");

const accounts = new AccountManager();
registerCommonAccountTypes(accounts);
accounts.registerType(AmberClipboardAccount);

// Setup password unlock prompt
PasswordAccount.requestUnlockPassword = async (
	account: PasswordAccount<any>,
) => {
	const password = window.prompt("Account unlock password");
	if (!password) throw new Error("Password required");
	return password;
};

// add android signer if native
if (CAP_IS_NATIVE) accounts.registerType(AndroidSignerAccount);

// TEMP: Migrate accounts from local storage to preferences
const legacyAccounts = (await db.getAll("accounts")) as SerializedAccount<
	any,
	any
>[];
if (legacyAccounts.length) {
	log("Migrating accounts...");
	await localSettings.accounts.next(legacyAccounts);
	await db.clear("accounts");
	log("Migrated", legacyAccounts.length, "accounts to preferences");
}

// load all accounts
log("Loading accounts...");
accounts.fromJSON(localSettings.accounts.value, true);

// save accounts to database when they change
accounts.accounts$.pipe(skip(1)).subscribe(async () => {
	const json = accounts.toJSON();
	for (const account of json) await db.put("accounts", account);

	// remove old accounts
	const existing = await db.getAll("accounts");
	for (const { id } of existing) {
		if (!accounts.getAccount(id)) await db.delete("accounts", id);
	}
});

// load last active account
const lastPubkey = localSettings.activeAccount.value;
const lastAccount = lastPubkey && accounts.getAccountForPubkey(lastPubkey);
if (lastAccount) accounts.setActive(lastAccount);

// save last active
accounts.active$.pipe(skip(1)).subscribe((account) => {
	if (account) localStorage.setItem("active-account", account.pubkey);
	else localStorage.removeItem("active-account");
});

export default accounts;
