import type { NostrEvent } from "nostr-tools";
import React, {
	type PropsWithChildren,
	useContext,
	useMemo,
	useState,
} from "react";
import { useLocalSettings } from "~/providers/global/preferences";

export type TContentSettings = {
	blurMedia: boolean;
	hideEmbeds: boolean;
	setOverride: (override: Partial<TContentSettings>) => void;
};

const ContentSettings = React.createContext<TContentSettings>({
	blurMedia: false,
	hideEmbeds: false,
	setOverride: () => {},
});

export function useContentSettings() {
	return useContext(ContentSettings);
}

export function ContentSettingsProvider({
	children,
	event,
	blurMedia,
	hideEmbeds,
}: PropsWithChildren & {
	event?: NostrEvent;
	blurMedia?: boolean;
	hideEmbeds?: boolean;
}) {
	const [override, setOverride] = useState<Partial<TContentSettings>>();
	const parent = useContext(ContentSettings);
	const { contentFilterManagement } = useLocalSettings();

	const context = useMemo(() => {
		const ctx: TContentSettings = Object.create(parent);

		// Blur media if the event does not pass the media policy
		if (blurMedia !== undefined) ctx.blurMedia = blurMedia;
		else if (event)
			ctx.blurMedia = contentFilterManagement.shouldBlurMedia(event);

		// Hide embeds if the event does not pass the embeds policy
		if (hideEmbeds !== undefined) ctx.hideEmbeds = hideEmbeds;
		else if (event)
			ctx.hideEmbeds = contentFilterManagement.shouldHideEmbed(event);

		// Set an local overrides
		if (override) Object.assign(ctx, override);

		// Pass the override method to the context
		ctx.setOverride = setOverride;

		return ctx;
	}, [
		parent,
		blurMedia,
		hideEmbeds,
		override,
		setOverride,
		event,
		contentFilterManagement,
	]);

	return (
		<ContentSettings.Provider value={context}>
			{children}
		</ContentSettings.Provider>
	);
}
