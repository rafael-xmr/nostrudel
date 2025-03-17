import {
	createContext,
	type PropsWithChildren,
	useContext,
	useEffect,
	useMemo,
} from "react";
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
import { useAccountManagerProvider } from "./accounts-provider";
import { PAYWALL_NIP05 } from "~/env";
import { logger } from "~/helpers/debug";
import { localStorageWrapper } from "~/utils/localStorage";

type PaywallContextType = {
	paywall: Observable<boolean>;
	hidePaywall: BehaviorSubject<number | null>;
};

const PaywallContext = createContext<PaywallContextType>({
	paywall: of(true),
	hidePaywall: new BehaviorSubject<number | null>(null),
});

export function usePaywall() {
	return useContext(PaywallContext);
}

const log = logger.extend("paywall");

export default function PaywallProvider({ children }: PropsWithChildren) {
	const { accountManager } = useAccountManagerProvider();

	const hidePaywall = useMemo(
		() =>
			new BehaviorSubject(
				localStorageWrapper.getItem("paywall-dismiss")
					? Number.parseInt(localStorageWrapper.getItem("paywall-dismiss")!)
					: null,
			),
		[],
	);

	const paywall = useMemo(() => {
		if (!PAYWALL_NIP05) return of(true);

		const accountPaid =
			accountManager?.active$.pipe(
				filter((a) => !!a),
				switchMap((account) => {
					log("Fetching NIP-05 document");
					const document = from(
						fetch(PAYWALL_NIP05!).then(
							(res) => res.json() as Promise<DomainIdentityJson>,
						),
					);
					return combineLatest([of(account), document]);
				}),
				map(([account, document]) => {
					log("Found document", document);
					return document.names
						? Object.values(document.names).includes(account.pubkey)
						: false;
				}),
				startWith(true),
				tap((paid) => log(`Account paid ${paid}`)),
			) ?? of(false);

		const dismiss = hidePaywall.pipe(
			map((hideUntil) => (hideUntil ? hideUntil > unixNow() : false)),
			tap((dismissed) => log(`Paywall dismissed ${dismissed}`)),
		);

		return combineLatest([dismiss, accountPaid]).pipe(
			// @ts-ignore
			map(([dismiss, account]) => dismiss || account),
			shareReplay(1),
		);
	}, [accountManager]);

	useEffect(() => {
		const subscription = hidePaywall.subscribe((ts) => {
			if (ts) localStorageWrapper.setItem("paywall-dismiss", String(ts));
		});

		return () => {
			subscription.unsubscribe();
		};
	}, [hidePaywall]);

	return (
		<PaywallContext.Provider
			value={{
				paywall,
				hidePaywall,
			}}
		>
			{children}
		</PaywallContext.Provider>
	);
}
