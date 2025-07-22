"use client";

import type { ReactNode } from "react";
import {
	AccountsProvider,
	ActionsProvider,
	FactoryProvider,
	QueryStoreProvider,
} from "applesauce-react/providers";

import { SigningProvider } from "./signing-provider";
import { UserEmojiProvider } from "./emoji-provider";
import PublishProvider from "./publish-provider";
import WebOfTrustProvider from "./web-of-trust-provider";
import DnsIdentityProvider from "./dns-identity-provider";
import AccountManagerProvider, {
	useAccountManagerProvider,
} from "./accounts-provider";
import RelayInfoProvider from "./relay-info-provider";
import EventFactoryProvider, {
	useEventFactoryProvider,
} from "./factory-provider";
import RelayScoreboardProvider from "./relay-scoreboard-provider";
import AuthenticationSignerProvider from "./authentication-signer-provider";
import RxNostrContext from "./rx-nostr-provider";
import UserSetsLoaderProvider from "./user-sets-loader-provider";
import SingleEventLoaderProvider from "./single-event-loader-provider";
import ChannelMetadataLoaderProvider from "./channel-metadata-loader-provider";
import MonitorRelayStatusLoaderProvider from "./relay-status-loader-provider";
import TimelineCacheServiceProvider from "./timeline-cache-provider";
import ReactionsLoaderProvider from "./event-reactions-loader-provider";
import UserEventSyncProvider from "./user-event-sync-provider";
import ActionHubProvider, { useActionHubProvider } from "./actions-provider";
import BakeryProvider from "./bakery-provider";
import DecryptionCacheServiceProvider from "./decryption-cache-provider";
import NotificationsProvider from "./notifications-provider";
import RelayHintsProvider from "./relay-hints-provider";
import UserSearchDirectoryProvider from "./username-search-provider";
import CodeMirrorUserAutocompleteProvider from "./user-autocomplete-provider";
import PaywallProvider from "./paywall-provider";
import RelayPoolProvider from "./pool";
import { queryStore } from "~/services/event-store.client";

// Top level providers, should be render as close to the root as possible
const GlobalProviders3 = ({ children }: { children: React.ReactNode }) => {
	const { accountManager } = useAccountManagerProvider();
	const factory = useEventFactoryProvider();
	const actions = useActionHubProvider();

	return (
		<DnsIdentityProvider>
			<RelayInfoProvider>
				<RelayScoreboardProvider>
					<UserSetsLoaderProvider>
						<SingleEventLoaderProvider>
							<ChannelMetadataLoaderProvider>
								<MonitorRelayStatusLoaderProvider>
									<TimelineCacheServiceProvider>
										<ReactionsLoaderProvider>
											<UserEventSyncProvider>
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
																				<ActionsProvider actionHub={actions}>
																					<FactoryProvider factory={factory}>
																						<SigningProvider>
																							<PublishProvider>
																								<UserEmojiProvider>
																									<WebOfTrustProvider>
																										{children}
																									</WebOfTrustProvider>
																								</UserEmojiProvider>
																							</PublishProvider>
																						</SigningProvider>
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
											</UserEventSyncProvider>
										</ReactionsLoaderProvider>
									</TimelineCacheServiceProvider>
								</MonitorRelayStatusLoaderProvider>
							</ChannelMetadataLoaderProvider>
						</SingleEventLoaderProvider>
					</UserSetsLoaderProvider>
				</RelayScoreboardProvider>
			</RelayInfoProvider>
		</DnsIdentityProvider>
	);
};

export const GlobalProviders = ({ children }: { children: ReactNode }) => {
	if (!queryStore) {
		return null;
	}

	return (
		<QueryStoreProvider queryStore={queryStore}>
			<RelayPoolProvider>
				<AccountManagerProvider>
					{/* AuthenticationSignerProvider depends on AccountManagerProvider */}
					<AuthenticationSignerProvider>
						{/* RxNostrContext depends on AuthenticationSignerProvider */}
						<RxNostrContext>
							{/* EventFactoryProvider depends on AuthenticationSignerProvider */}
							<EventFactoryProvider>
								{/* ActionHubProvider depends on EventFactoryProvider and RxNostrContext */}
								<ActionHubProvider>
									<GlobalProviders3>{children}</GlobalProviders3>
								</ActionHubProvider>
							</EventFactoryProvider>
						</RxNostrContext>
					</AuthenticationSignerProvider>
				</AccountManagerProvider>
			</RelayPoolProvider>
		</QueryStoreProvider>
	);
};
