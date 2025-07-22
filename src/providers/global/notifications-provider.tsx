import {
	createContext,
	type PropsWithChildren,
	useContext,
	useMemo,
} from "react";
import {
	COMMENT_KIND,
	getEventPointerFromETag,
	getEventPointerFromQTag,
	type Mutes,
	processTags,
} from "applesauce-core/helpers";
import {
	combineLatest,
	filter,
	map,
	type Observable,
	of,
	ReplaySubject,
	share,
	switchMap,
	tap,
	throttleTime,
	timer,
} from "rxjs";
import { TimelineQuery } from "applesauce-core/queries";
import { getContentPointers } from "applesauce-factory/helpers";
import { kinds, nip18, nip25, type NostrEvent } from "nostr-tools";
import { useAccountManagerProvider } from "./accounts-provider";
import { useSingleEventLoader } from "./single-event-loader-provider";
import { TORRENT_COMMENT_KIND } from "~/helpers/nostr/torrents";
import { getThreadReferences, isReply, isRepost } from "~/helpers/nostr/event";
import { getPubkeysMentionedInContent } from "~/helpers/nostr/post";
import type { IEventStore } from "applesauce-core";
import { useEventStore, useQueryStore } from "applesauce-react/hooks";
import localSettings from "~/services/preferences";

export const NotificationTypeSymbol = Symbol("notificationType");

export enum NotificationType {
	Reply = "reply",
	Repost = "repost",
	Zap = "zap",
	Reaction = "reaction",
	Mention = "mention",
	Message = "message",
	Quote = "quote",
}
export type CategorizedEvent = NostrEvent & {
	[NotificationTypeSymbol]?: NotificationType;
};

const NotificationsContext = createContext<Observable<CategorizedEvent[]>>(
	of([]),
);

export function useNotifications() {
	return useContext(NotificationsContext);
}

function categorizeEvent(event: NostrEvent, pubkey?: string): CategorizedEvent {
	const e = event as CategorizedEvent;

	if (e[NotificationTypeSymbol]) return e;

	if (event.kind === kinds.Zap) {
		e[NotificationTypeSymbol] = NotificationType.Zap;
	} else if (event.kind === kinds.Reaction) {
		e[NotificationTypeSymbol] = NotificationType.Reaction;
	} else if (isRepost(event)) {
		e[NotificationTypeSymbol] = NotificationType.Repost;
	} else if (event.kind === kinds.EncryptedDirectMessage) {
		e[NotificationTypeSymbol] = NotificationType.Message;
	} else if (
		event.kind === kinds.ShortTextNote ||
		event.kind === TORRENT_COMMENT_KIND ||
		event.kind === kinds.LiveChatMessage ||
		event.kind === kinds.LongFormArticle
	) {
		const isMentioned = pubkey
			? getPubkeysMentionedInContent(event.content, true).includes(pubkey)
			: false;
		const isQuote =
			event.tags.some(
				(t) => t[0] === "q" && (t[1] === event.id || t[3] === pubkey),
			) ||
			getContentPointers(event.content).some(
				(p) =>
					(p.type === "nevent" && p.data.id === event.id) ||
					(p.type === "note" && p.data === event.id),
			);

		if (isMentioned) e[NotificationTypeSymbol] = NotificationType.Mention;
		else if (isQuote) e[NotificationTypeSymbol] = NotificationType.Quote;
		else if (isReply(event)) e[NotificationTypeSymbol] = NotificationType.Reply;
	}
	return e;
}

function filterEvents(
	eventStore: IEventStore,
	events: CategorizedEvent[],
	pubkey: string,
	mute?: Mutes,
): CategorizedEvent[] {
	return events.filter((event) => {
		if (mute?.pubkeys.has(event.pubkey)) return false;

		if (event.pubkey === pubkey) return false;

		const e = event as CategorizedEvent;

		switch (e[NotificationTypeSymbol]) {
			case NotificationType.Reply: {
				const refs = getThreadReferences(e);
				if (!refs.reply?.e?.id) return false;
				if (refs.reply?.e?.author && refs.reply?.e?.author !== pubkey)
					return false;
				const parent = eventStore.getEvent(refs.reply.e.id);
				if (parent?.pubkey !== pubkey) return false;
				break;
			}
			case NotificationType.Mention:
				break;
			case NotificationType.Repost: {
				const pointer = nip18.getRepostedEventPointer(e);
				if (pointer?.author !== pubkey) return false;
				break;
			}
			case NotificationType.Reaction: {
				const pointer = nip25.getReactedEventPointer(e);
				if (!pointer) return false;
				if (pointer.author !== pubkey) return false;
				if (pointer.kind === kinds.EncryptedDirectMessage) return false;
				const parent = eventStore.getEvent(pointer.id);
				if (parent && parent.kind === kinds.EncryptedDirectMessage)
					return false;
				break;
			}
		}

		return true;
	});
}

async function handleTextNote(event: NostrEvent, singleEventLoader: any) {
	const quotes = processTags(
		event.tags,
		(t) => (t[0] === "q" ? t : undefined),
		getEventPointerFromQTag,
	);
	for (const pointer of quotes) {
		singleEventLoader.next({
			id: pointer.id,
			relays: [...localSettings.readRelays.value, ...(pointer.relays ?? [])],
		});
	}

	const pointers = processTags(
		event.tags,
		(t) => (t[0] === "e" || t[0] === "E" ? t : undefined),
		getEventPointerFromETag,
	);
	for (const pointer of pointers) {
		singleEventLoader.next({
			id: pointer.id,
			relays: [...localSettings.readRelays.value, ...(pointer.relays ?? [])],
		});
	}
}

async function handleShare(event: NostrEvent, singleEventLoader: any) {
	const pointers = processTags(
		event.tags,
		(t) => (t[0] === "e" ? t : undefined),
		getEventPointerFromETag,
	);
	for (const pointer of pointers) {
		singleEventLoader.next({
			id: pointer.id,
			relays: [...localSettings.readRelays.value, ...(pointer.relays ?? [])],
		});
	}
}

export default function NotificationsProvider({ children }: PropsWithChildren) {
	const { accountManager } = useAccountManagerProvider();
	const singleEventLoader = useSingleEventLoader();

	const queryStore = useQueryStore();
	const eventStore = queryStore.store;

	const notifications$ = useMemo(() => {
		if (!accountManager) return of([]);

		return combineLatest([accountManager.active$]).pipe(
			switchMap(([account]) => {
				if (!account) return of([]);

				const timeline$ = queryStore
					.createQuery(TimelineQuery, {
						"#p": [account.pubkey],
						kinds: [
							kinds.ShortTextNote,
							kinds.Repost,
							kinds.GenericRepost,
							kinds.Reaction,
							kinds.Zap,
							TORRENT_COMMENT_KIND,
							kinds.LongFormArticle,
							kinds.EncryptedDirectMessage,
							COMMENT_KIND,
						],
					})
					.pipe(
						filter((t) => t !== undefined),
						throttleTime(1000 / 30),
						tap((timeline) => {
							if (!singleEventLoader) return;
							for (const event of timeline) {
								switch (event.kind) {
									case kinds.ShortTextNote:
										handleTextNote(event, singleEventLoader);
										break;
									case kinds.Report:
									case kinds.GenericRepost:
										handleShare(event, singleEventLoader);
										break;
								}
							}
						}),
						map((timeline) =>
							timeline.map((e) => categorizeEvent(e, account.pubkey)),
						),
					);

				// const mute$ = queryStore.createQuery(MuteQuery, account.pubkey);

				// return combineLatest([timeline$, mute$]).pipe(
				// 	map(([timeline, mutes]) =>
				// 		filterEvents(eventStore, timeline, account.pubkey, mutes),
				// 	),
				// );
			}),
			share({
				connector: () => new ReplaySubject(1),
				resetOnComplete: () => timer(5 * 60_000),
			}),
		);
	}, [accountManager, singleEventLoader]);

	return (
		<NotificationsContext.Provider value={notifications$}>
			{children}
		</NotificationsContext.Provider>
	);
}
