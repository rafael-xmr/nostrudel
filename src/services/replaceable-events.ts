import type { NostrEvent } from "nostr-tools";
import type { AbstractRelay } from "nostr-tools/abstract-relay";
import _throttle from "lodash.throttle";
import type { EventStore } from "applesauce-core";
import { isFromCache } from "applesauce-core/helpers";

import SuperMap from "../classes/super-map";
import BatchKindPubkeyLoader, {
  createCoordinate,
} from "../classes/batch-kind-pubkey-loader";
import Process from "../classes/process";
import { logger } from "../helpers/debug";
import { localRelay } from "./local-relay";
import relayPoolService from "./relay-pool";
import { alwaysVerify } from "./verify-event";
import { truncateId } from "../helpers/string";
import processManager from "./process-manager";
import UserSquare from "../components/icons/user-square";
import { eventStore } from "./event-store";

export type RequestOptions = {
  /** Always request the event from the relays */
  alwaysRequest?: boolean;
  /** ignore the cache on initial load */
  ignoreCache?: boolean;
};

export function getHumanReadableCoordinate(
  kind: number,
  pubkey: string,
  d?: string,
) {
  return `${kind}:${truncateId(pubkey)}${d ? ":" + d : ""}`;
}

class ReplaceableEventsService {
  store: EventStore;
  process: Process;

  cacheLoader: BatchKindPubkeyLoader | null = null;
  loaders = new SuperMap<AbstractRelay, BatchKindPubkeyLoader>((relay) => {
    const loader = new BatchKindPubkeyLoader(
      this.store,
      relay,
      this.log.extend(relay.url),
    );
    this.process.addChild(loader.process);
    return loader;
  });

  log = logger.extend("ReplaceableEventLoader");

  constructor(store: EventStore) {
    this.store = store;
    this.process = new Process("ReplaceableEventsService", this);
    this.process.icon = UserSquare;
    this.process.active = true;
    processManager.registerProcess(this.process);

    if (localRelay) {
      this.cacheLoader = new BatchKindPubkeyLoader(
        this.store,
        localRelay as AbstractRelay,
        this.log.extend("cache-relay"),
      );
      this.process.addChild(this.cacheLoader.process);
    }
  }

  handleEvent(event: NostrEvent, fromCache = false) {
    // TODO: move this to the cache relay class
    if (!fromCache && !alwaysVerify(event)) return;

    const storeEvent = this.store.update(event);
    if (event.kind === 30030) {
      console.log("storeEvent", storeEvent);
    }
    if (!isFromCache(storeEvent)) localRelay?.publish(storeEvent);
  }

  /** @deprecated use eventStore.getReplaceable instead */
  getEvent(kind: number, pubkey: string, d?: string) {
    return this.store.getReplaceable(kind, pubkey, d);
  }

  private async requestEventFromRelays(
    urls: Iterable<string | URL | AbstractRelay>,
    kind: number,
    pubkey: string,
    d?: string,
  ) {
    const cord = createCoordinate(kind, pubkey, d);
    const relays = relayPoolService.getRelays(urls);

    for (const relay of relays) {
      const event = await this.loaders.get(relay).requestEvent(kind, pubkey, d);

      if (event) {
        if (kind === 30030) {
          console.log("event", cord, event);
        }

        this.handleEvent(event);
      }
    }
  }

  async requestEvent(
    urls: Iterable<string | URL | AbstractRelay>,
    kind: number,
    pubkey: string,
    d?: string,
    opts: RequestOptions = {},
  ) {
    const relays = relayPoolService.getRelays(urls);
    const existing = this.store.getReplaceable(kind, pubkey, d);

    if (kind === 30030) {
      console.log("existing", existing);
    }

    if (
      opts?.alwaysRequest ||
      !this.cacheLoader ||
      (!existing && opts.ignoreCache)
    ) {
      return this.requestEventFromRelays(relays, kind, pubkey, d);
    }

    if (existing) {
      return existing;
    }

    if (this.cacheLoader) {
      return this.cacheLoader.requestEvent(kind, pubkey, d).then((event) => {
        if (kind === 30030) {
          console.log("loaded", event);
          console.log("store", this.store.hasReplaceable(kind, pubkey, d));
        }

        if (event) {
          this.handleEvent(event, true);
          console.log("returning", event);
          return event;
        }

        if (!this.store.hasReplaceable(kind, pubkey, d)) {
          return this.requestEventFromRelays(relays, kind, pubkey, d);
        }
      });
    }
  }

  destroy() {
    processManager.unregisterProcess(this.process);
  }
}

const replaceableEventsService = new ReplaceableEventsService(eventStore);

if (import.meta.env.DEV) {
  //@ts-ignore
  window.replaceableEventsService = replaceableEventsService;
}

export default replaceableEventsService;
