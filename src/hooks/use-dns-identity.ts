import { useAsync } from "react-use";
import { parseNIP05Address } from "applesauce-core/helpers";

import SuperMap from "../classes/super-map";
import { useDnsIdentityProvider } from "~/providers/global/dns-identity-provider";

const parseCache = new SuperMap<
	string,
	{ name: string; domain: string } | null
>(parseNIP05Address);

export default function useDnsIdentity(address: string | undefined) {
	const dnsIdentityLoader = useDnsIdentityProvider();
	const parsed = address ? parseCache.get(address) : null;
	const { value: identity } = useAsync(async () => {
		if (parsed)
			return await dnsIdentityLoader?.requestIdentity(
				parsed.name,
				parsed.domain,
			);
	}, [parsed?.name, parsed?.domain]);

	return identity;
}
