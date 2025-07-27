import * as React from "react";

import { ChakraProvider, localStorageManager } from "@chakra-ui/react";
import buildTheme from "../src/theme";
import BreakpointProvider from "../src/providers/global/breakpoint-provider";

import type { MetaFunction } from "@remix-run/node";
import {
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from "@remix-run/react";
import "../src/styles.css";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/counter.css";

import { Suspense } from "react";
import { Spinner, useBreakpointValue } from "@chakra-ui/react";
import { LocalSettingsProviders } from "../src/providers/global";
// import { ReactScan } from "./scan";
import { ErrorBoundary } from "../src/components/error-boundary";
import { RouteProviders } from "../src/providers/route";
import SupportPaywall from "../src/components/layout/components/support-paywall";
import MobileBottomNav from "../src/components/layout/mobile/bottom-nav";
import DesktopSideNav from "../src/components/layout/desktop/side-nav";
import GlobalStyles from "../src/styles";

export const meta: MetaFunction = () => {
	return [
		{ title: "moStard" },
		{
			name: "description",
			content: "A simple nostr web client focused on exploring nostr",
		},
		{ property: "og:url", content: "https://mostard.social" },
		{ property: "og:type", content: "website" },
		{ property: "og:title", content: "moStard" },
		{
			property: "og:description",
			content: "A simple web based nostr client focused on exploring nostr",
		},
		{
			property: "og:image",
			content:
				"https://github.com/rafael-xmr/nostrudel/blob/mostard/public/og_image.jpeg?raw=true",
		},
	];
};

// export const links: LinksFunction = () => {
// 	return [{ rel: "icon", href: "/favicon.ico" }];
// };

function ThemeProviders({ children }: { children: React.ReactNode }) {
	return (
		<ChakraProvider
			theme={buildTheme("default")}
			colorModeManager={localStorageManager}
		>
			<BreakpointProvider>{children}</BreakpointProvider>
		</ChakraProvider>
	);
}

function MobileLayout() {
	return (
		<>
			<SupportPaywall />
			<Suspense fallback={<Spinner />}>
				<ErrorBoundary>
					<Outlet />
				</ErrorBoundary>
			</Suspense>
			<MobileBottomNav />
		</>
	);
}

function DesktopLayout() {
	return (
		<>
			<SupportPaywall />
			<DesktopSideNav />
			<ErrorBoundary>
				<Suspense fallback={<Spinner />}>
					<Outlet />
				</Suspense>
			</ErrorBoundary>
		</>
	);
}

export const RootLayout = () => {
	const mobile = useBreakpointValue({ base: true, md: false });
	return mobile ? <MobileLayout /> : <DesktopLayout />;
};

export const RootPage = () => {
	return (
		<ThemeProviders>
			<LocalSettingsProviders>
				<RouteProviders>
					<RootLayout />
				</RouteProviders>
			</LocalSettingsProviders>
		</ThemeProviders>
	);
};

export const NoLayoutTopPage = ({ children }) => {
	return (
		<ThemeProviders>
			<LocalSettingsProviders>
				<RouteProviders>{children}</RouteProviders>
			</LocalSettingsProviders>
		</ThemeProviders>
	);
};

export const NoLayoutPage = () => {
	return (
		<ThemeProviders>
			<LocalSettingsProviders>
				<RouteProviders>
					<Outlet />
				</RouteProviders>
			</LocalSettingsProviders>
		</ThemeProviders>
	);
};

export default function App() {
	console.log("App rendered");
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body>
				<div id="root">
					{/* <ReactScan /> */}

					<GlobalStyles />

					<Outlet />
				</div>

				<ScrollRestoration />

				<Scripts />
			</body>
		</html>
	);
}
