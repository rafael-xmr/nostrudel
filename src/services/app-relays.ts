import type { PreferenceSubject } from "~/classes/preference-subject";

export enum RelayMode {
	NONE = 0,
	READ = 1,
	WRITE = 2,
	BOTH = 1 | 2,
}

export interface RelayManagement {
	addAppRelay: (relay: string, mode: RelayMode) => void;
	removeAppRelay: (relay: string, mode: RelayMode) => void;
	toggleAppRelay: (relay: string, mode: RelayMode) => void;
}

export default function createRelayManagement(
	readRelays: PreferenceSubject<string[]>,
	writeRelays: PreferenceSubject<string[]>,
): RelayManagement {
	return {
		addAppRelay: (relay: string, mode: RelayMode) => {
			if (mode & RelayMode.WRITE && !writeRelays.value.includes(relay)) {
				writeRelays.next([...writeRelays.value, relay]);
			}
			if (mode & RelayMode.READ && !readRelays.value.includes(relay)) {
				readRelays.next([...readRelays.value, relay]);
			}
		},

		removeAppRelay: (relay: string, mode: RelayMode) => {
			if (mode & RelayMode.WRITE) {
				writeRelays.next(writeRelays.value.filter((r) => r !== relay));
			}
			if (mode & RelayMode.READ) {
				readRelays.next(readRelays.value.filter((r) => r !== relay));
			}
		},

		toggleAppRelay: (relay: string, mode: RelayMode) => {
			if (mode & RelayMode.WRITE) {
				writeRelays.next(
					writeRelays.value.includes(relay)
						? writeRelays.value.filter((r) => r !== relay)
						: [...writeRelays.value, relay],
				);
			}
			if (mode & RelayMode.READ) {
				readRelays.next(
					readRelays.value.includes(relay)
						? readRelays.value.filter((r) => r !== relay)
						: [...readRelays.value, relay],
				);
			}
		},
	};
}
