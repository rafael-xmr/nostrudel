import { memo, useMemo } from "react";
import ReactCodeMirror from "@uiw/react-codemirror";
import { githubLight, githubDark } from "@uiw/codemirror-theme-github";
import { jsonSchema } from "codemirror-json-schema";
import { keymap } from "@codemirror/view";
import _throttle from "lodash.throttle";
import { jsonLanguage } from "@codemirror/lang-json";

import { NostrFilterSchema } from "./schema";
import { useCodeMirrorUserAutocomplete } from "~/providers/global/user-autocomplete-provider";

const FilterEditor = memo(
	({
		value,
		onChange,
		onRun,
	}: { value: string; onChange: (v: string) => void; onRun: () => void }) => {
		const codeMirrorUserAutocomplete = useCodeMirrorUserAutocomplete();
		const extensions = useMemo(
			() => [
				keymap.of([
					{
						win: "Ctrl-Enter",
						linux: "Ctrl-Enter",
						mac: "Cmd-Enter",
						preventDefault: true,
						run: () => {
							onRun();
							return true;
						},
						shift: () => {
							onRun();
							return true;
						},
					},
				]),
				jsonSchema(NostrFilterSchema),
				jsonLanguage.data.of({
					autocomplete: codeMirrorUserAutocomplete,
				}),
			],
			[onRun],
		);
		return (
			<ReactCodeMirror
				value={value}
				onChange={onChange}
				height="200px"
				lang="json"
				extensions={extensions}
				theme={githubDark}
			/>
		);
	},
);

export default FilterEditor;
