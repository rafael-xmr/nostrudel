import { kinds } from "nostr-tools";

import { cacheRequest } from "./cache-relay";
import { TagValueLoader } from "applesauce-loaders";
import { eventStore } from "./event-store";

const channelMetadataLoader = new TagValueLoader(window.rxNostr, "e", {
  name: "channel-metadata",
  kinds: [kinds.ChannelMetadata],
  cacheRequest,
});

// start the loader and send all events to the event store
channelMetadataLoader.subscribe((packet) => {
  eventStore.add(packet.event, packet.from);
});

export default channelMetadataLoader;
