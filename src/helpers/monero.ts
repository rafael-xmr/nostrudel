export function isXMR(xmr: string) {
	const regex = /^4[0-9a-zA-Z]{94}$|^8[0-9a-zA-Z]{94}$|^[0-9a-zA-Z]{106}$/;
	return regex.test(xmr);
}

export function getXMREndpoint(address: string) {
	return `monero:${address}`;
}
