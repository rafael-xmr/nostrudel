import type { RequestProxyManagement } from "~/helpers/request";

export interface XmlFeedsManagement {
	requestFeed: (url: string | URL, force?: boolean) => Promise<Document>;
}

export default function createXmlFeedsManagement(
	requestProxyManagement: RequestProxyManagement,
): XmlFeedsManagement {
	const parser = new DOMParser();
	const feeds = new Map<string, Document>();

	const loadFeed = async (url: string): Promise<Document> => {
		const str = await requestProxyManagement
			.fetchWithProxy(url)
			.then((res) => res.text());
		return parser.parseFromString(str, "application/xml");
	};

	const requestFeed = async (
		url: string | URL,
		force?: boolean,
	): Promise<Document> => {
		const urlString = String(url);

		if (feeds.has(urlString) && !force) return feeds.get(urlString)!;

		const xml = await loadFeed(urlString);
		feeds.set(urlString, xml);
		return xml;
	};

	return {
		requestFeed,
	};
}
