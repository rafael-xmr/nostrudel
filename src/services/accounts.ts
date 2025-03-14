import { AccountManager } from "applesauce-accounts";
import {
	AmberClipboardAccount,
	NostrConnectAccount,
	registerCommonAccountTypes,
} from "applesauce-accounts/accounts";
import { skip } from "rxjs";

import getDB from "./db";
import { CAP_IS_NATIVE } from "../env";
import { logger } from "../helpers/debug";
import AndroidSignerAccount from "../classes/accounts/android-signer-account";
import { createNostrConnectConnection } from "../classes/nostr-connect-connection";
import { localStorageWrapper } from "~/utils/localStorage";

// Setup nostr connect signer
NostrConnectAccount.createConnectionMethods = createNostrConnectConnection;
let topLevelAccounts: AccountManager | null = null;

export default async function getAccounts() {
	if (topLevelAccounts) return topLevelAccounts;

	const accounts = new AccountManager();
	const log = logger.extend("Accounts");

	registerCommonAccountTypes(accounts);
	accounts.registerType(AmberClipboardAccount);

	// add android signer if native
	if (CAP_IS_NATIVE) accounts.registerType(AndroidSignerAccount);

	// load all accounts
	log("Loading accounts...");
	const db = await getDB();
	if (!db) return topLevelAccounts;

	const existing = await db.getAll("accounts");
	accounts.fromJSON(existing, true);

	// save accounts to database when they change
	accounts.accounts$.pipe(skip(1)).subscribe(async () => {
		const json = accounts.toJSON();
		for (const account of json) db.put("accounts", account);

		// remove old accounts
		const existing = await db.getAll("accounts");
		if (!existing) return;

		for (const { id } of existing) {
			if (!accounts.getAccount(id)) await db.delete("accounts", id);
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

	if (typeof window !== "undefined") {
		// @ts-expect-error debug
		window.accounts = accounts;
	}

	topLevelAccounts = accounts;

	return accounts;
}
