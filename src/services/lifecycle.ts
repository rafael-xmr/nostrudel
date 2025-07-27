import type { IAccount } from "applesauce-accounts";
import { isFromCache } from "applesauce-core/helpers";
import { defined, mapEventsToStore } from "applesauce-core/observable";
import { onlyEvents } from "applesauce-relay";
import { USER_BLOSSOM_SERVER_LIST_KIND } from "blossom-client-sdk";
import { kinds, nip42 } from "nostr-tools";
import {
	combineLatest,
	distinct,
	distinctUntilChanged,
	filter,
	ignoreElements,
	map,
	merge,
	NEVER,
	of,
	share,
	switchMap,
	tap,
	timer,
} from "rxjs";

import {
	APP_SETTING_IDENTIFIER,
	APP_SETTINGS_KIND,
} from "../helpers/app-settings";
import { MailboxesQuery } from "../models";
import { DirectMessageRelays } from "../models/messages";
import type { AccountsManagement } from "./accounts";
import type { AuthenticationSignerManagement } from "./authentication-signer";
import type { EventCacheManagement } from "./event-cache";
import type { EventStoreManagement } from "./event-store";
import type { LoadersManagement } from "./loaders";
import type { RelayPoolManagement } from "./pool";
import type { PreferenceSubject } from "~/classes/preference-subject";

export interface UserDataManagement {
	legacyMessageSubscription: ReturnType<typeof createLegacyMessageSubscription>;
	wrappedMessageSubscription: ReturnType<
		typeof createWrappedMessageSubscription
	>;
}

function createLegacyMessageSubscription(
	accountsManagement: AccountsManagement,
	relayPoolManagement: RelayPoolManagement,
	eventStoreManagement: EventStoreManagement,
	loadersManagement: LoadersManagement,
) {
	return accountsManagement.accounts.active$.pipe(
		switchMap((account) => {
			if (!account) return NEVER;
			const inboxes = eventStoreManagement.eventStore
				.model(
					MailboxesQuery,
					account.pubkey,
					eventStoreManagement,
					loadersManagement,
				)
				.pipe(
					defined(),
					map((m) => m?.inboxes),
				);
			return combineLatest([of(account), inboxes]);
		}),
		// Open a subscription to all relays for incoming messages
		switchMap(([account, inboxes]) =>
			relayPoolManagement.pool
				.subscription(inboxes, {
					kinds: [kinds.EncryptedDirectMessage],
					"#p": [account.pubkey],
				})
				.pipe(onlyEvents(), mapEventsToStore(eventStoreManagement.eventStore)),
		),
		// Ignore all updates since subscribes will get the events from the store
		ignoreElements(),
		// Ensure only one subscription is created and keep it alive for 30 seconds after last subscriber
		share({ resetOnRefCountZero: () => timer(30_000) }),
	);
}

function createWrappedMessageSubscription(
	accountsManagement: AccountsManagement,
	relayPoolManagement: RelayPoolManagement,
	eventStoreManagement: EventStoreManagement,
) {
	return accountsManagement.accounts.active$.pipe(
		switchMap((account) => {
			if (!account) return NEVER;
			const inboxes = eventStoreManagement.eventStore
				.model(DirectMessageRelays, account.pubkey)
				.pipe(defined());
			return combineLatest([of(account), inboxes]);
		}),
		// Open a subscription to all relays for incoming messages
		switchMap(([account, inboxes]) =>
			relayPoolManagement.pool
				.subscription(inboxes, {
					kinds: [kinds.GiftWrap],
					"#p": [account.pubkey],
				})
				.pipe(onlyEvents(), mapEventsToStore(eventStoreManagement.eventStore)),
		),
		// Ignore all updates since subscribes will get the events from the store
		ignoreElements(),
		// Ensure only one subscription is created and keep it alive for 30 seconds after last subscriber
		share({ resetOnRefCountZero: () => timer(30_000) }),
	);
}

export default function createUserDataManagement(
	accountsManagement: AccountsManagement,
	authenticationSignerManagement: AuthenticationSignerManagement,
	eventCacheManagement: EventCacheManagement,
	eventStoreManagement: EventStoreManagement,
	loadersManagement: LoadersManagement,
	relayPoolManagement: RelayPoolManagement,
	readRelays: PreferenceSubject<string[]>,
): UserDataManagement {
	const { accounts } = accountsManagement;
	const authenticationSigner = authenticationSignerManagement;
	const { writeEvent } = eventCacheManagement;
	const { eventStore } = eventStoreManagement;
	const { addressLoader } = loadersManagement;
	const { pool } = relayPoolManagement;

	// watch for new events and send them to the cache relay
	eventStore.insert$
		.pipe(filter((event) => !isFromCache(event)))
		.subscribe(writeEvent);

	const addressable = (
		account: IAccount,
		relays: Iterable<string>,
		kind: number,
		d?: string,
	) => {
		return addressLoader({
			relays: [...relays],
			kind,
			pubkey: account.pubkey,
			identifier: d,
			cache: false,
		});
	};

	// listen for account changes and load users events
	combineLatest([
		accounts.active$.pipe(
			defined(),
			distinct((a) => a?.pubkey),
		),
		readRelays,
	])
		.pipe(
			switchMap(([account, relays]) =>
				combineLatest([
					of(account),
					eventStore.model(
						MailboxesQuery,
						{ pubkey: account.pubkey, relays },
						eventStoreManagement,
						loadersManagement,
					),
				] as const),
			),
			switchMap(([account, mailboxes]) => {
				if (!mailboxes?.outboxes) return NEVER;

				const info = merge(
					// Load user information
					addressable(account, mailboxes?.outboxes, kinds.Metadata),
					addressable(account, mailboxes?.outboxes, kinds.Contacts),
					addressable(
						account,
						mailboxes?.outboxes,
						USER_BLOSSOM_SERVER_LIST_KIND,
					),
					addressable(account, mailboxes?.outboxes, kinds.SearchRelaysList),
					addressable(
						account,
						mailboxes?.outboxes,
						APP_SETTINGS_KIND,
						APP_SETTING_IDENTIFIER,
					),
				);

				// load latest delete events
				const deletes = pool.request(mailboxes.outboxes, {
					kinds: [kinds.EventDeletion],
					authors: [account.pubkey],
				});

				return merge(info, deletes);
			}),
		)
		.subscribe();

	// Attempt to authenticate with all relays
	pool.relays$
		.pipe(
			switchMap((relays) =>
				merge(
					...Array.from(relays.values()).map((relay) =>
						relay.challenge$.pipe(
							defined(),
							// Wait for a challenge to change
							distinctUntilChanged(),
							// Create auth draft
							map((c) => nip42.makeAuthEvent(relay.url, c)),
							// sign draft
							switchMap((draft) => authenticationSigner.signEvent(draft)),
							// send auth event
							switchMap((event) => relay.auth(event)),
						),
					),
				),
			),
		)
		.subscribe();

	// Update authentication signer when relays status change
	pool.relays$
		.pipe(
			switchMap((relays) =>
				merge(
					...Array.from(relays.values()).map((relay) =>
						relay.connected$.pipe(
							// Update signer when relay connection state changes
							tap((connected) =>
								authenticationSigner.handleRelayConnectionState(
									relay.url,
									connected,
								),
							),
						),
					),
				),
			),
		)
		.subscribe();

	// Create message subscriptions
	const legacyMessageSubscription = createLegacyMessageSubscription(
		accountsManagement,
		relayPoolManagement,
		eventStoreManagement,
	);

	const wrappedMessageSubscription = createWrappedMessageSubscription(
		accountsManagement,
		relayPoolManagement,
		eventStoreManagement,
	);

	return {
		legacyMessageSubscription,
		wrappedMessageSubscription,
	};
}
