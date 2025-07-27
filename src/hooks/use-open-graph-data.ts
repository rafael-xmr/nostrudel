import * as reactUse from "react-use";
import { useLocalSettings } from "~/providers/global/preferences";
import type { OgObjectInteral } from "../lib/open-graph-scraper/types";
import useAppSettings from "./use-user-app-settings";

const pageExtensions = [".html", ".php", "htm"];

const openGraphDataCache = new Map<string, OgObjectInteral>();

export default function useOpenGraphData(url: URL) {
	const { loadOpenGraphData } = useAppSettings();
	const { requestProxyManagement } = useLocalSettings();

	return reactUse.useAsync(async () => {
		if (!loadOpenGraphData) return null;

		const { default: extractMetaTags } = await import(
			"../lib/open-graph-scraper/extract"
		);

		if (openGraphDataCache.has(url.toString()))
			return openGraphDataCache.get(url.toString());

		const ext = url.pathname.match(/\.[\w+d]+$/)?.[0];
		if (ext && !pageExtensions.includes(ext)) return null;

		try {
			const controller = new AbortController();
			const res = await requestProxyManagement.fetchWithProxy(url, {
				signal: controller.signal,
			});
			const contentType = res.headers.get("content-type");

			if (contentType?.includes("text/html")) {
				const html = await res.text();
				const data = extractMetaTags(html);
				openGraphDataCache.set(url.toString(), data);
				return data;
			} else controller.abort();
		} catch (e) {}
		return null;
	}, [url.toString(), requestProxyManagement]);
}
