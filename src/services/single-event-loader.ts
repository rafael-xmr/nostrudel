import _throttle from "lodash.throttle";
import { SingleEventLoader } from "applesauce-loaders";

import { eventStore } from "./event-store";
import rxNostr from "./rx-nostr";
import { cacheRequest } from "./cache-relay";

const singleEventLoader = new SingleEventLoader(rxNostr, { cacheRequest });

singleEventLoader.subscribe((packet) => eventStore.add(packet.event, packet.from));

if (process.env.NEXT_PUBLIC_DEV) {
  //@ts-expect-error
  window.singleEventLoader = singleEventLoader;
}

export default singleEventLoader;
