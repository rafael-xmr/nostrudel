import { EventFactory } from "applesauce-factory";

import { NIP_89_CLIENT_APP } from "../const";
import type { AccountsManagement } from "./accounts";
import type { RelayHintsManagement } from "./relay-hints";
import type { PreferenceSubject } from "~/classes/preference-subject";

export interface EventFactoryManagement {
	factory: EventFactory;
}

export default function createEventFactoryManagement(
	accountsManagement: AccountsManagement,
	relayHintsManagement: RelayHintsManagement,
	addClientTag: PreferenceSubject<boolean>,
): EventFactoryManagement {
	const { accounts } = accountsManagement;
	const { getEventRelayHint, getPubkeyRelayHint } = relayHintsManagement;

	const factory = new EventFactory({
		signer: accounts.signer,
		getEventRelayHint,
		getPubkeyRelayHint: getPubkeyRelayHint,
		client: addClientTag.value ? NIP_89_CLIENT_APP : undefined,
	});

	// update event factory when settings change
	addClientTag.subscribe((client) => {
		if (client) factory.context.client = NIP_89_CLIENT_APP;
		else factory.context.client = undefined;
	});

	return {
		factory,
	};
}
