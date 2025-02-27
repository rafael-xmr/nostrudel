import { BehaviorSubject, combineLatest } from "rxjs";
import { EventFactory } from "applesauce-factory";
import { map } from "rxjs/operators";

import { getEventRelayHint, getPubkeyRelayHint } from "./relay-hints";
import { NIP_89_CLIENT_APP } from "../const";
import accounts from "./accounts";

const factory$ = new BehaviorSubject<EventFactory>(
	new EventFactory({
		signer: accounts.active ?? undefined,
		getEventRelayHint,
		getPubkeyRelayHint: getPubkeyRelayHint,
		client: NIP_89_CLIENT_APP,
	}),
);

// update event factory when settings change
combineLatest([accounts.active$]).pipe(
	map(([current]) => {
		return new EventFactory({
			signer: current ? current.signer : undefined,
			getEventRelayHint,
			getPubkeyRelayHint: getPubkeyRelayHint,
			client: NIP_89_CLIENT_APP,
		});
	}),
);

export default factory$;
