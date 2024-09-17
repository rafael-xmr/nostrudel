import { useMemo } from "react";
import userMetadataService from "../services/user-metadata";
import { useReadRelays } from "./use-client-relays";
import useSubject from "./use-subject";
import type { RequestOptions } from "../services/replaceable-events";
import { COMMON_CONTACT_RELAY } from "../const";

export default function useUserMetadata(
	pubkey?: string,
	additionalRelays: Iterable<string> = [],
	opts: RequestOptions = {},
) {
	const relays = useReadRelays([...additionalRelays, COMMON_CONTACT_RELAY]);

	const subject = pubkey
		? userMetadataService.requestMetadata(pubkey, relays, opts)
		: undefined;
	const metadata = useSubject(subject);

	return metadata;
}
