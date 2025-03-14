import { EventFactory } from "applesauce-factory";

import { getEventRelayHint, getPubkeyRelayHint } from "./relay-hints";
import { NIP_89_CLIENT_APP } from "../const";

const factory = new EventFactory({
	signer: window.accounts?.signer,
	getEventRelayHint,
	getPubkeyRelayHint: getPubkeyRelayHint,
	client: NIP_89_CLIENT_APP,
});

export default factory;
