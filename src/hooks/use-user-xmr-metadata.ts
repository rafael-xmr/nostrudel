import { getXMR, XMR_REGEX } from "../helpers/monero";
import useUserProfile from "./use-user-profile";

export default function useUserXMRMetadata(pubkey: string) {
	const userMetadata = useUserProfile(pubkey);

	const metadataAddress = userMetadata?.cryptocurrency_addresses?.monero;
	// Always match the REGEX, the address could be there but could be wrong
	// or could be testnet, etc
	const addressMatch = metadataAddress?.match(XMR_REGEX);

	let address = addressMatch?.[0];

	if (!address) {
		const bio = userMetadata?.about || "";
		address = getXMR(bio);
	}

	return { address };
}
