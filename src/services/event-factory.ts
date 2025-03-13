import { EventFactory } from "applesauce-factory";

import { getEventRelayHint, getPubkeyRelayHint } from "./relay-hints";
import { NIP_89_CLIENT_APP } from "../const";
import accounts from "./accounts";

const factory = new EventFactory({
	signer: accounts.signer,
	getEventRelayHint,
	getPubkeyRelayHint: getPubkeyRelayHint,
	client: NIP_89_CLIENT_APP,
});

export default factory;
