import { log } from "../utils.js";
import { addComplexityToTask } from "../utils.js";

/**
 * Return the next work item with improved priority logic:
 *   1. Priority: Return any IN-PROGRESS task (top-level or subtask) to continue current work
 *   2. Eligible subtasks of in-progress parents (pending subtasks ready to start)
 *   3. New top-level tasks ready to start (dependencies satisfied, including in-progress deps)
 *   4. Any remaining pending tasks (fallback)
 *
 * The algorithm prioritizes continuing existing work over starting new work,
 * and allows more flexible dependency checking (in-progress dependencies are considered satisfied).
 *
 * Returns an object with:
 *  ─ id            →  number  (task)  or  "parentId.subId"  (subtask)
 *  ─ title         →  string
 *  ─ status        →  string
 *  ─ priority      →  string  ("high" | "medium" | "low")
 *  ─ dependencies  →  array   (all IDs expressed in the same dotted form)
 *  ─ parentId      →  number  (present only when it's a subtask)
 *
 * @param {Object[]} tasks  – full array of top-level tasks, each may contain .subtasks[]
 * @param {Object} [complexityReport=null] - Optional complexity report object
 * @returns {Object|null}   – next work item or null if nothing is eligible
 */
function findNextTask(tasks, complexityReport = null) {
	// ---------- helpers ----------------------------------------------------
	const priorityValues = { high: 3, medium: 2, low: 1 };

	const toFullSubId = (parentId, maybeDotId) => {
		//  "12.3"  ->  "12.3"
		//        4 ->  "12.4"   (numeric / short form)
		if (typeof maybeDotId === "string" && maybeDotId.includes(".")) {
			return maybeDotId;
		}
		return `${parentId}.${maybeDotId}`;
	};

	// ---------- build completed-ID set (tasks *and* subtasks) --------------
	const completedIds = new Set();
	for (const t of tasks) {
		if (t.status === "done" || t.status === "completed") {
			completedIds.add(String(t.id));
		}
		if (Array.isArray(t.subtasks)) {
			for (const st of t.subtasks) {
				if (st.status === "done" || st.status === "completed") {
					completedIds.add(`${t.id}.${st.id}`);
				}
			}
		}
	}

	// ---------- 1) Priority: Return in-progress tasks (including top-level) ------------------------------
	const inProgressTasks = [];

	// Collect in-progress top-level tasks
	for (const task of tasks) {
		if (task.status === "in-progress") {
			inProgressTasks.push({
				id: task.id,
				title: task.title,
				status: task.status,
				priority: task.priority || "medium",
				dependencies: task.dependencies || [],
				parentId: null,
			});
		}
		// Collect in-progress subtasks
		if (Array.isArray(task.subtasks)) {
			for (const st of task.subtasks) {
				if (st.status === "in-progress") {
					inProgressTasks.push({
						id: `${task.id}.${st.id}`,
						title: st.title || `Subtask ${st.id}`,
						status: st.status,
						priority: st.priority || task.priority || "medium",
						dependencies: st.dependencies?.map((d) => toFullSubId(task.id, d)) ?? [],
						parentId: task.id,
					});
				}
			}
		}
	}

	if (inProgressTasks.length > 0) {
		// Sort by priority → dep-count → id
		inProgressTasks.sort((a, b) => {
			const pa = priorityValues[a.priority] ?? 2;
			const pb = priorityValues[b.priority] ?? 2;
			if (pb !== pa) return pb - pa;

			if (a.dependencies.length !== b.dependencies.length)
				return a.dependencies.length - b.dependencies.length;

			// For subtasks, compare parent then sub-id; for top-level, just id
			if (a.id.includes(".") && b.id.includes(".")) {
				const [aPar, aSub] = a.id.split(".").map(Number);
				const [bPar, bSub] = b.id.split(".").map(Number);
				if (aPar !== bPar) return aPar - bPar;
				return aSub - bSub;
			}
			return a.id - b.id;
		});

		const nextTask = inProgressTasks[0];

		// Add complexity to the task before returning
		if (nextTask && complexityReport) {
			addComplexityToTask(nextTask, complexityReport);
		}

		return nextTask;
	}

	// ---------- 2) look for eligible subtasks of in-progress parents ------------------------------
	const candidateSubtasks = [];

	for (const parent of tasks.filter(
		(t) => t.status === "in-progress" && Array.isArray(t.subtasks),
	)) {
		for (const st of parent.subtasks) {
			const stStatus = (st.status || "pending").toLowerCase();
			if (stStatus !== "pending") continue; // Only pending subtasks of in-progress parents

			const fullDeps =
				st.dependencies?.map((d) => toFullSubId(parent.id, d)) ?? [];

			const depsSatisfied =
				fullDeps.length === 0 ||
				fullDeps.every((depId) => completedIds.has(String(depId)));

			if (depsSatisfied) {
				candidateSubtasks.push({
					id: `${parent.id}.${st.id}`,
					title: st.title || `Subtask ${st.id}`,
					status: st.status || "pending",
					priority: st.priority || parent.priority || "medium",
					dependencies: fullDeps,
					parentId: parent.id,
				});
			}
		}
	}

	if (candidateSubtasks.length > 0) {
		// sort by priority → dep-count → parent-id → sub-id
		candidateSubtasks.sort((a, b) => {
			const pa = priorityValues[a.priority] ?? 2;
			const pb = priorityValues[b.priority] ?? 2;
			if (pb !== pa) return pb - pa;

			if (a.dependencies.length !== b.dependencies.length)
				return a.dependencies.length - b.dependencies.length;

			// compare parent then sub-id numerically
			const [aPar, aSub] = a.id.split(".").map(Number);
			const [bPar, bSub] = b.id.split(".").map(Number);
			if (aPar !== bPar) return aPar - bPar;
			return aSub - bSub;
		});
		const nextTask = candidateSubtasks[0];

		// Add complexity to the task before returning
		if (nextTask && complexityReport) {
			addComplexityToTask(nextTask, complexityReport);
		}

		return nextTask;
	}

	// ---------- 3) fall back to top-level tasks (new tasks ready to start) ------------
	const eligibleTasks = tasks.filter((task) => {
		const status = (task.status || "pending").toLowerCase();
		if (status !== "pending") return false; // Only pending tasks at this stage
		const deps = task.dependencies ?? [];
		// More flexible dependency check: allow in-progress dependencies
		return deps.every((depId) => {
			const depTask = tasks.find(t => String(t.id) === String(depId));
			if (!depTask) return false; // Dependency task doesn't exist
			const depStatus = depTask.status || "pending";
			return ["done", "completed", "in-progress"].includes(depStatus);
		});
	});

	if (eligibleTasks.length > 0) {
		const nextTask = eligibleTasks.sort((a, b) => {
			const pa = priorityValues[a.priority || "medium"] ?? 2;
			const pb = priorityValues[b.priority || "medium"] ?? 2;
			if (pb !== pa) return pb - pa;

			const da = (a.dependencies ?? []).length;
			const db = (b.dependencies ?? []).length;
			if (da !== db) return da - db;

			return a.id - b.id;
		})[0];

		// Add complexity to the task before returning
		if (nextTask && complexityReport) {
			addComplexityToTask(nextTask, complexityReport);
		}

		return nextTask;
	}

	// ---------- 4) fall back to any remaining pending tasks (original fallback) ------------
	const anyPendingTasks = tasks.filter((task) => {
		const status = (task.status || "pending").toLowerCase();
		return status === "pending";
	});

	if (anyPendingTasks.length === 0) return null;

	const nextTask = anyPendingTasks.sort((a, b) => {
		const pa = priorityValues[a.priority || "medium"] ?? 2;
		const pb = priorityValues[b.priority || "medium"] ?? 2;
		if (pb !== pa) return pb - pa;

		const da = (a.dependencies ?? []).length;
		const db = (b.dependencies ?? []).length;
		if (da !== db) return da - db;

		return a.id - b.id;
	})[0];

	// Add complexity to the task before returning
	if (nextTask && complexityReport) {
		addComplexityToTask(nextTask, complexityReport);
	}

	return nextTask;
}

export default findNextTask;
