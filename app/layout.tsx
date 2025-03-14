import type { Metadata, Viewport } from "next";
import "../src/styles.css";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/counter.css";

import dynamic from "next/dynamic";

const GlobalProviders = dynamic(() =>
	import("../src/providers/global").then((mod) => mod.GlobalProviders),
);

const ReactScan = dynamic(() => import("./scan").then((mod) => mod.ReactScan));

export const metadata: Metadata = {
	title: "moStard",
	description: "A simple nostr web client focused on exploring nostr",
};

export const viewport: Viewport = {
	themeColor: "#ff6600",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<head>
				<meta property="og:url" content="https://mostard.social" />
				<meta property="og:type" content="website" />
				<meta property="og:title" content="moStard" />
				<meta
					property="og:description"
					content="A simple web based nostr client focused on exploring nostr"
				/>
				<meta
					property="og:image"
					content="https://github.com/rafael-xmr/nostrudel/blob/mostard/public/og_image.jpeg?raw=true"
				/>
				<script src="https://unpkg.com/react-scan/dist/auto.global.js" />
			</head>
			<body>
				<div id="root">
					<ReactScan />
					<GlobalProviders>{children}</GlobalProviders>
				</div>
			</body>
		</html>
	);
}
