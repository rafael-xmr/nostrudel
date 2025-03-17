"use client";

import type { ReactNode } from "react";
import { ChakraProvider, localStorageManager } from "@chakra-ui/react";
import {
	AccountsProvider,
	QueryStoreProvider,
	ActionsProvider,
	FactoryProvider,
} from "applesauce-react/providers";

import { SigningProvider } from "./signing-provider";
import buildTheme from "../../theme";
import { UserEmojiProvider } from "./emoji-provider";
import BreakpointProvider from "./breakpoint-provider";
import PublishProvider from "./publish-provider";
import WebOfTrustProvider from "./web-of-trust-provider";
import { queryStore } from "../../services/event-store";
import DBProvider, { useDB } from "./db-provider";
import DnsIdentityProvider from "./dns-identity-provider";
import AccountManagerProvider, {
	useAccountManagerProvider,
} from "./accounts-provider";
import RelayInfoProvider from "./relay-info-provider";
import ReadStatusProvider from "./read-status-provider";
import EventFactoryProvider, { useEventFactory } from "./factory-provider";
import RelayScoreboardProvider from "./relay-scoreboard-provider";
import AuthenticationSignerProvider from "./authentication-signer-provider";
import RxNostrContext, { useRxNostr } from "./rx-nostr-provider";
import ReplaceableEventLoaderProvider from "./replaceable-loader-provider";
import UserSetsLoaderProvider from "./user-sets-loader-provider";
import SingleEventLoaderProvider from "./single-event-loader-provider";
import ZapsLoaderProvider from "./event-zaps-loader-provider";
import ChannelMetadataLoaderProvider from "./channel-metadata-loader-provider";
import MonitorRelayStatusLoaderProvider from "./relay-status-loader-provider";
import TimelineCacheServiceProvider from "./timeline-cache-provider";
import ReactionsLoaderProvider from "./event-reactions-loader-provider";
import UserEventSyncProvider from "./user-event-sync-provider";
import ActionHubProvider, { useActionHubProvider } from "./actions-provider";
import WikiPageLoaderProvider from "./wiki-page-loader-provider";
import BakeryProvider from "./bakery-provider";
import DecryptionCacheServiceProvider from "./decryption-cache-provider";
import NotificationsProvider from "./notifications-provider";
import RelayHintsProvider from "./relay-hints-provider";
import UserSearchDirectoryProvider from "./username-search-provider";
import CodeMirrorUserAutocompleteProvider from "./user-autocomplete-provider";
import PaywallProvider from "./paywall-provider";

function ThemeProviders({ children }: { children: ReactNode }) {
	return (
		<ChakraProvider
			theme={buildTheme("default")}
			colorModeManager={localStorageManager}
		>
			<BreakpointProvider>{children}</BreakpointProvider>
		</ChakraProvider>
	);
}

// Top level providers, should be render as close to the root as possible
const GlobalProviders3 = ({ children }: { children: React.ReactNode }) => {
	const { accountManager } = useAccountManagerProvider();
	const factory = useEventFactory();
	const actions = useActionHubProvider();

	return (
		<AuthenticationSignerProvider>
			<RxNostrContext>
				<QueryStoreProvider queryStore={queryStore}>
					<DnsIdentityProvider>
						<RelayInfoProvider>
							<ReadStatusProvider>
								<RelayScoreboardProvider>
									<ReplaceableEventLoaderProvider>
										<UserSetsLoaderProvider>
											<SingleEventLoaderProvider>
												<ZapsLoaderProvider>
													<ChannelMetadataLoaderProvider>
														<MonitorRelayStatusLoaderProvider>
															<TimelineCacheServiceProvider>
																<ReactionsLoaderProvider>
																	<UserEventSyncProvider>
																		<WikiPageLoaderProvider>
																			<BakeryProvider>
																				<DecryptionCacheServiceProvider>
																					<NotificationsProvider>
																						<RelayHintsProvider>
																							<UserSearchDirectoryProvider>
																								<CodeMirrorUserAutocompleteProvider>
																									<PaywallProvider>
																										<AccountsProvider
																											manager={accountManager}
																										>
																											<ActionsProvider
																												actionHub={actions}
																											>
																												<FactoryProvider
																													factory={factory}
																												>
																													<ThemeProviders>
																														<SigningProvider>
																															<PublishProvider>
																																<UserEmojiProvider>
																																	<WebOfTrustProvider>
																																		{children}
																																	</WebOfTrustProvider>
																																</UserEmojiProvider>
																															</PublishProvider>
																														</SigningProvider>
																													</ThemeProviders>
																												</FactoryProvider>
																											</ActionsProvider>
																										</AccountsProvider>
																									</PaywallProvider>
																								</CodeMirrorUserAutocompleteProvider>
																							</UserSearchDirectoryProvider>
																						</RelayHintsProvider>
																					</NotificationsProvider>
																				</DecryptionCacheServiceProvider>
																			</BakeryProvider>
																		</WikiPageLoaderProvider>
																	</UserEventSyncProvider>
																</ReactionsLoaderProvider>
															</TimelineCacheServiceProvider>
														</MonitorRelayStatusLoaderProvider>
													</ChannelMetadataLoaderProvider>
												</ZapsLoaderProvider>
											</SingleEventLoaderProvider>
										</UserSetsLoaderProvider>
									</ReplaceableEventLoaderProvider>
								</RelayScoreboardProvider>
							</ReadStatusProvider>
						</RelayInfoProvider>
					</DnsIdentityProvider>
				</QueryStoreProvider>
			</RxNostrContext>
		</AuthenticationSignerProvider>
	);
};

export const GlobalProviders2 = ({ children }: { children: ReactNode }) => {
	const { db } = useDB();

	if (!db) {
		return null;
	}

	return (
		<AccountManagerProvider>
			<EventFactoryProvider>
				<ActionHubProvider>
					<GlobalProviders3>{children}</GlobalProviders3>
				</ActionHubProvider>
			</EventFactoryProvider>
		</AccountManagerProvider>
	);
};

export const GlobalProviders = ({ children }: { children: ReactNode }) => {
	return (
		<DBProvider>
			<GlobalProviders2>{children}</GlobalProviders2>
		</DBProvider>
	);
};
