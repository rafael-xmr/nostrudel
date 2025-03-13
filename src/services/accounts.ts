import { AccountManager } from "applesauce-accounts";
import {
	AmberClipboardAccount,
	NostrConnectAccount,
	registerCommonAccountTypes,
} from "applesauce-accounts/accounts";
import { skip } from "rxjs";

import db from "./db";
import { CAP_IS_NATIVE } from "../env";
import { logger } from "../helpers/debug";
import AndroidSignerAccount from "../classes/accounts/android-signer-account";
import { createNostrConnectConnection } from "../classes/nostr-connect-connection";
import { localStorageWrapper } from "~/utils/localStorage";

// Setup nostr connect signer
NostrConnectAccount.createConnectionMethods = createNostrConnectConnection;

const log = logger.extend("Accounts");

const accounts = new AccountManager();
registerCommonAccountTypes(accounts);
accounts.registerType(AmberClipboardAccount);

// add android signer if native
if (CAP_IS_NATIVE) accounts.registerType(AndroidSignerAccount);

// load all accounts
log("Loading accounts...");
if (db) {
	accounts.fromJSON(await db.getAll("accounts"), true);
}

// save accounts to database when they change
accounts.accounts$.pipe(skip(1)).subscribe(async () => {
	const json = accounts.toJSON();
	for (const account of json) await db?.put("accounts", account);

	// remove old accounts
	const existing = await db?.getAll("accounts");
	if (!existing) return;

	for (const { id } of existing) {
		if (!accounts.getAccount(id)) await db?.delete("accounts", id);
	}
});

// load last active account
const lastPubkey = localStorageWrapper.getItem("active-account");
const lastAccount = lastPubkey && accounts.getAccountForPubkey(lastPubkey);
if (lastAccount) accounts.setActive(lastAccount);

// save last active to localstorage
accounts.active$.pipe(skip(1)).subscribe((account) => {
	if (account) localStorageWrapper.setItem("active-account", account.pubkey);
	else localStorageWrapper.removeItem("active-account");
});

if (process.env.NEXT_PUBLIC_DEV) {
	// @ts-expect-error debug
	window.accounts = accounts;
}

export default accounts;
