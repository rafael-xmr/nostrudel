import { logger } from "~/helpers/debug";

import { createContext, useContext, useState, useEffect } from "react";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";
import { generateSecretKey } from "nostr-tools";
import type { SerializedAccount } from "applesauce-accounts";
import type { Observable } from "rxjs";

import { DEFAULT_LOOKUP_RELAYS, DEFAULT_SIGNAL_RELAYS } from "~/const";
import { PreferenceSubject } from "~/classes/preference-subject";
import createNotificationsObservable, {
	type CategorizedEvent,
} from "~/services/notifications";
import createPaywallManagement, {
	type PaywallManagement,
} from "~/services/paywall";

// Import all management types and factories
import createDatabaseManagement, {
	type DatabaseManagement,
} from "~/services/database";
import createRelayPoolManagement, {
	type RelayPoolManagement,
} from "~/services/pool";
import createEventVerificationManagement, {
	type EventVerificationManagement,
} from "~/services/verify-event";
import createEventStoreManagement, {
	type EventStoreManagement,
} from "~/services/event-store";
import createEventCacheManagement, {
	type EventCacheManagement,
} from "~/services/event-cache";
import createAccountsManagement, {
	type AccountsManagement,
} from "~/services/accounts";
import createLoadersManagement, {
	type LoadersManagement,
} from "~/services/loaders";
import createAuthenticationSignerManagement, {
	type AuthenticationSignerManagement,
	type RelayAuthMode,
} from "~/services/authentication-signer";
import createSocialGraphManagement, {
	type SocialGraphManagement,
} from "~/services/social-graph";
import createTimelineCacheManagement, {
	type TimelineCacheManagement,
} from "~/services/timeline-cache";
import createRelayScoreboardManagement, {
	type RelayScoreboardManagement,
} from "~/services/relay-scoreboard";
import createRelayInfoManagement, {
	type RelayInfoManagement,
} from "~/services/relay-info";
import createRelayHintsManagement, {
	type RelayHintsManagement,
} from "~/services/relay-hints";
import createMonitorRelayStatusManagement, {
	type MonitorRelayStatusManagement,
} from "~/services/relay-status-loader";
import createRelayChatManagement, {
	type RelayChatManagement,
} from "~/services/relay-chats";
import createReadStatusManagement, {
	type ReadStatusManagement,
} from "~/services/read-status";
import createDnsIdentityManagement, {
	type DnsIdentityManagement,
} from "~/services/dns-identity-loader";
import createContentFilterManagement, {
	type ContentFilterManagement,
} from "~/services/event-policies";
import createEventFactoryManagement, {
	type EventFactoryManagement,
} from "~/services/event-factory";
import createActionsManagement, {
	type ActionsManagement,
} from "~/services/actions";
import createUserDataManagement, {
	type UserDataManagement,
} from "~/services/lifecycle";
import createDecryptionCacheManagement, {
	type DecryptionCacheManagement,
} from "~/services/decryption-cache";
import createWebRtcRelayManagement, {
	type WebRtcRelayManagement,
} from "~/services/webrtc-relays";
import createCronTaskManagement, {
	type CronTaskManagement,
} from "~/services/cron";
import createRelayManagement, {
	type RelayManagement,
} from "~/services/app-relays";
import createWasmWorkerManagement, {
	type WasmWorkerManagement,
} from "~/services/event-cache/wasm-worker";
import createSecureStorage, {
	type SecureStorage,
} from "~/classes/encrypted-storage";
import createImageUtilsManagement, {
	type ImageUtilsManagement,
} from "~/helpers/image";
import createUserSearchManagement, {
	type UserSearchManagement,
} from "~/services/username-search";
import createRequestProxyManagement, {
	type RequestProxyManagement,
} from "~/helpers/request";
import createIndexedDBManagement, {
	type IndexedDBManagement,
} from "~/services/event-cache/nostr-idb";
import { TrustedUserStatsService } from "~/services/trusted-user-stats";

// Define LocalForage-like interface
interface LocalForageDbMethods {
	setItem(key: string, value: any): Promise<void>;
	getItem(key: string): Promise<any>;
	removeItem(key: string): Promise<void>;
	clear(): Promise<void>;
	length(): Promise<number>;
	key(keyIndex: number): Promise<string | null>;
	keys(): Promise<string[]>;
	iterate<T, U>(
		iteratee: (value: T, key: string, iterationNumber: number) => U,
	): Promise<U>;
	dropInstance(options?: { name?: string; storeName?: string }): Promise<void>;
}

export interface LocalSettingsContextType {
	// Accounts
	accounts: PreferenceSubject<SerializedAccount<any, any>[]>;
	activeAccount: PreferenceSubject<string | null>;

	// Relays
	readRelays: PreferenceSubject<string[]>;
	writeRelays: PreferenceSubject<string[]>;
	lookupRelays: PreferenceSubject<string[]>;

	// Event cache
	idbMaxEvents: PreferenceSubject<number>;
	wasmPersistForDays: PreferenceSubject<number | null>;

	// Display
	hideZapBubbles: PreferenceSubject<boolean>;
	hideUsernames: PreferenceSubject<boolean>;

	// WebRTC Relay
	webRtcLocalIdentity: PreferenceSubject<Uint8Array>;
	webRtcSignalingRelays: PreferenceSubject<string[]>;
	webRtcRecentConnections: PreferenceSubject<string[]>;

	// Posting
	addClientTag: PreferenceSubject<boolean>;

	// Performance
	verifyEventMethod: PreferenceSubject<string>;

	// Privacy
	enableDebugApi: PreferenceSubject<boolean>;
	alwaysAuthUpload: PreferenceSubject<boolean>;

	// Relay Authentication
	defaultAuthenticationMode: PreferenceSubject<RelayAuthMode>;
	proactivelyAuthenticate: PreferenceSubject<boolean>;
	relayAuthenticationMode: PreferenceSubject<
		{
			relay: string;
			mode: RelayAuthMode;
		}[]
	>;

	// Social Graph
	updateSocialGraphDistance: PreferenceSubject<number>;
	updateSocialGraphInterval: PreferenceSubject<number>;
	lastUpdatedSocialGraph: PreferenceSubject<number>;

	// Cache Relay
	eventCache: PreferenceSubject<string | null>;

	// Content Policies
	hideEventsOutsideSocialGraph: PreferenceSubject<number | null>;
	blurMediaOutsideSocialGraph: PreferenceSubject<number | null>;
	hideEmbedsOutsideSocialGraph: PreferenceSubject<number | null>;

	// Decryption cache
	encryptionSalt: PreferenceSubject<Uint8Array>;
	encryptDecryptionCache: PreferenceSubject<boolean>;

	// Direct messages
	enableDecryptionCache: PreferenceSubject<boolean>;
	autoDecryptMessages: PreferenceSubject<boolean>;
	defaultMessageExpiration: PreferenceSubject<number | null>;
}

export interface LocalSettingsContextValue {
	localSettings: LocalSettingsContextType;

	// Core Management Systems
	databaseManagement: DatabaseManagement;
	relayPoolManagement: RelayPoolManagement;
	eventVerificationManagement: EventVerificationManagement;
	eventStoreManagement: EventStoreManagement;
	eventCacheManagement: EventCacheManagement;
	accountsManagement: AccountsManagement;
	loadersManagement: LoadersManagement;
	authenticationSignerManagement: AuthenticationSignerManagement;
	socialGraphManagement: SocialGraphManagement;
	timelineCacheManagement: TimelineCacheManagement;
	imageUtilsManagement: ImageUtilsManagement;

	// Utility Management Systems
	relayScoreboardManagement: RelayScoreboardManagement;
	relayInfoManagement: RelayInfoManagement;
	relayHintsManagement: RelayHintsManagement;
	monitorRelayStatusManagement: MonitorRelayStatusManagement;
	relayChatManagement: RelayChatManagement;
	readStatusManagement: ReadStatusManagement;
	dnsIdentityManagement: DnsIdentityManagement;
	contentFilterManagement: ContentFilterManagement;
	eventFactoryManagement: EventFactoryManagement;
	actionsManagement: ActionsManagement;
	userDataManagement: UserDataManagement;
	decryptionCacheManagement: DecryptionCacheManagement;
	userSearchManagement: UserSearchManagement;
	requestProxyManagement: RequestProxyManagement;
	indexedDBManagement: IndexedDBManagement;
	trustedUserStatsService: TrustedUserStatsService;

	// Service Management Systems
	webRtcRelayManagement: WebRtcRelayManagement;
	cronTaskManagement: CronTaskManagement;
	relayManagement: RelayManagement;
	wasmWorkerManagement: WasmWorkerManagement;

	// Legacy/Compatibility
	encryptedStorage: SecureStorage;
	notifications$: Observable<CategorizedEvent[]>;
	paywallManagement: PaywallManagement;
}

const LocalSettingsContext = createContext<
	LocalSettingsContextValue | undefined
>(undefined);

export function LocalSettingsProvider({ children }) {
	logger("Initializing LocalSettingsProvider");

	const [contextValue, setContextValue] = useState<
		LocalSettingsContextValue | undefined
	>(undefined);

	useEffect(() => {
		const initializeSettings = async () => {
			// Initialize all preference subjects
			const accounts = await PreferenceSubject.array<
				SerializedAccount<any, any>
			>("accounts", []);
			const activeAccount = await PreferenceSubject.stringNullable(
				"active-account",
				null,
			);
			const readRelays = await PreferenceSubject.array<string>(
				"read-relays",
				[],
			);
			const writeRelays = await PreferenceSubject.array<string>(
				"write-relays",
				[],
			);
			const lookupRelays = await PreferenceSubject.array<string>(
				"lookup-relays",
				DEFAULT_LOOKUP_RELAYS,
			);
			const idbMaxEvents = await PreferenceSubject.number(
				"nostr-idb-max-events",
				10_000,
			);
			const wasmPersistForDays = await PreferenceSubject.numberNullable(
				"wasm-relay-oldest-event",
				365,
			);
			const hideZapBubbles = await PreferenceSubject.boolean(
				"hide-zap-bubbles",
				false,
			);
			const hideUsernames = await PreferenceSubject.boolean(
				"hide-usernames",
				false,
			);
			const webRtcLocalIdentity = await PreferenceSubject.create<Uint8Array>(
				"nostr-webrtc-identity",
				generateSecretKey(),
				{
					decode: (raw) => hexToBytes(raw),
					encode: (key) => bytesToHex(key),
					saveDefault: true,
				},
			);
			const webRtcSignalingRelays = await PreferenceSubject.array<string>(
				"nostr-webrtc-signaling-relays",
				DEFAULT_SIGNAL_RELAYS,
			);
			const webRtcRecentConnections = await PreferenceSubject.array<string>(
				"nostr-webrtc-recent-connections",
				[],
			);
			const addClientTag = await PreferenceSubject.boolean(
				"add-client-tag",
				false,
			);
			const verifyEventMethod = await PreferenceSubject.string(
				"verify-event-method",
				"wasm",
			);
			const enableDebugApi = await PreferenceSubject.boolean(
				"debug-api",
				false,
			);
			const alwaysAuthUpload = await PreferenceSubject.boolean(
				"always-auth-upload",
				true,
			);
			const defaultAuthenticationMode =
				await PreferenceSubject.create<RelayAuthMode>(
					"default-authentication-mode",
					"ask",
				);
			const proactivelyAuthenticate = await PreferenceSubject.boolean(
				"proactively-authenticate",
				false,
			);
			const relayAuthenticationMode = await PreferenceSubject.array<{
				relay: string;
				mode: RelayAuthMode;
			}>("relay-authentication-mode", []);
			const updateSocialGraphDistance = await PreferenceSubject.number(
				"update-social-graph-distance",
				2,
			);
			const updateSocialGraphInterval = await PreferenceSubject.number(
				"update-social-graph-interval",
				1000 * 60 * 60 * 24,
			);
			const lastUpdatedSocialGraph = await PreferenceSubject.number(
				"last-updated-social-graph",
				0,
			);
			const eventCache = await PreferenceSubject.stringNullable(
				"cache-relay-url",
				"nostr-idb",
			);
			const hideEventsOutsideSocialGraph =
				await PreferenceSubject.numberNullable(
					"hide-events-outside-social-graph",
					null,
				);
			const blurMediaOutsideSocialGraph =
				await PreferenceSubject.numberNullable(
					"blur-media-outside-social-graph",
					3,
				);
			const hideEmbedsOutsideSocialGraph =
				await PreferenceSubject.numberNullable(
					"hide-embeds-outside-social-graph",
					4,
				);
			const encryptionSalt = await PreferenceSubject.create<Uint8Array>(
				"encryption-salt",
				crypto.getRandomValues(new Uint8Array(48)),
				{
					decode: (raw) => hexToBytes(raw),
					encode: (key) => bytesToHex(key),
					saveDefault: true,
				},
			);
			const encryptDecryptionCache = await PreferenceSubject.boolean(
				"encrypt-decryption-cache",
				true,
			);
			const enableDecryptionCache = await PreferenceSubject.boolean(
				"enable-decryption-cache",
				true,
			);
			const autoDecryptMessages = await PreferenceSubject.boolean(
				"auto-decrypt-messages",
				true,
			);
			const defaultMessageExpiration = await PreferenceSubject.numberNullable(
				"default-message-expiration",
				null,
			);

			logger("Initialized PreferenceSubjects");

			const localSettings = {
				// Accounts
				accounts,
				activeAccount,

				// Relays
				readRelays,
				writeRelays,
				lookupRelays,

				// Event cache
				idbMaxEvents,
				wasmPersistForDays,

				// Display
				hideZapBubbles,
				hideUsernames,

				webRtcLocalIdentity,
				webRtcSignalingRelays,
				webRtcRecentConnections,
				addClientTag,
				verifyEventMethod,
				enableDebugApi,
				alwaysAuthUpload,
				defaultAuthenticationMode,
				proactivelyAuthenticate,
				relayAuthenticationMode,

				// Social Graph
				updateSocialGraphDistance,
				updateSocialGraphInterval,
				lastUpdatedSocialGraph,
				eventCache,
				hideEventsOutsideSocialGraph,
				blurMediaOutsideSocialGraph,
				hideEmbedsOutsideSocialGraph,

				// Decryption cache
				encryptionSalt,
				encryptDecryptionCache,

				// Direct messages
				autoDecryptMessages,
				enableDecryptionCache,
				defaultMessageExpiration,
			} satisfies Record<string, PreferenceSubject<any>>;

			logger("Initialized localSettings");

			// Create core management systems in dependency order
			const databaseManagement = createDatabaseManagement();

			logger("Initialized databaseManagement");

			const relayPoolManagement = createRelayPoolManagement();
			logger("Initialized relayPoolManagement");

			const eventVerificationManagement =
				createEventVerificationManagement(verifyEventMethod);
			logger("Initialized eventVerificationManagement");

			const eventStoreManagement = createEventStoreManagement(
				eventVerificationManagement,
			);
			logger("Initialized eventStoreManagement");

			const eventCacheManagement = createEventCacheManagement(
				eventCache,
				wasmPersistForDays,
				idbMaxEvents,
			);
			logger("Initialized eventCacheManagement");

			const accountsManagement = await createAccountsManagement(
				databaseManagement,
				accounts,
				activeAccount,
			);
			logger("Initialized accountsManagement");

			const loadersManagement = createLoadersManagement(
				relayPoolManagement,
				eventStoreManagement,
				readRelays,
				lookupRelays,
			);
			logger("Initialized loadersManagement");

			const authenticationSignerManagement =
				createAuthenticationSignerManagement(
					accountsManagement.accounts,
					defaultAuthenticationMode,
					relayAuthenticationMode,
				);
			logger("Initialized authenticationSignerManagement");

			const socialGraphManagement = await createSocialGraphManagement(
				accountsManagement,
				databaseManagement,
				eventStoreManagement,
				loadersManagement,
			);
			logger("Initialized socialGraphManagement");

			const timelineCacheManagement = createTimelineCacheManagement(
				relayPoolManagement,
				eventCacheManagement,
				eventStoreManagement,
			);
			logger("Initialized timelineCacheManagement");

			const imageUtilsManagement = createImageUtilsManagement(
				accountsManagement,
				eventStoreManagement,
				loadersManagement,
			);
			logger("Initialized imageUtilsManagement");

			const userSearchManagement = createUserSearchManagement(
				databaseManagement,
				eventStoreManagement,
			);
			logger("Initialized userSearchManagement");

			const requestProxyManagement = createRequestProxyManagement(
				accountsManagement,
				eventStoreManagement,
				loadersManagement,
			);
			logger("Initialized requestProxyManagement");

			const indexedDBManagement = await createIndexedDBManagement(
				localSettings.idbMaxEvents,
			);
			logger("Initialized indexedDBManagement");

			const trustedUserStatsService = new TrustedUserStatsService();
			logger("Initialized trustedUserStatsService");

			// Create utility management systems
			const relayScoreboardManagement =
				await createRelayScoreboardManagement(databaseManagement);
			logger("Initialized relayScoreboardManagement");

			const relayInfoManagement = await createRelayInfoManagement(
				databaseManagement,
				requestProxyManagement,
			);
			logger("Initialized relayInfoManagement");

			const relayHintsManagement = createRelayHintsManagement(
				relayScoreboardManagement,
				eventStoreManagement,
			);
			logger("Initialized relayHintsManagement");

			const monitorRelayStatusManagement = createMonitorRelayStatusManagement(
				relayPoolManagement,
				eventCacheManagement,
			);
			logger("Initialized monitorRelayStatusManagement");

			const relayChatManagement = createRelayChatManagement(
				relayPoolManagement,
				eventStoreManagement,
			);
			logger("Initialized relayChatManagement");

			const readStatusManagement =
				await createReadStatusManagement(databaseManagement);
			logger("Initialized readStatusManagement");

			const dnsIdentityManagement = await createDnsIdentityManagement(
				databaseManagement,
				requestProxyManagement,
			);
			logger("Initialized dnsIdentityManagement");

			const contentFilterManagement = createContentFilterManagement(
				socialGraphManagement,
				hideEventsOutsideSocialGraph,
				blurMediaOutsideSocialGraph,
				hideEmbedsOutsideSocialGraph,
			);
			logger("Initialized contentFilterManagement");

			const eventFactoryManagement = createEventFactoryManagement(
				accountsManagement,
				relayHintsManagement,
				addClientTag,
			);
			logger("Initialized eventFactoryManagement");

			const actionsManagement = createActionsManagement(
				eventStoreManagement,
				eventFactoryManagement,
				relayPoolManagement,
			);
			logger("Initialized actionsManagement");

			const userDataManagement = createUserDataManagement(
				accountsManagement,
				authenticationSignerManagement,
				eventCacheManagement,
				eventStoreManagement,
				loadersManagement,
				relayPoolManagement,
				readRelays,
			);
			logger("Initialized userDataManagement");

			const decryptionCacheManagement = createDecryptionCacheManagement(
				accountsManagement,
				eventStoreManagement,
				enableDecryptionCache,
				encryptDecryptionCache,
				autoDecryptMessages,
			);
			logger("Initialized decryptionCacheManagement");

			// Create service management systems
			const webRtcRelayManagement = createWebRtcRelayManagement(
				webRtcLocalIdentity,
				webRtcSignalingRelays,
				webRtcRecentConnections,
				eventVerificationManagement.verifyEvent,
			);
			webRtcRelayManagement.start();
			logger("Initialized webRtcRelayManagement");

			const cronTaskManagement = createCronTaskManagement(
				socialGraphManagement,
				updateSocialGraphDistance,
				updateSocialGraphInterval,
				lastUpdatedSocialGraph,
			);
			logger("Initialized cronTaskManagement");

			const relayManagement = createRelayManagement(readRelays, writeRelays);
			logger("Initialized relayManagement");

			const wasmWorkerManagement =
				createWasmWorkerManagement(wasmPersistForDays);
			logger("Initialized wasmWorkerManagement");

			// wasmWorkerManagement.startPruning();

			// Create legacy/compatibility systems
			const encryptedStorage = createSecureStorage(
				createDefaultDatabase(),
				encryptionSalt.value,
			);
			logger("Initialized encryptedStorage");

			const notifications$ = createNotificationsObservable(
				accountsManagement,
				eventStoreManagement,
				loadersManagement,
				localSettings.readRelays,
			);
			logger("Initialized notifications$");

			const paywallManagement = createPaywallManagement(
				accountsManagement.accounts,
			);
			logger("Initialized paywallManagement");

			// Update loaders to use the actual cache request function
			const updateLoadersCacheRequest = () => {
				(loadersManagement.addressLoader as any).cacheRequest =
					eventCacheManagement.cacheRequest;
				(loadersManagement.profileLoader as any).cacheRequest =
					eventCacheManagement.cacheRequest;
				(loadersManagement.eventLoader as any).cacheRequest =
					eventCacheManagement.cacheRequest;
				(loadersManagement.reactionsLoader as any).cacheRequest =
					eventCacheManagement.cacheRequest;
				(loadersManagement.userSetsLoader as any).cacheRequest =
					eventCacheManagement.cacheRequest;
				(loadersManagement.channelMetadataLoader as any).cacheRequest =
					eventCacheManagement.cacheRequest;
			};

			updateLoadersCacheRequest();
			logger("Initialized updateLoadersCacheRequest");

			// Migrate legacy local storage settings (only on client)
			if (typeof window !== "undefined") {
				const cleanup: string[] = [];
				for (const [key, value] of Object.entries(localStorage)) {
					if (Reflect.has(localSettings, key)) {
						Reflect.get(localSettings, key).next(value);
						cleanup.push(key);
					}
				}
				if (cleanup.length) {
					for (const key of cleanup) {
						localStorage.removeItem(key);
					}
					console.log(
						"Migrated",
						cleanup.length,
						"settings from local storage",
					);
				}

				// Debug API (only in development)
				if (import.meta.env.DEV) {
					// @ts-expect-error debug
					window.databaseManagement = databaseManagement;
					// @ts-expect-error debug
					window.relayPoolManagement = relayPoolManagement;
					// @ts-expect-error debug
					window.eventVerificationManagement = eventVerificationManagement;
					// @ts-expect-error debug
					window.eventStoreManagement = eventStoreManagement;
					// @ts-expect-error debug
					window.eventCacheManagement = eventCacheManagement;
					// @ts-expect-error debug
					window.accountsManagement = accountsManagement;
					// @ts-expect-error debug
					window.loadersManagement = loadersManagement;
					// @ts-expect-error debug
					window.authenticationSignerManagement =
						authenticationSignerManagement;
					// // @ts-expect-error debug
					window.socialGraphManagement = socialGraphManagement;
					// @ts-expect-error debug
					window.timelineCacheManagement = timelineCacheManagement;
					// @ts-expect-error debug
					window.imageUtilsManagement = imageUtilsManagement;
					// @ts-expect-error debug
					window.userSearchManagement = userSearchManagement;
					// @ts-expect-error debug
					window.requestProxyManagement = requestProxyManagement;
					// @ts-expect-error debug
					window.indexedDBManagement = indexedDBManagement;
					// @ts-expect-error debug
					window.trustedUserStatsService = trustedUserStatsService;
					// @ts-expect-error debug
					window.relayScoreboardManagement = relayScoreboardManagement;
					// @ts-expect-error debug
					window.relayInfoManagement = relayInfoManagement;
					// @ts-expect-error debug
					window.relayHintsManagement = relayHintsManagement;
					// @ts-expect-error debug
					window.contentFilterManagement = contentFilterManagement;
					// @ts-expect-error debug
					window.eventFactoryManagement = eventFactoryManagement;
					// @ts-expect-error debug
					window.actionsManagement = actionsManagement;
					// @ts-expect-error debug
					window.userDataManagement = userDataManagement;
					// @ts-expect-error debug
					window.decryptionCacheManagement = decryptionCacheManagement;
					// @ts-expect-error debug
					window.webRtcRelayManagement = webRtcRelayManagement;
					// @ts-expect-error debug
					window.cronTaskManagement = cronTaskManagement;
					// @ts-expect-error debug
					window.localSettings = localSettings;
					// @ts-expect-error debug
					window.encryptedStorage = encryptedStorage;
					// @ts-expect-error debug
					window.notifications$ = notifications$;
					// @ts-expect-error debug
					window.paywallManagement = paywallManagement;
				}
			}

			setContextValue({
				localSettings,

				// Core Management Systems
				databaseManagement,
				relayPoolManagement,
				eventVerificationManagement,
				eventStoreManagement,
				eventCacheManagement,
				accountsManagement,
				loadersManagement,
				authenticationSignerManagement,
				socialGraphManagement,
				timelineCacheManagement,
				imageUtilsManagement,

				// Utility Management Systems
				relayScoreboardManagement,
				relayInfoManagement,
				relayHintsManagement,
				monitorRelayStatusManagement,
				relayChatManagement,
				readStatusManagement,
				dnsIdentityManagement,
				contentFilterManagement,
				eventFactoryManagement,
				actionsManagement,
				userDataManagement,
				decryptionCacheManagement,
				userSearchManagement,
				requestProxyManagement,
				indexedDBManagement,
				trustedUserStatsService,

				// Service Management Systems
				webRtcRelayManagement,
				cronTaskManagement,
				relayManagement,
				wasmWorkerManagement,

				// Legacy/Compatibility
				encryptedStorage,
				notifications$,
				paywallManagement,
			});
			logger("setContextValue");

			// Cleanup function for subscriptions
			return () => {
				// webRtcRelayManagement.stop();
				// cronTaskManagement.stopAllTasks();
				// wasmWorkerManagement.stopPruning();
				relayScoreboardManagement.stopAutoSave();
				readStatusManagement.stopAutoPrune();
			};
		};

		const cleanup = initializeSettings();

		// Return cleanup function
		return () => {
			cleanup?.then((cleanupFn) => cleanupFn?.());
		};
	}, []);

	return (
		<LocalSettingsContext.Provider value={contextValue}>
			{children}
		</LocalSettingsContext.Provider>
	);
}

function createDefaultDatabase(): LocalForageDbMethods {
	return {
		async setItem<T>(key: string, value: any): Promise<T> {
			if (typeof window !== "undefined") {
				localStorage.setItem(key, JSON.stringify(value));
			}
			return value as T;
		},
		async getItem(key: string): Promise<any> {
			if (typeof window !== "undefined") {
				const item = localStorage.getItem(key);
				return item ? JSON.parse(item) : null;
			}
			return null;
		},
		async removeItem(key: string): Promise<void> {
			if (typeof window !== "undefined") {
				localStorage.removeItem(key);
			}
		},
		async clear(): Promise<void> {
			if (typeof window !== "undefined") {
				localStorage.clear();
			}
		},
		async length(): Promise<number> {
			if (typeof window !== "undefined") {
				return localStorage.length;
			}
			return 0;
		},
		async key(keyIndex: number): Promise<string | null> {
			if (typeof window !== "undefined") {
				return localStorage.key(keyIndex);
			}
			return null;
		},
		async keys(): Promise<string[]> {
			if (typeof window !== "undefined") {
				return Object.keys(localStorage);
			}
			return [];
		},
		async iterate<T, U>(
			iteratee: (value: T, key: string, iterationNumber: number) => U,
		): Promise<U> {
			if (typeof window !== "undefined") {
				let iterationNumber = 0;
				let result: U;
				for (const key of Object.keys(localStorage)) {
					const item = localStorage.getItem(key);
					const value = item ? JSON.parse(item) : null;
					result = iteratee(value, key, iterationNumber++);
				}
				return result!;
			}
			return undefined as any;
		},
		async dropInstance(options?: {
			name?: string;
			storeName?: string;
		}): Promise<void> {
			// For localStorage fallback, this is essentially a clear operation
			if (typeof window !== "undefined") {
				localStorage.clear();
			}
		},
	};
}

export function useLocalSettings() {
	const context = useContext(LocalSettingsContext);
	if (context === undefined) {
		throw new Error(
			"useLocalSettings must be used within a LocalSettingsProvider",
		);
	}
	return context;
}
