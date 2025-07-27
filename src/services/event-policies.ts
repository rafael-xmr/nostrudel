import type { NostrEvent } from "nostr-social-graph";
import type { SocialGraphManagement } from "./social-graph";
import type { PreferenceSubject } from "~/classes/preference-subject";

export interface ContentFilterManagement {
	shouldHideEvent: (event: NostrEvent) => boolean;
	shouldBlurMedia: (event: NostrEvent) => boolean;
	shouldHideEmbed: (event: NostrEvent) => boolean;
}

export default function createContentFilterManagement(
	socialGraphManagement: SocialGraphManagement,
	hideEventsOutsideSocialGraph: PreferenceSubject<number | null>,
	blurMediaOutsideSocialGraph: PreferenceSubject<number | null>,
	hideEmbedsOutsideSocialGraph: PreferenceSubject<number | null>,
): ContentFilterManagement {
	const { socialGraph$ } = socialGraphManagement;

	/** Checks if an event should be hidden based on the social graph distance */
	const shouldHideEvent = (event: NostrEvent) => {
		const graph = socialGraph$.value;
		const distance = graph.getFollowDistance(event.pubkey);
		if (
			hideEventsOutsideSocialGraph.value !== null &&
			distance > hideEventsOutsideSocialGraph.value
		)
			return true;

		return false;
	};

	/** Checks if media should be blurred based on the social graph distance */
	const shouldBlurMedia = (event: NostrEvent) => {
		const graph = socialGraph$.value;
		const distance = graph.getFollowDistance(event.pubkey);
		if (
			blurMediaOutsideSocialGraph.value !== null &&
			distance > blurMediaOutsideSocialGraph.value
		)
			return true;

		return false;
	};

	/** Checks if embeds should be hidden based on the social graph distance */
	const shouldHideEmbed = (event: NostrEvent) => {
		const graph = socialGraph$.value;
		const distance = graph.getFollowDistance(event.pubkey);
		if (
			hideEmbedsOutsideSocialGraph.value !== null &&
			distance > hideEmbedsOutsideSocialGraph.value
		)
			return true;

		return false;
	};

	return {
		shouldHideEvent,
		shouldBlurMedia,
		shouldHideEmbed,
	};
}
