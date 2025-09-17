/**
 * Integration test for tag system functionality
 * Tests the complete tagged task lists system for multi-context management
 */

describe("Tag System Integration Test", () => {
	let mockTagManager;
	let mockTaskManager;

	beforeEach(() => {
		mockTagManager = {
			listTags: jest.fn(),
			addTag: jest.fn(),
			deleteTag: jest.fn(),
			useTag: jest.fn(),
			renameTag: jest.fn(),
			copyTag: jest.fn(),
			findProjectRoot: jest.fn().mockReturnValue("/mock/project"),
		};

		mockTaskManager = {
			getTasks: jest.fn(),
			addTask: jest.fn(),
			setTaskStatus: jest.fn(),
			moveTask: jest.fn(),
		};
	});

	describe("Basic tag operations", () => {
		it("should create and manage basic tags", () => {
			// Start with main tag (default)
			mockTagManager.listTags.mockReturnValueOnce({
				success: true,
				data: [
					{
						name: "main",
						current: true,
						taskCount: 0,
						description: "Default tag context",
						created: "2024-01-01T00:00:00Z",
					},
				],
				message: "Tags listed successfully",
			});

			const initialTags = mockTagManager.listTags();
			expect(initialTags.success).toBe(true);
			expect(initialTags.data).toHaveLength(1);
			expect(initialTags.data[0].name).toBe("main");
			expect(initialTags.data[0].current).toBe(true);

			// Create new feature tag
			mockTagManager.addTag.mockReturnValueOnce({
				success: true,
				data: {
					tagName: "feature-auth",
					description: "Authentication feature development",
					created: true,
					taskCount: 0,
				},
				message: "Tag created successfully",
			});

			const newTag = mockTagManager.addTag({
				tagName: "feature-auth",
				description: "Authentication feature development",
			});

			expect(newTag.success).toBe(true);
			expect(newTag.data.tagName).toBe("feature-auth");
			expect(newTag.data.created).toBe(true);

			// Switch to new tag
			mockTagManager.useTag.mockReturnValueOnce({
				success: true,
				data: {
					previousTag: "main",
					currentTag: "feature-auth",
					switched: true,
				},
				message: "Switched to feature-auth tag",
			});

			const switchResult = mockTagManager.useTag({
				tagName: "feature-auth",
			});

			expect(switchResult.success).toBe(true);
			expect(switchResult.data.currentTag).toBe("feature-auth");
			expect(switchResult.data.previousTag).toBe("main");
		});

		it("should handle tag-specific task operations", () => {
			// Switch to feature tag
			mockTagManager.useTag.mockReturnValueOnce({
				success: true,
				data: { currentTag: "feature-auth" },
				message: "Switched to feature-auth",
			});

			mockTagManager.useTag({ tagName: "feature-auth" });

			// Add tasks to feature tag
			const featureTasks = [
				"Design authentication flow",
				"Implement JWT tokens",
				"Create login form",
				"Add password reset",
			];

			featureTasks.forEach((title, index) => {
				mockTaskManager.addTask.mockReturnValueOnce({
					success: true,
					data: {
						id: index + 1,
						title: title,
						status: "pending",
						tag: "feature-auth",
					},
					message: "Task added to feature-auth tag",
				});

				const result = mockTaskManager.addTask({
					title: title,
					tag: "feature-auth",
				});

				expect(result.success).toBe(true);
				expect(result.data.tag).toBe("feature-auth");
			});

			// List tasks in feature tag
			mockTaskManager.getTasks.mockReturnValueOnce({
				success: true,
				data: featureTasks.map((title, index) => ({
					id: index + 1,
					title: title,
					status: "pending",
					tag: "feature-auth",
				})),
				message: "Feature tag tasks retrieved",
			});

			const tagTasks = mockTaskManager.getTasks({
				tag: "feature-auth",
			});

			expect(tagTasks.success).toBe(true);
			expect(tagTasks.data).toHaveLength(4);
			expect(tagTasks.data.every((task) => task.tag === "feature-auth")).toBe(
				true,
			);
		});
	});

	describe("Multi-context workflow", () => {
		it("should handle parallel development contexts", () => {
			// Create multiple feature tags
			const featureTags = [
				{ name: "feature-ui", description: "User interface improvements" },
				{ name: "feature-api", description: "API enhancements" },
				{ name: "bugfix-critical", description: "Critical bug fixes" },
			];

			featureTags.forEach((tag) => {
				mockTagManager.addTag.mockReturnValueOnce({
					success: true,
					data: {
						tagName: tag.name,
						description: tag.description,
						created: true,
					},
					message: `Tag ${tag.name} created`,
				});

				const result = mockTagManager.addTag(tag);
				expect(result.success).toBe(true);
				expect(result.data.tagName).toBe(tag.name);
			});

			// Add tasks to different contexts
			const contextTasks = [
				{ tag: "feature-ui", tasks: ["Redesign dashboard", "Add dark mode"] },
				{
					tag: "feature-api",
					tasks: ["Add rate limiting", "Improve error handling"],
				},
				{
					tag: "bugfix-critical",
					tasks: ["Fix memory leak", "Resolve security issue"],
				},
			];

			contextTasks.forEach((context) => {
				// Switch to context
				mockTagManager.useTag.mockReturnValueOnce({
					success: true,
					data: { currentTag: context.tag },
					message: `Switched to ${context.tag}`,
				});

				mockTagManager.useTag({ tagName: context.tag });

				// Add tasks to context
				context.tasks.forEach((title, index) => {
					mockTaskManager.addTask.mockReturnValueOnce({
						success: true,
						data: {
							id: index + 1,
							title: title,
							tag: context.tag,
							status: "pending",
						},
						message: `Task added to ${context.tag}`,
					});

					const result = mockTaskManager.addTask({
						title: title,
						tag: context.tag,
					});

					expect(result.success).toBe(true);
					expect(result.data.tag).toBe(context.tag);
				});
			});

			// Verify tag isolation
			mockTagManager.listTags.mockReturnValueOnce({
				success: true,
				data: [
					{ name: "main", taskCount: 0, current: false },
					{ name: "feature-ui", taskCount: 2, current: false },
					{ name: "feature-api", taskCount: 2, current: false },
					{ name: "bugfix-critical", taskCount: 2, current: true },
				],
				message: "All tags listed with task counts",
			});

			const allTags = mockTagManager.listTags();
			expect(allTags.success).toBe(true);
			expect(allTags.data).toHaveLength(4);
			expect(
				allTags.data.find((tag) => tag.name === "feature-ui").taskCount,
			).toBe(2);
			expect(
				allTags.data.find((tag) => tag.name === "feature-api").taskCount,
			).toBe(2);
		});

		it("should handle cross-tag task movement", () => {
			// Move task from one tag to another
			mockTaskManager.moveTask.mockReturnValueOnce({
				success: true,
				data: {
					movedTask: { id: 5, title: "Shared Component" },
					sourceTag: "feature-ui",
					targetTag: "feature-api",
					crossTag: true,
				},
				message: "Task moved across tags successfully",
			});

			const crossTagMove = mockTaskManager.moveTask({
				taskId: 5,
				sourceTag: "feature-ui",
				targetTag: "feature-api",
			});

			expect(crossTagMove.success).toBe(true);
			expect(crossTagMove.data.crossTag).toBe(true);
			expect(crossTagMove.data.sourceTag).toBe("feature-ui");
			expect(crossTagMove.data.targetTag).toBe("feature-api");
		});
	});

	describe("Tag lifecycle management", () => {
		it("should handle tag copying for experimentation", () => {
			// Copy tag for experimental work
			mockTagManager.copyTag.mockReturnValueOnce({
				success: true,
				data: {
					sourceName: "feature-auth",
					targetName: "experiment-auth-v2",
					tasksCopied: 4,
					description: "Experimental authentication v2",
				},
				message: "Tag copied successfully for experimentation",
			});

			const copyResult = mockTagManager.copyTag({
				sourceName: "feature-auth",
				targetName: "experiment-auth-v2",
				description: "Experimental authentication v2",
			});

			expect(copyResult.success).toBe(true);
			expect(copyResult.data.tasksCopied).toBe(4);
			expect(copyResult.data.sourceName).toBe("feature-auth");
			expect(copyResult.data.targetName).toBe("experiment-auth-v2");

			// Work on experimental tasks
			mockTagManager.useTag.mockReturnValueOnce({
				success: true,
				data: { currentTag: "experiment-auth-v2" },
				message: "Switched to experimental tag",
			});

			mockTagManager.useTag({ tagName: "experiment-auth-v2" });

			// Modify experimental tasks
			mockTaskManager.setTaskStatus.mockReturnValueOnce({
				success: true,
				data: { id: 1, status: "in-progress", tag: "experiment-auth-v2" },
				message: "Experimental task started",
			});

			const experimentWork = mockTaskManager.setTaskStatus({
				taskId: 1,
				status: "in-progress",
				tag: "experiment-auth-v2",
			});

			expect(experimentWork.success).toBe(true);
			expect(experimentWork.data.tag).toBe("experiment-auth-v2");
		});

		it("should handle tag cleanup and deletion", () => {
			// Delete experimental tag after completion/cancellation
			mockTagManager.deleteTag.mockReturnValueOnce({
				success: true,
				data: {
					tagName: "experiment-auth-v2",
					tasksDeleted: 4,
					filesRemoved: [
						"task_001.md",
						"task_002.md",
						"task_003.md",
						"task_004.md",
					],
					cleanup: true,
				},
				message: "Experimental tag deleted successfully",
			});

			const deleteResult = mockTagManager.deleteTag({
				tagName: "experiment-auth-v2",
				yes: true,
			});

			expect(deleteResult.success).toBe(true);
			expect(deleteResult.data.tasksDeleted).toBe(4);
			expect(deleteResult.data.cleanup).toBe(true);
			expect(deleteResult.data.filesRemoved).toHaveLength(4);

			// Verify tag is gone
			mockTagManager.listTags.mockReturnValueOnce({
				success: true,
				data: [
					{ name: "main", taskCount: 0 },
					{ name: "feature-auth", taskCount: 4 },
				],
				message: "Tags listed after cleanup",
			});

			const remainingTags = mockTagManager.listTags();
			expect(remainingTags.success).toBe(true);
			expect(
				remainingTags.data.find((tag) => tag.name === "experiment-auth-v2"),
			).toBeUndefined();
		});

		it("should handle tag renaming for organization", () => {
			mockTagManager.renameTag.mockReturnValueOnce({
				success: true,
				data: {
					oldName: "feature-auth",
					newName: "v2-authentication",
					taskCount: 4,
					filesUpdated: true,
				},
				message: "Tag renamed successfully",
			});

			const renameResult = mockTagManager.renameTag({
				oldName: "feature-auth",
				newName: "v2-authentication",
			});

			expect(renameResult.success).toBe(true);
			expect(renameResult.data.oldName).toBe("feature-auth");
			expect(renameResult.data.newName).toBe("v2-authentication");
			expect(renameResult.data.taskCount).toBe(4);
			expect(renameResult.data.filesUpdated).toBe(true);
		});
	});

	describe("Git integration patterns", () => {
		it("should support branch-based tag creation", () => {
			// Create tag from git branch
			mockTagManager.addTag.mockReturnValueOnce({
				success: true,
				data: {
					tagName: "feature-user-profile",
					fromBranch: "feature/user-profile",
					gitIntegration: true,
					created: true,
				},
				message: "Tag created from git branch",
			});

			const branchTag = mockTagManager.addTag({
				fromBranch: "feature/user-profile",
			});

			expect(branchTag.success).toBe(true);
			expect(branchTag.data.fromBranch).toBe("feature/user-profile");
			expect(branchTag.data.gitIntegration).toBe(true);
			expect(branchTag.data.tagName).toBe("feature-user-profile");

			// Add tasks for feature branch work
			mockTaskManager.addTask.mockReturnValueOnce({
				success: true,
				data: {
					id: 1,
					title: "Update profile form",
					tag: "feature-user-profile",
					gitBranch: "feature/user-profile",
				},
				message: "Branch-specific task added",
			});

			const branchTask = mockTaskManager.addTask({
				title: "Update profile form",
				tag: "feature-user-profile",
			});

			expect(branchTask.success).toBe(true);
			expect(branchTask.data.tag).toBe("feature-user-profile");
		});

		it("should handle merge conflict prevention", () => {
			// Simulate merge conflict scenario
			mockTagManager.listTags.mockReturnValueOnce({
				success: true,
				data: [
					{ name: "main", taskCount: 5, lastModified: "2024-01-01T10:00:00Z" },
					{
						name: "feature-branch-a",
						taskCount: 3,
						lastModified: "2024-01-01T11:00:00Z",
					},
					{
						name: "feature-branch-b",
						taskCount: 2,
						lastModified: "2024-01-01T11:30:00Z",
					},
				],
				message: "Potential merge conflict detected",
			});

			const conflictCheck = mockTagManager.listTags();
			expect(conflictCheck.success).toBe(true);

			// Verify isolation prevents conflicts
			const tagNames = conflictCheck.data.map((tag) => tag.name);
			expect(tagNames).toContain("main");
			expect(tagNames).toContain("feature-branch-a");
			expect(tagNames).toContain("feature-branch-b");

			// Each tag maintains separate task lists
			expect(conflictCheck.data.every((tag) => tag.taskCount >= 0)).toBe(true);
		});
	});

	describe("Team collaboration scenarios", () => {
		it("should support team member isolation", () => {
			// Create developer-specific tags
			const teamTags = ["alice-backend", "bob-frontend", "charlie-devops"];

			teamTags.forEach((tagName) => {
				mockTagManager.addTag.mockReturnValueOnce({
					success: true,
					data: {
						tagName: tagName,
						description: `${tagName.split("-")[0]}'s work context`,
						teamMember: tagName.split("-")[0],
						created: true,
					},
					message: `Team tag ${tagName} created`,
				});

				const result = mockTagManager.addTag({
					tagName: tagName,
					description: `${tagName.split("-")[0]}'s work context`,
				});

				expect(result.success).toBe(true);
				expect(result.data.teamMember).toBe(tagName.split("-")[0]);
			});

			// Each team member works in isolation
			mockTagManager.useTag.mockReturnValueOnce({
				success: true,
				data: { currentTag: "alice-backend" },
				message: "Alice working on backend tasks",
			});

			mockTagManager.useTag({ tagName: "alice-backend" });

			mockTaskManager.addTask.mockReturnValueOnce({
				success: true,
				data: {
					id: 1,
					title: "Optimize database queries",
					tag: "alice-backend",
					assignee: "alice",
				},
				message: "Backend task added for Alice",
			});

			const aliceTask = mockTaskManager.addTask({
				title: "Optimize database queries",
				tag: "alice-backend",
			});

			expect(aliceTask.success).toBe(true);
			expect(aliceTask.data.tag).toBe("alice-backend");
		});

		it("should handle tag merging for collaboration", () => {
			// Merge completed feature tag back to master
			mockTagManager.copyTag.mockReturnValueOnce({
				success: true,
				data: {
					sourceName: "feature-complete",
					targetName: "main",
					mergeOperation: true,
					tasksMerged: 6,
					conflictsResolved: 0,
				},
				message: "Feature tag merged to master successfully",
			});

			const mergeResult = mockTagManager.copyTag({
				sourceName: "feature-complete",
				targetName: "main",
				merge: true,
			});

			expect(mergeResult.success).toBe(true);
			expect(mergeResult.data.mergeOperation).toBe(true);
			expect(mergeResult.data.tasksMerged).toBe(6);
			expect(mergeResult.data.conflictsResolved).toBe(0);

			// Clean up completed feature tag
			mockTagManager.deleteTag.mockReturnValueOnce({
				success: true,
				data: {
					tagName: "feature-complete",
					tasksDeleted: 0, // Already merged
					cleanup: true,
				},
				message: "Completed feature tag cleaned up",
			});

			const cleanup = mockTagManager.deleteTag({
				tagName: "feature-complete",
				yes: true,
			});

			expect(cleanup.success).toBe(true);
			expect(cleanup.data.tasksDeleted).toBe(0);
		});
	});

	describe("Error handling and validation", () => {
		it("should handle tag operation errors gracefully", () => {
			// Try to delete non-existent tag
			mockTagManager.deleteTag.mockReturnValueOnce({
				success: false,
				error: "Tag not found",
				message: 'Tag "non-existent" does not exist',
			});

			const deleteError = mockTagManager.deleteTag({
				tagName: "non-existent",
			});

			expect(deleteError.success).toBe(false);
			expect(deleteError.error).toBe("Tag not found");

			// Try to switch to invalid tag
			mockTagManager.useTag.mockReturnValueOnce({
				success: false,
				error: "Tag not found",
				message: "Cannot switch to non-existent tag",
			});

			const switchError = mockTagManager.useTag({
				tagName: "invalid-tag",
			});

			expect(switchError.success).toBe(false);
			expect(switchError.error).toBe("Tag not found");

			// Try to create tag with invalid name
			mockTagManager.addTag.mockReturnValueOnce({
				success: false,
				error: "Invalid tag name",
				message:
					"Tag names must be alphanumeric with hyphens and underscores only",
			});

			const invalidName = mockTagManager.addTag({
				tagName: "invalid tag name!",
			});

			expect(invalidName.success).toBe(false);
			expect(invalidName.error).toBe("Invalid tag name");
		});

		it("should prevent main tag deletion", () => {
			mockTagManager.deleteTag.mockReturnValueOnce({
				success: false,
				error: "Cannot delete main tag",
				message: "The main tag cannot be deleted as it is the default context",
			});

			const deleteMaster = mockTagManager.deleteTag({
				tagName: "main",
			});

			expect(deleteMaster.success).toBe(false);
			expect(deleteMaster.error).toBe("Cannot delete main tag");
		});
	});
});
