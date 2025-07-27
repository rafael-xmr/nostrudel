import type { Model } from "applesauce-core";
import type { ChannelMetadataContent } from "applesauce-core/helpers";
import { ChannelMetadataModel } from "applesauce-core/models";
import { defer, ignoreElements, mergeWith } from "rxjs";
import type { NostrEvent } from "nostr-tools";
import type { LoadersManagement } from "~/services/loaders";

export function ChannelMetadataQuery(
	channel: NostrEvent,
	loadersManagement: LoadersManagement,
	relays?: string[],
): Model<ChannelMetadataContent | undefined> {
	return (events) =>
		defer(() =>
			loadersManagement.channelMetadataLoader({ value: channel.id, relays }),
		).pipe(
			ignoreElements(),
			mergeWith(events.model(ChannelMetadataModel, channel)),
		);
}
