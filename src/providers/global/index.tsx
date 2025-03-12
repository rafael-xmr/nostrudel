"use client";

import type { ReactNode } from "react";
import { ChakraProvider, localStorageManager } from "@chakra-ui/react";
import {
	AccountsProvider,
	QueryStoreProvider,
} from "applesauce-react/providers";

import { SigningProvider } from "./signing-provider";
import buildTheme from "../../theme";
import { UserEmojiProvider } from "./emoji-provider";
import BreakpointProvider from "./breakpoint-provider";
import PublishProvider from "./publish-provider";
import WebOfTrustProvider from "./web-of-trust-provider";
import { queryStore } from "../../services/event-store";
import EventFactoryProvider from "./event-factory-provider";
import accounts from "../../services/accounts";

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
export const GlobalProviders = ({ children }: { children: ReactNode }) => {
	return (
		<QueryStoreProvider queryStore={queryStore}>
			<AccountsProvider manager={accounts}>
				<ThemeProviders>
					<SigningProvider>
						<PublishProvider>
							<UserEmojiProvider>
								<EventFactoryProvider>
									<WebOfTrustProvider>{children}</WebOfTrustProvider>
								</EventFactoryProvider>
							</UserEmojiProvider>
						</PublishProvider>
					</SigningProvider>
				</ThemeProviders>
			</AccountsProvider>
		</QueryStoreProvider>
	);
};
