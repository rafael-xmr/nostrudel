import _throttle from "lodash.throttle";
import { UserSetsLoader } from "applesauce-loaders";

import { eventStore } from "./event-store";
import rxNostr from "./rx-nostr";
import { cacheRequest } from "./cache-relay";

const userSetsLoader = new UserSetsLoader(rxNostr, { cacheRequest });

userSetsLoader.subscribe((packet) => eventStore.add(packet.event, packet.from));

if (process.env.NEXT_PUBLIC_DEV) {
  //@ts-expect-error
  window.userSetsLoader = userSetsLoader;
}

export default userSetsLoader;
