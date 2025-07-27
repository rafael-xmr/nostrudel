import type { AccountManager } from "applesauce-accounts";
import {
	BehaviorSubject,
	combineLatest,
	filter,
	from,
	map,
	type Observable,
	of,
	shareReplay,
	startWith,
	switchMap,
	tap,
} from "rxjs";
import type { DomainIdentityJson } from "applesauce-loaders/helpers/dns-identity";
import { unixNow } from "applesauce-core/helpers";

import { PAYWALL_NIP05 } from "~/env";
import { logger } from "~/helpers/debug";
import { localStorageWrapper } from "~/utils/localStorage";

export interface PaywallManagement {
	paywall$: Observable<boolean>;
	hidePaywall: BehaviorSubject<number | null>;
	dismissPaywall: (duration?: number) => void;
}

export default function createPaywallManagement(
	accountManager: AccountManager,
): PaywallManagement {
	const log = logger.extend("paywall");

	const hidePaywall = new BehaviorSubject(
		localStorageWrapper.getItem("paywall-dismiss")
			? parseInt(localStorageWrapper.getItem("paywall-dismiss")!)
			: null,
	);

	hidePaywall.subscribe((ts) => {
		if (ts) localStorageWrapper.setItem("paywall-dismiss", String(ts));
	});

	let paywall$: Observable<boolean>;
	if (PAYWALL_NIP05) {
		const accountPaid = accountManager.active$.pipe(
			// ignore empty accounts
			filter((a) => !!a),
			// fetch the identity document
			switchMap((account) => {
				log(`Fetching NIP-05 document`);
				const document = from(
					fetch(PAYWALL_NIP05!).then(
						(res) => res.json() as Promise<DomainIdentityJson>,
					),
				);
				return combineLatest([of(account), document]);
			}),
			// check if account is in document
			map(([account, document]) => {
				log(`Found document`, document);
				return document.names
					? Object.values(document.names).includes(account.pubkey)
					: false;
			}),
			// start with true until document is checked
			startWith(true),
			tap((paid) => log(`Account paid ${paid}`)),
		);

		const dismiss = hidePaywall.pipe(
			map((hideUntil) => (hideUntil ? hideUntil > unixNow() : false)),
			tap((dismissed) => log(`Paywall dismissed ${dismissed}`)),
		);

		paywall$ = combineLatest([dismiss, accountPaid]).pipe(
			map(([dismiss, account]) => dismiss || account),
			// share results for UI
			shareReplay(1),
		);
	} else {
		paywall$ = of(true);
	}

	const dismissPaywall = (duration: number = 24 * 60 * 60) => {
		const dismissUntil = unixNow() + duration;
		hidePaywall.next(dismissUntil);
	};

	return {
		paywall$,
		hidePaywall,
		dismissPaywall,
	};
}
