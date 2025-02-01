import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

export type NativeEmoji = {
	id: string;
	keywords: string[];
	name: string;
	native?: string;
	src?: string;
};

export const defaultCategories = [
	"people",
	"nature",
	"foods",
	"activity",
	"places",
	"objects",
	"symbols",
	"flags",
];

export default function EmojiPicker({
	categories = defaultCategories,
	...props
}: {
	autoFocus?: boolean;
	onEmojiSelect?: (emoji: NativeEmoji) => void;
	custom?: { id: string; name: string; emojis: NativeEmoji[] }[];
	categories?: string[];
}) {
	console.info(props);
	return <Picker data={data} theme={"dark"} {...props} />;
}
