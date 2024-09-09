import useUserMetadata from "./use-user-metadata";

export default function useUserXMRMetadata(pubkey: string) {
	const userMetadata = useUserMetadata(pubkey);
	let address = userMetadata?.cryptocurrency_addresses?.monero;

	if (!address) {
		const bio = userMetadata?.about || "";
		const match = bio.match(
			/(^|\s)4[0-9a-zA-Z]{94}|8[0-9a-zA-Z]{94}|[0-9a-zA-Z]{106}($|\s)/,
		);
		address = match?.[0];
	}

	return { address };
}
