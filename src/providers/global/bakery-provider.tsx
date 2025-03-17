import {
	createContext,
	type PropsWithChildren,
	useContext,
	useEffect,
	useMemo,
} from "react";
import {
	BehaviorSubject,
	type Observable,
	combineLatest,
	filter,
	lastValueFrom,
	map,
	of,
	shareReplay,
	switchMap,
} from "rxjs";
import { nip42 } from "nostr-tools";
import { Relay } from "applesauce-relay";
import { useAccountManagerProvider } from "./accounts-provider";
import { logger } from "~/helpers/debug";
import BakeryControlApi from "~/classes/bakery/bakery-control";
import localSettings from "~/services/local-settings";

type BakeryContextType = {
	bakery$: BehaviorSubject<Relay | null>;
	controlApi$: Observable<BakeryControlApi | null>;
	setBakeryURL: (url: string) => void;
	clearBakeryURL: () => void;
};

const BakeryContext = createContext<BakeryContextType>({
	bakery$: new BehaviorSubject<Relay | null>(null),
	controlApi$: of(null),
	setBakeryURL: () => {},
	clearBakeryURL: () => {},
});

export function useBakeryProvider() {
	return useContext(BakeryContext);
}

const log = logger.extend("bakery");

export default function BakeryProvider({ children }: PropsWithChildren) {
	const { accountManager } = useAccountManagerProvider();

	const bakery$ = useMemo(() => new BehaviorSubject<Relay | null>(null), []);

	const setBakeryURL = (url: string) => {
		localSettings.bakeryURL.next(url);
	};

	const clearBakeryURL = () => {
		localSettings.bakeryURL.clear();
	};

	const controlApi$ = useMemo(() => {
		return bakery$.pipe(
			filter((b) => !!b),
			map((bakery) => new BakeryControlApi(bakery!)),
			shareReplay(1),
		);
	}, [bakery$]);

	useEffect(() => {
		if (!accountManager) return;

		const urlSubscription = localSettings.bakeryURL.subscribe((url) => {
			if (!URL.canParse(url)) return bakery$.next(null);

			try {
				bakery$.next(new Relay(localSettings.bakeryURL.value));
			} catch (err) {
				log("Failed to create bakery connection, clearing storage");
				localSettings.bakeryURL.clear();
			}
		});

		const authSubscription = bakery$
			.pipe(
				filter((b) => b !== null),
				switchMap((b) =>
					combineLatest([
						of(b!),
						b!.challenge$,
						accountManager.active$ ?? of(null),
					]),
				),
			)
			.subscribe(async ([bakery, challenge, account]) => {
				if (!account) return;

				try {
					const draft = nip42.makeAuthEvent(bakery.url, challenge);
					const result = await lastValueFrom(
						bakery.auth(await account.signEvent(draft)),
					);
					console.log("Authenticated to relay", result);
				} catch (err) {
					console.log("Failed to authenticate with bakery", err);
				}
			});

		const configSubscription = controlApi$
			.pipe(switchMap((api) => api.config))
			.subscribe((config) => {
				console.log("config", config);
			});

		return () => {
			urlSubscription.unsubscribe();
			authSubscription.unsubscribe();
			configSubscription.unsubscribe();
		};
	}, [bakery$, controlApi$, accountManager]);

	return (
		<BakeryContext.Provider
			value={{
				bakery$,
				controlApi$,
				setBakeryURL,
				clearBakeryURL,
			}}
		>
			{children}
		</BakeryContext.Provider>
	);
}
