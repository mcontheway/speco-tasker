import os from "node:os"; // Import os module for home directory check
import { initializeProject } from "../../../../scripts/init.js"; // Import core function and its logger if needed separately
import {
	disableSilentMode,
	enableSilentMode,
	// isSilentMode // Not used directly here
} from "../../../../scripts/modules/utils.js";

/**
 * Direct function wrapper for initializing a project.
 * Derives target directory from session, sets CWD, and calls core init logic.
 * @param {object} args - Arguments containing initialization options (addAliases, initGit, storeTasksInGit, skipInstall, yes, projectRoot, rules)
 * @param {object} log - The FastMCP logger instance.
 * @param {object} context - The context object, must contain { session }.
 * @returns {Promise<{success: boolean, data?: any, error?: {code: string, message: string}}>} - Standard result object.
 */
export async function initializeProjectDirect(args, log, context = {}) {
	const { session } = context; // Keep session if core logic needs it
	const homeDir = os.homedir();

	log.info(`Args received in direct function: ${JSON.stringify(args)}`);

	// --- Determine Target Directory ---
	// Check for SPECO_PROJECT_ROOT environment variable first (for test isolation)
	let targetDirectory = args.projectRoot;
	if (process.env.SPECO_PROJECT_ROOT) {
		targetDirectory = process.env.SPECO_PROJECT_ROOT;
		log.info(
			`Using project root from SPECO_PROJECT_ROOT environment variable: ${targetDirectory}`,
		);
	} else if (args.projectRoot) {
		targetDirectory = args.projectRoot;
		log.info(`Using project root from args.projectRoot: ${targetDirectory}`);
	}

	// --- Validate the targetDirectory (basic sanity checks) ---
	if (
		!targetDirectory ||
		typeof targetDirectory !== "string" || // Ensure it's a string
		targetDirectory.trim() === "" ||
		targetDirectory === "/" ||
		targetDirectory === homeDir
	) {
		log.error(
			`Invalid target directory received from tool layer: '${targetDirectory}' (type: ${typeof targetDirectory})`,
		);
		const errorDetails = {
			receivedProjectRoot: args.projectRoot,
			receivedProjectRootType: typeof args.projectRoot,
			targetDirectory: targetDirectory,
			targetDirectoryType: typeof targetDirectory,
			homeDir: homeDir,
			currentCwd: process.cwd(),
		};
		log.error(`Detailed error info: ${JSON.stringify(errorDetails, null, 2)}`);
		return {
			success: false,
			error: {
				code: "INVALID_TARGET_DIRECTORY",
				message:
					"Cannot initialize project: Invalid target directory received. Please provide a valid projectRoot argument (absolute path to your project directory).",
				details: JSON.stringify(errorDetails, null, 2),
			},
		};
	}

	// --- Proceed with validated targetDirectory ---
	log.info(`Validated target directory for initialization: ${targetDirectory}`);

	const originalCwd = process.cwd();
	let resultData;
	let success = false;
	let errorResult = null;

	log.info(
		`Temporarily changing CWD to ${targetDirectory} for initialization.`,
	);
	process.chdir(targetDirectory); // Change CWD to the HOF-provided root

	enableSilentMode();
	try {
		// Use intelligent defaults - no complex configuration needed
		const options = {
			yes: true, // Force yes mode for MCP (no interactive prompts)
			rules: ["cursor"], // Default to Cursor profile for MCP
			rulesExplicitlyProvided: true,
		};

		log.info(`Initializing project with options: ${JSON.stringify(options)}`);
		const result = await initializeProject(options); // Call core logic

		resultData = {
			message: "项目初始化成功完成。",
			next_steps: [
				'创建您的第一个任务：task-master add-task --title="任务标题" --description="任务描述"',
				"查看任务列表：task-master list",
				"查看下一个要处理的任务：task-master next",
				"开始处理任务：task-master set-status --id=<id> --status=in-progress",
				'为复杂任务添加子任务：task-master add-subtask --parent=<id> --title="子任务标题"',
				"管理任务依赖关系：task-master add-dependency --id=<id> --depends-on=<dependency-id>",
				"生成任务文件：task-master generate",
				"使用标签组织任务：task-master add-tag <tag-name>",
				"完成任务后标记为完成：task-master set-status --id=<id> --status=done",
			],
			...result,
		};
		success = true;
		log.info(
			`Project initialization completed successfully in ${targetDirectory}.`,
		);
	} catch (error) {
		log.error(`Core initializeProject failed: ${error.message}`);
		errorResult = {
			code: "INITIALIZATION_FAILED",
			message: `Core project initialization failed: ${error.message}`,
			details: error.stack,
		};
		success = false;
	} finally {
		disableSilentMode();
		log.info(`Restoring original CWD: ${originalCwd}`);
		process.chdir(originalCwd);
	}

	if (success) {
		return { success: true, data: resultData };
	}
	return { success: false, error: errorResult };
}
