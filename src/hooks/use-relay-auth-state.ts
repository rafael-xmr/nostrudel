import { useObservable } from "applesauce-react/hooks";
import { RelayAuthState } from "../services/authentication-signer";

export default function useRelayAuthState(relay: string): RelayAuthState | undefined {
  const states = useObservable(window.authenticationSigner.relayState$);
  return states[relay];
}
