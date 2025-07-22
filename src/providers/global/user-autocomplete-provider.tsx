import { createContext, type PropsWithChildren, useContext } from "react";
import _throttle from "lodash.throttle";
import type {
	CompletionContext,
	CompletionResult,
} from "@codemirror/autocomplete";
import { syntaxTree } from "@codemirror/language";
import { useUserSearchDirectory } from "./username-search-provider";

const CodeMirrorUserAutocompleteContext = createContext<
	(arg0: CompletionContext) => CompletionResult | null
>(() => null);

export function useCodeMirrorUserAutocomplete() {
	return useContext(CodeMirrorUserAutocompleteContext);
}

export default function CodeMirrorUserAutocompleteProvider({
	children,
}: PropsWithChildren) {
	const userSearchDirectory = useUserSearchDirectory();

	let users: any[] = [];

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
					label: `@${user.names[0]!}`,
					type: "keyword",
					apply: user.pubkey,
					detail: "pubkey",
				})),
		};
	};

	userSearchDirectory.subscribe((directory: any) => {
		users = directory;
	});

	return (
		<CodeMirrorUserAutocompleteContext.Provider
			value={codeMirrorUserAutocomplete}
		>
			{children}
		</CodeMirrorUserAutocompleteContext.Provider>
	);
}
