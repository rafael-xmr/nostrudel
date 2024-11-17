export const XMR_REGEX =
	/(^|\s)(4[0-9a-zA-Z]{94}|8[0-9a-zA-Z]{94}|[0-9a-zA-Z]{106})($|\s)/g;

export function isXMR(xmr: string) {
	return XMR_REGEX.test(xmr);
}

export function getXMR(text: string) {
	const match = text.match(XMR_REGEX);
	return match?.[0];
}

export function getXMREndpoint(address: string) {
	return `monero:${address}`;
}
