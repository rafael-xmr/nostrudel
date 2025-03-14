"use client";

import { useState, useEffect, type ReactNode } from "react";
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
import getAccounts from "../../services/accounts";
import actions from "../../services/actions";
import type { AccountManager } from "applesauce-accounts";
import getAuthenticationSigner, {
	type AuthenticationSigner,
} from "~/services/authentication-signer";
import { getRxNostr } from "~/services/rx-nostr";
import type { createRxNostr } from "rx-nostr";
import type {
	ReplaceableLoader,
	SingleEventLoader,
	UserSetsLoader,
} from "applesauce-loaders";
import { getReplaceableEventLoader } from "~/services/replaceable-loader";
import getUserSetsLoader from "~/services/user-sets-loader";
import getSingleEventLoader from "~/services/single-event-loader";
import { EventFactory } from "applesauce-factory";

import { getEventRelayHint, getPubkeyRelayHint } from "~/services/relay-hints";
import { NIP_89_CLIENT_APP } from "~/const";

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
export const GlobalProviders = ({
	children,
}: { children: React.ReactNode }) => {
	const [accounts, setAccounts] = useState<AccountManager>();
	const [signer, setSigner] = useState<AuthenticationSigner>();
	const [rxNostr, setRxNostr] = useState<ReturnType<typeof createRxNostr>>();

	const [factory, setFactory] = useState<EventFactory>();

	const [replaceableEventLoader, setReplaceableEventLoader] =
		useState<ReplaceableLoader>();
	const [userSetsLoader, setUserSetsLoader] = useState<UserSetsLoader>();
	const [singleEventLoader, setSingleEventLoader] =
		useState<SingleEventLoader>();

	useEffect(() => {
		getAccounts().then((accounts) => accounts && setAccounts(accounts));
		getAuthenticationSigner().then((signer) => signer && setSigner(signer));
		getRxNostr().then((rxNostr) => rxNostr && setRxNostr(rxNostr));
	}, []);

	useEffect(() => {
		if (!accounts) return;

		const newFactory = new EventFactory({
			signer: accounts.signer,
			getEventRelayHint,
			getPubkeyRelayHint: getPubkeyRelayHint,
			client: NIP_89_CLIENT_APP,
		});

		setFactory(newFactory);

		if (!window.factory) window.factory = newFactory;
	}, [accounts]);

	useEffect(() => {
		if (!rxNostr) return;

		getReplaceableEventLoader().then(
			(replaceableEventLoader) =>
				replaceableEventLoader &&
				setReplaceableEventLoader(replaceableEventLoader),
		);
		getUserSetsLoader().then(
			(usersetsloader) => usersetsloader && setUserSetsLoader(usersetsloader),
		);
		getSingleEventLoader().then(
			(singleEventLoader) =>
				singleEventLoader && setSingleEventLoader(singleEventLoader),
		);
	}, [rxNostr]);

	if (
		!accounts ||
		!signer ||
		!rxNostr ||
		!replaceableEventLoader ||
		!userSetsLoader ||
		!singleEventLoader ||
		!factory
	)
		return null;

	return (
		<QueryStoreProvider queryStore={queryStore}>
			<AccountsProvider manager={accounts}>
				<ActionsProvider actionHub={actions}>
					<FactoryProvider factory={factory}>
						<ThemeProviders>
							<SigningProvider>
								<PublishProvider>
									<UserEmojiProvider>
										<WebOfTrustProvider>{children}</WebOfTrustProvider>
									</UserEmojiProvider>
								</PublishProvider>
							</SigningProvider>
						</ThemeProviders>
					</FactoryProvider>
				</ActionsProvider>
			</AccountsProvider>
		</QueryStoreProvider>
	);
};
