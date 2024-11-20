import { useEffect, useMemo, useState } from "react";
import {
  getCurrentValue,
  useObservable,
  useQueryStore,
} from "applesauce-react/hooks";

import { useReadRelays } from "./use-client-relays";
import replaceableEventsService, {
  type RequestOptions,
} from "../services/replaceable-events";
import {
  type CustomAddressPointer,
  parseCoordinate,
} from "../helpers/nostr/event";
import type { NostrEvent } from "nostr-tools";

export default function useReplaceableEvents(
  coordinates: string[] | CustomAddressPointer[] | undefined,
  additionalRelays?: Iterable<string>,
  opts: RequestOptions = {},
) {
  const readRelays = useReadRelays(additionalRelays);
  const store = useQueryStore();
  const exisitingEvents: NostrEvent[] = [];

  let isEmoji = false;

  const observable = useMemo(async () => {
    if (!coordinates) return undefined;
    const pointers: CustomAddressPointer[] = [];

    for (const cord of coordinates) {
      const parsed = typeof cord === "string" ? parseCoordinate(cord) : cord;
      if (!parsed) return;

      if (parsed.kind === 30030) {
        isEmoji = true;
      }

      pointers.push(parsed);

      const existing = await replaceableEventsService.requestEvent(
        parsed.relays ? [...readRelays, ...parsed.relays] : readRelays,
        parsed.kind,
        parsed.pubkey,
        parsed.identifier,
        opts,
      );

      if (existing) exisitingEvents.push(existing);
    }

    if (isEmoji) {
      console.log("store.replaceableSet", pointers);
    }

    return store.replaceableSet(pointers);
  }, [coordinates, readRelays.urls.join("|"), store]);

  console.log("observable", observable);
  // const map = useObservable(observable);
  // if (isEmoji) {
  //   console.log("map", map);
  // }

  // for (const event of exisitingEvents) {
  //   map?.set(event.id, event);
  // }

  // if (isEmoji) {
  //   console.log("store.events");
  //   for (const event of store.store.database.events.values()) {
  //     if (event.kind === 30030) {
  //       console.log("store.events", event);
  //     }
  //   }
  // }

  return exisitingEvents;
}
