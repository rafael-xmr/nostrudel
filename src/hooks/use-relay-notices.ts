import { useObservable } from "applesauce-react/hooks";
import { notices$ } from "~/providers/global/rx-nostr-provider";

export default function useRelayNotices(relay: string) {
	return useObservable(notices$).filter((n) => n.from === relay);
}
