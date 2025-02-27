import type { Transformer } from "unified";
import { type Root, findAndReplace, type Node } from "applesauce-content/nast";

import { XMR_REGEX } from "~/helpers/monero";

export interface MoneroAddressToken extends Node {
	type: "monero";
	address: string;
	name: string;
	value: string;
}

declare module "applesauce-content/nast" {
	export interface MoneroAddressToken extends Node {
		type: "monero";
		address: string;
		name: string;
		value: string;
	}

	export interface ContentMap {
		monero: MoneroAddressToken;
	}
}

export function moneroAddressLinks(): Transformer<Root> {
	return (tree) => {
		findAndReplace(tree, [
			[
				XMR_REGEX,
				(match: string, _) => {
					try {
						const address = match.replace(/\s/g, "").replace(/\n/g, "");
						return {
							type: "monero",
							address: address,
							value: address,
							name: "Monero Address",
						};
					} catch (error) {}

					return false;
				},
			],
		]);
	};
}
