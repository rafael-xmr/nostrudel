/** @type {import('@remix-run/dev').AppConfig} */
export default {
	ignoredRouteFiles: ["**/.*"],
	serverModuleFormat: "esm",
	serverPlatform: "node",
	tailwind: true,
	postcss: true,
	watchPaths: ["./tailwind.config.ts"],
	devServerBroadcastDelay: 1000,
	future: {
		v3_fetcherPersist: true,
		v3_lazyRouteDiscovery: true,
		v3_relativeSplatPath: true,
		v3_singleFetch: true,
		v3_throwAbortReason: true,
	},
};
