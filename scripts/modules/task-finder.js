import { log } from "./utils.js";
import { addComplexityToTask } from "./utils.js";

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
		const str = String(maybeDotId);
		return str.includes(".") ? str : `${parentId}.${str}`;
	};

	const fromFullSubId = (fullSubId) => {
		const parts = String(fullSubId).split(".");
		return {
			parentId: parseInt(parts[0], 10),
			subId: parseInt(parts[1], 10),
			fullId: fullSubId,
		};
	};

	const getTaskById = (tasks, id) => {
		if (typeof id === "string" && id.includes(".")) {
			const { parentId, subId } = fromFullSubId(id);
			const parent = tasks.find((t) => t.id === parentId);
			return parent?.subtasks?.find((s) => s.id === subId) || null;
		}
		return tasks.find((t) => t.id === id) || null;
	};

	const isDependencySatisfied = (depId, tasks) => {
		const depTask = getTaskById(tasks, depId);
		if (!depTask) return false; // dependency doesn't exist
		return depTask.status === "done" || depTask.status === "in-progress";
	};

	const areDependenciesSatisfied = (dependencies, tasks) => {
		return dependencies.every((dep) => isDependencySatisfied(dep, tasks));
	};

	const flattenTasks = (tasks) => {
		const result = [];
		for (const task of tasks) {
			result.push(task);
			if (task.subtasks) {
				for (const subtask of task.subtasks) {
					result.push({
						...subtask,
						parentId: task.id,
						fullId: `${task.id}.${subtask.id}`,
					});
				}
			}
		}
		return result;
	};

	const sortByPriority = (items) => {
		return items.sort((a, b) => {
			const aPriority = priorityValues[a.priority] || 1;
			const bPriority = priorityValues[b.priority] || 1;
			return bPriority - aPriority; // higher priority first
		});
	};

	// ---------- main logic -------------------------------------------------
	if (!Array.isArray(tasks) || tasks.length === 0) {
		return null;
	}

	// Apply complexity scores to tasks if report exists
	let tasksWithComplexity = tasks;
	if (complexityReport) {
		tasksWithComplexity = tasks.map((task) => addComplexityToTask(task, complexityReport));
	}

	// Flatten all tasks (including subtasks) for easier processing
	const allTasks = flattenTasks(tasksWithComplexity);

	// Step 1: Return any IN-PROGRESS task (top-level or subtask) to continue current work
	const inProgressTasks = allTasks.filter((task) => task.status === "in-progress");
	if (inProgressTasks.length > 0) {
		const sortedInProgress = sortByPriority(inProgressTasks);
		const next = sortedInProgress[0];
		log("info", `Continuing work on: ${next.title} (${next.fullId || next.id})`);
		return {
			id: next.fullId || next.id,
			title: next.title,
			status: next.status,
			priority: next.priority,
			dependencies: next.dependencies || [],
			parentId: next.parentId,
		};
	}

	// Step 2: Eligible subtasks of in-progress parents (pending subtasks ready to start)
	const inProgressParents = tasksWithComplexity.filter((task) => task.status === "in-progress");
	const eligibleSubtasks = [];
	for (const parent of inProgressParents) {
		if (parent.subtasks) {
			for (const subtask of parent.subtasks) {
				if (subtask.status === "pending" && areDependenciesSatisfied(subtask.dependencies || [], allTasks)) {
					eligibleSubtasks.push({
						...subtask,
						parentId: parent.id,
						fullId: `${parent.id}.${subtask.id}`,
					});
				}
			}
		}
	}
	if (eligibleSubtasks.length > 0) {
		const sortedEligible = sortByPriority(eligibleSubtasks);
		const next = sortedEligible[0];
		log("info", `Starting eligible subtask: ${next.title} (${next.fullId})`);
		return {
			id: next.fullId,
			title: next.title,
			status: next.status,
			priority: next.priority,
			dependencies: next.dependencies || [],
			parentId: next.parentId,
		};
	}

	// Step 3: New top-level tasks ready to start (dependencies satisfied, including in-progress deps)
	const eligibleTopLevelTasks = tasksWithComplexity.filter((task) =>
		task.status === "pending" && areDependenciesSatisfied(task.dependencies || [], allTasks)
	);
	if (eligibleTopLevelTasks.length > 0) {
		const sortedEligible = sortByPriority(eligibleTopLevelTasks);
		const next = sortedEligible[0];
		log("info", `Starting new task: ${next.title} (${next.id})`);
		return {
			id: next.id,
			title: next.title,
			status: next.status,
			priority: next.priority,
			dependencies: next.dependencies || [],
		};
	}

	// Step 4: Any remaining pending tasks (fallback)
	const remainingPendingTasks = allTasks.filter((task) => task.status === "pending");
	if (remainingPendingTasks.length > 0) {
		const sortedRemaining = sortByPriority(remainingPendingTasks);
		const next = sortedRemaining[0];
		log("info", `Starting remaining task: ${next.title} (${next.fullId || next.id})`);
		return {
			id: next.fullId || next.id,
			title: next.title,
			status: next.status,
			priority: next.priority,
			dependencies: next.dependencies || [],
			parentId: next.parentId,
		};
	}

	// No eligible tasks found
	return null;
}

export default findNextTask;
