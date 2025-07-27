import { logger } from "~/helpers/debug";

import { ChakraProvider, localStorageManager } from "@chakra-ui/react";
import {
	AccountsProvider,
	ActionsProvider,
	EventStoreProvider,
	FactoryProvider,
} from "applesauce-react/providers";
import { useMemo, type ReactNode } from "react";

import useAppSettings from "~/hooks/use-user-app-settings";
import buildTheme from "~/theme";
import BreakpointProvider from "./breakpoint-provider";
import { UserEmojiProvider } from "./emoji-provider";
import PublishProvider from "./publish-provider";
import { LocalSettingsProvider, useLocalSettings } from "./preferences";

function ThemeProviders({ children }: { children: React.ReactNode }) {
	const { theme: themeName } = useAppSettings();
	const theme = useMemo(() => buildTheme(themeName), [themeName]);

	return (
		<ChakraProvider theme={theme} colorModeManager={localStorageManager}>
			<BreakpointProvider>{children}</BreakpointProvider>
		</ChakraProvider>
	);
}

export const GlobalProviders = ({ children }: { children: ReactNode }) => {
	try {
		const localSettings = useLocalSettings();

		const {
			eventStoreManagement,
			accountsManagement,
			actionsManagement,
			eventFactoryManagement,
		} = localSettings;

		return (
			<EventStoreProvider eventStore={eventStoreManagement.eventStore}>
				<AccountsProvider manager={accountsManagement.accounts}>
					<ActionsProvider actionHub={actionsManagement.actions}>
						<FactoryProvider factory={eventFactoryManagement.factory}>
							<ThemeProviders>
								<PublishProvider>
									<UserEmojiProvider>{children}</UserEmojiProvider>
								</PublishProvider>
							</ThemeProviders>
						</FactoryProvider>
					</ActionsProvider>
				</AccountsProvider>
			</EventStoreProvider>
		);
	} catch (error) {
		return <div>Loading...</div>;
	}
};

export const LocalSettingsProviders = ({
	children,
}: {
	children: ReactNode;
}) => (
	<LocalSettingsProvider>
		<GlobalProviders>{children}</GlobalProviders>
	</LocalSettingsProvider>
);
