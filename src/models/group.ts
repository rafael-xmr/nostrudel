import type { Model } from "applesauce-core";
import type { GroupPointer } from "applesauce-core/helpers";
import { map } from "rxjs";

import { type GroupInfo, parseGroupInfo } from "../helpers/groups";
import type { LoadersManagement } from "~/services/loaders";

/** A model that fetches the groups information from the relay */
export function GroupInfoQuery(
	group: GroupPointer,
	loadersManagement: LoadersManagement,
): Model<GroupInfo> {
	return () =>
		loadersManagement
			.groupInfoLoader({ value: group.id, relays: [group.relay] })
			.pipe(map(parseGroupInfo));
}
