import {
	BehaviorSubject,
	filter,
	type Observable,
	startWith,
	interval,
	type Subscription,
} from "rxjs";
import type { Debugger } from "debug";

import type { PreferenceSubject } from "~/classes/preference-subject";
import { logger } from "~/helpers/debug";
import type { SocialGraphManagement } from "~/services/social-graph";

// Cron task types
export class CronTask {
	log: Debugger;
	interval = new BehaviorSubject<number>(0);
	lastRun = new BehaviorSubject<number>(0);

	running = new BehaviorSubject<boolean>(false);
	status = new BehaviorSubject<string>("");
	private timer: Subscription | null = null;
	private active: Subscription | null = null;

	constructor(
		private readonly name: string,
		private readonly task: () => Observable<string>,
	) {
		this.log = logger.extend(`Task:${name}`);
	}

	// Run the cron task
	run() {
		if (this.running.value) return;

		this.log(`Running task ${this.name}`);
		this.lastRun.next(Date.now());
		this.running.next(true);

		this.active = this.task().subscribe({
			next: (status) => this.status.next(status),
			complete: () => {
				this.running.next(false);
				this.lastRun.next(Date.now());
				this.log(`Task ${this.name} completed`);
			},
		});
	}

	cancel() {
		this.log(`Cancelling task ${this.name}`);
		this.running.next(false);
		this.active?.unsubscribe();
		this.active = null;
	}

	// Start the cron task
	start() {
		this.timer = interval(60_000)
			.pipe(
				startWith(0),
				filter(() => {
					const now = Date.now();
					const interval = this.interval.value;
					const lastRun = this.lastRun.value;

					if (now - lastRun < interval) return false;
					return true;
				}),
			)
			.subscribe(() => this.run());
	}

	// Stop the cron task
	stop() {
		this.timer?.unsubscribe();
	}
}

// Cron task management interface
export interface CronTaskManagement {
	updateSocialGraphCron: CronTask;
	tasks: Map<string, CronTask>;
	registerTask: (name: string, task: CronTask) => void;
	unregisterTask: (name: string) => void;
	startAllTasks: () => void;
	stopAllTasks: () => void;
}

export default function createCronTaskManagement(
	socialGraphManagement: SocialGraphManagement,
	updateSocialGraphDistance: PreferenceSubject<number>,
	updateSocialGraphInterval: PreferenceSubject<number>,
	lastUpdatedSocialGraph: PreferenceSubject<number>,
): CronTaskManagement {
	const { socialGraph$, updateSocialGraph } = socialGraphManagement;
	const tasks = new Map<string, CronTask>();

	// Create the social graph update cron task
	const updateSocialGraphCron = new CronTask("update-social-graph", () =>
		updateSocialGraph(updateSocialGraphDistance.value),
	);

	// Connect the preferences to the cron task
	updateSocialGraphCron.interval = updateSocialGraphInterval;
	updateSocialGraphCron.lastRun = lastUpdatedSocialGraph;

	// Register the task
	tasks.set("update-social-graph", updateSocialGraphCron);

	// Start the social graph task
	updateSocialGraphCron.start();

	// Trigger an update if there are no users in the 2nd degree
	if (socialGraph$.value.getUsersByFollowDistance(2).size === 0) {
		updateSocialGraphCron.run();
	}

	const registerTask = (name: string, task: CronTask) => {
		tasks.set(name, task);
	};

	const unregisterTask = (name: string) => {
		const task = tasks.get(name);
		if (task) {
			task.stop();
			tasks.delete(name);
		}
	};

	const startAllTasks = () => {
		for (const task of tasks.values()) {
			task.start();
		}
	};

	const stopAllTasks = () => {
		for (const task of tasks.values()) {
			task.stop();
		}
	};

	return {
		updateSocialGraphCron,
		tasks,
		registerTask,
		unregisterTask,
		startAllTasks,
		stopAllTasks,
	};
}
