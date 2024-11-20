import { getXMR } from "../helpers/monero";
import useUserMetadata from "./use-user-metadata";

export default function useUserXMRMetadata(pubkey: string) {
	const userMetadata = useUserMetadata(pubkey);
	let address = userMetadata?.cryptocurrency_addresses?.monero;

	if (!address) {
		const bio = userMetadata?.about || "";
		address = getXMR(bio);
	}

	return { address };
}
