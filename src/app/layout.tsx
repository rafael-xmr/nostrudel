import type { Metadata, Viewport } from "next";
import "../styles.css";

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

				<script>
					window.CACHE_RELAY_ENABLED = false; window.IMAGE_PROXY_PATH = "";
					window.REQUEST_PROXY = ""; window.PROXY_FIRST = false;
				</script>
			</head>
			<body>
				<div id="root">{children}</div>
			</body>
		</html>
	);
}
