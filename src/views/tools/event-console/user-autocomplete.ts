import type {
	CompletionContext,
	CompletionResult,
} from "@codemirror/autocomplete";
import { syntaxTree } from "@codemirror/language";
import type {
	SearchDirectory,
	UserSearchManagement,
} from "../../../services/username-search";

export function createCodeMirrorUserAutocomplete(
	userSearchManagement: UserSearchManagement,
) {
	let users: SearchDirectory = [];

	// Subscribe to user directory updates
	const subscription = userSearchManagement.userSearchDirectory.subscribe(
		(directory) => {
			users = directory;
		},
	);

	const codeMirrorUserAutocomplete = (
		context: CompletionContext,
	): CompletionResult | null => {
		const nodeBefore = syntaxTree(context.state).resolveInner(context.pos, -1);
		if (nodeBefore.name !== "String") return null;

		const textBefore = context.state.sliceDoc(nodeBefore.from, context.pos);
		const tagBefore = /@\w*$/.exec(textBefore);
		if (!tagBefore && !context.explicit) return null;

		return {
			from: tagBefore ? nodeBefore.from + tagBefore.index : context.pos,
			validFor: /^(@\w*)?$/,
			options: users
				.filter((u) => !!u.names[0])
				.map((user) => ({
					label: "@" + user.names[0]!,
					type: "keyword",
					apply: user.pubkey,
					detail: "pubkey",
				})),
		};
	};

	// Return both the function and cleanup method
	return {
		codeMirrorUserAutocomplete,
		cleanup: () => subscription.unsubscribe(),
	};
}
