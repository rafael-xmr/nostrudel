import { useObservable } from "applesauce-react/hooks";
import {
	type RelayAuthState,
	useAuthenticationSigner,
} from "~/providers/global/authentication-signer-provider";

export default function useRelayAuthState(
	relay: string,
): RelayAuthState | undefined {
	const authenticationSigner = useAuthenticationSigner();
	const states = useObservable(authenticationSigner?.relayState$);
	return states[relay];
}
