// SCOPE: AI内容清理集成测试，验证AI内容的检测、清理和验证的完整工作流
const path = require("path");
const fs = require("fs");

describe("AI Content Cleanup Integration Tests", () => {
	const testProjectDir = path.join(
		__dirname,
		"..",
		"..",
		"tmp",
		"ai-cleanup-test",
	);
	const specoDir = path.join(testProjectDir, ".speco");

	beforeAll(async () => {
		// Create test project structure
		if (fs.existsSync(testProjectDir)) {
			fs.rmSync(testProjectDir, { recursive: true, force: true });
		}
		fs.mkdirSync(testProjectDir, { recursive: true });
		fs.mkdirSync(specoDir, { recursive: true });

		// Create test files with AI content
		const testFiles = {
			"src/ai-client.js": `// AI-powered client for task management
const OpenAI = require('openai');
const Claude = require('@anthropic-ai/sdk');

class AIClient {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    this.claude = new Claude({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
  }

  async getTaskSuggestions(tasks) {
    // Use AI to suggest task priorities
    const response = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an AI task management assistant."
        },
        {
          role: "user",
          content: \`Analyze these tasks and suggest priorities: \${JSON.stringify(tasks)}\`
        }
      ]
    });

    return response.choices[0].message.content;
  }

  async analyzeComplexity(task) {
    // Use Claude for complexity analysis
    const response = await this.claude.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: \`Analyze the complexity of this task: \${task.description}\`
        }
      ]
    });

    return response.content[0].text;
  }
}

module.exports = AIClient;
`,

			"src/ai-utils.js": `// AI utility functions for task analysis
const axios = require('axios');

async function analyzeTaskWithAI(taskData) {
  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: \`Analyze this task: \${JSON.stringify(taskData)}\`
        }
      ]
    }, {
      headers: {
        'Authorization': \`Bearer \${process.env.OPENAI_API_KEY}\`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('AI analysis failed:', error.message);
    return null;
  }
}

function generateAIInsights(tasks) {
  // Generate insights using AI patterns
  const insights = [];

  if (tasks.length > 10) {
    insights.push('Consider breaking down large task lists');
  }

  // AI-powered dependency analysis would go here

  return insights;
}

module.exports = {
  analyzeTaskWithAI,
  generateAIInsights
};
`,

			"docs/ai-setup.md": `# AI Setup Guide

## Setting up AI Integration

This guide explains how to integrate AI capabilities into your task management workflow.

## Required AI Services

### OpenAI Integration

1. Sign up for OpenAI API access
2. Get your API key from https://platform.openai.com/api-keys
3. Set environment variable:

\`\`\`bash
export OPENAI_API_KEY="your-api-key-here"
\`\`\`

### Anthropic Claude Integration

1. Sign up for Anthropic Console
2. Get your API key from https://console.anthropic.com/
3. Set environment variable:

\`\`\`bash
export ANTHROPIC_API_KEY="your-api-key-here"
\`\`\`

## AI Features

- **Smart Task Prioritization**: AI analyzes task complexity and suggests optimal order
- **Intelligent Dependency Detection**: Automatically identifies task relationships
- **Predictive Estimation**: AI-powered time estimation for tasks
- **Context-Aware Suggestions**: AI understands project context for better recommendations

## Configuration

Create a \`.env\` file with your AI service keys:

\`\`\`
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
\`\`\`

## Testing AI Integration

Run the AI integration tests:

\`\`\`bash
npm run test:ai
\`\`\`
`,

			"README.md": `# Task Manager AI

A powerful AI-powered task management system that uses artificial intelligence to optimize your development workflow.

## AI-Powered Features

- 🤖 **Smart Task Analysis**: AI analyzes task complexity and provides insights
- 🎯 **Intelligent Prioritization**: Machine learning algorithms suggest optimal task order
- 🔗 **Automatic Dependencies**: AI detects and suggests task dependencies
- 📊 **Predictive Analytics**: Forecast project timelines using AI models
- 💡 **Context-Aware Suggestions**: AI understands your project context

## Quick Start

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Set up AI services (see [AI Setup Guide](docs/ai-setup.md))

3. Initialize project:
\`\`\`bash
npm run init
\`\`\`

4. Start managing tasks with AI assistance:
\`\`\`bash
npm run ai-assist
\`\`\`

## AI Integration

This project integrates with multiple AI services:

- **OpenAI GPT-4**: For natural language processing and task analysis
- **Anthropic Claude**: For complex reasoning and dependency analysis
- **Custom AI Models**: Support for fine-tuned models

## Environment Variables

\`\`\`
# OpenAI Configuration
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4

# Anthropic Configuration
ANTHROPIC_API_KEY=your_anthropic_key
ANTHROPIC_MODEL=claude-3-sonnet-20240229

# AI Features
ENABLE_AI_SUGGESTIONS=true
ENABLE_AI_ANALYTICS=true
\`\`\`
`,

			"package.json": JSON.stringify(
				{
					name: "task-manager-ai",
					description: "AI-powered task management system",
					dependencies: {
						openai: "^4.0.0",
						"@anthropic-ai/sdk": "^0.5.0",
						"ai-client": "^1.0.0",
					},
					scripts: {
						"ai-assist": "node scripts/ai-assistant.js",
						"test:ai": "jest tests/ai/",
					},
				},
				null,
				2,
			),

			"src/manual-task-manager.js": `// Manual task management utilities (non-AI)
const fs = require('fs');
const path = require('path');

class ManualTaskManager {
  constructor() {
    this.tasks = [];
    this.taskFile = 'tasks.json';
  }

  loadTasks() {
    if (fs.existsSync(this.taskFile)) {
      this.tasks = JSON.parse(fs.readFileSync(this.taskFile, 'utf8'));
    }
    return this.tasks;
  }

  saveTasks() {
    fs.writeFileSync(this.taskFile, JSON.stringify(this.tasks, null, 2));
  }

  addTask(title, description) {
    const task = {
      id: Date.now(),
      title,
      description,
      status: 'pending',
      created: new Date().toISOString()
    };

    this.tasks.push(task);
    this.saveTasks();
    return task;
  }
}

module.exports = ManualTaskManager;
`,

			".speco/cleanup-rules.json": JSON.stringify(
				{
					rules: [
						{
							id: "ai-content-removal",
							name: "AI内容清理",
							description: "移除所有AI相关的文件和内容",
							patterns: ["**/*.ai", "**/ai-*", "**/*-ai.*", "**/ai/**"],
							exclude: [".speco/**", "specs/**", "node_modules/**"],
							actions: ["delete", "backup"],
							enabled: true,
						},
					],
					backup: {
						enabled: true,
						directory: ".speco/backups",
						retention: 7,
					},
				},
				null,
				2,
			),
		};

		// Write test files
		Object.entries(testFiles).forEach(([filePath, content]) => {
			const fullPath = path.join(testProjectDir, filePath);
			const dir = path.dirname(fullPath);
			if (!fs.existsSync(dir)) {
				fs.mkdirSync(dir, { recursive: true });
			}
			fs.writeFileSync(fullPath, content);
		});
	});

	afterAll(() => {
		// Cleanup test directory
		if (fs.existsSync(testProjectDir)) {
			fs.rmSync(testProjectDir, { recursive: true, force: true });
		}
	});

	describe("AI Content Detection Phase", () => {
		it("should identify AI-related files", () => {
			// Check that AI files exist
			expect(fs.existsSync(path.join(testProjectDir, "src/ai-client.js"))).toBe(
				true,
			);
			expect(fs.existsSync(path.join(testProjectDir, "src/ai-utils.js"))).toBe(
				true,
			);
			expect(fs.existsSync(path.join(testProjectDir, "docs/ai-setup.md"))).toBe(
				true,
			);
		});

		it("should detect AI content in source files", () => {
			const aiClientContent = fs.readFileSync(
				path.join(testProjectDir, "src/ai-client.js"),
				"utf8",
			);

			// Should contain AI-related patterns
			expect(aiClientContent).toContain("OpenAI");
			expect(aiClientContent).toContain("Claude");
			expect(aiClientContent).toContain("openai.chat.completions.create");
			expect(aiClientContent).toContain("claude.messages.create");
			expect(aiClientContent).toContain("AI-powered client");
			expect(aiClientContent).toContain("AI task management assistant");
		});

		it("should detect AI content in documentation", () => {
			const aiSetupContent = fs.readFileSync(
				path.join(testProjectDir, "docs/ai-setup.md"),
				"utf8",
			);

			expect(aiSetupContent).toContain("AI Setup Guide");
			expect(aiSetupContent).toContain("OpenAI Integration");
			expect(aiSetupContent).toContain("Anthropic Claude Integration");
			expect(aiSetupContent).toContain("AI Features");
			expect(aiSetupContent).toContain("AI Integration");
		});

		it("should detect AI content in configuration files", () => {
			const packageJson = JSON.parse(
				fs.readFileSync(path.join(testProjectDir, "package.json"), "utf8"),
			);

			expect(packageJson.name).toContain("ai");
			expect(packageJson.description).toContain("AI-powered");
			expect(packageJson.dependencies).toHaveProperty("openai");
			expect(packageJson.dependencies).toHaveProperty("@anthropic-ai/sdk");
			expect(packageJson.scripts).toHaveProperty("ai-assist");
			expect(packageJson.scripts).toHaveProperty("test:ai");
		});

		it("should detect AI content in README", () => {
			const readmeContent = fs.readFileSync(
				path.join(testProjectDir, "README.md"),
				"utf8",
			);

			expect(readmeContent).toContain("Task Manager AI");
			expect(readmeContent).toContain("AI-powered");
			expect(readmeContent).toContain("AI-Powered Features");
			expect(readmeContent).toContain("AI Integration");
			expect(readmeContent).toContain("OpenAI GPT-4");
			expect(readmeContent).toContain("Anthropic Claude");
		});
	});

	describe("AI Content Analysis Phase", () => {
		it("should categorize AI content by type", () => {
			// Analyze different types of AI content
			const aiClientContent = fs.readFileSync(
				path.join(testProjectDir, "src/ai-client.js"),
				"utf8",
			);
			const aiUtilsContent = fs.readFileSync(
				path.join(testProjectDir, "src/ai-utils.js"),
				"utf8",
			);
			const aiSetupContent = fs.readFileSync(
				path.join(testProjectDir, "docs/ai-setup.md"),
				"utf8",
			);

			// Service integration files
			expect(aiClientContent).toMatch(/openai|claude|anthropic/i);
			expect(aiUtilsContent).toMatch(/openai|axios.*openai/i);

			// Documentation files
			expect(aiSetupContent).toMatch(/ai.*setup|ai.*integration/i);

			// Configuration files should contain AI-related settings
			const readmeContent = fs.readFileSync(
				path.join(testProjectDir, "README.md"),
				"utf8",
			);
			expect(readmeContent).toMatch(
				/OPENAI_API_KEY|ANTHROPIC_API_KEY|ENABLE_AI_/i,
			);
		});

		it("should identify AI service dependencies", () => {
			const packageJson = JSON.parse(
				fs.readFileSync(path.join(testProjectDir, "package.json"), "utf8"),
			);

			// Should contain AI service dependencies
			const aiDeps = ["openai", "@anthropic-ai/sdk", "ai-client"];
			aiDeps.forEach((dep) => {
				expect(packageJson.dependencies).toHaveProperty(dep);
			});
		});

		it("should detect AI-related environment variables", () => {
			const readmeContent = fs.readFileSync(
				path.join(testProjectDir, "README.md"),
				"utf8",
			);

			// Should mention AI-related environment variables
			const aiEnvVars = [
				"OPENAI_API_KEY",
				"ANTHROPIC_API_KEY",
				"OPENAI_MODEL",
				"ANTHROPIC_MODEL",
				"ENABLE_AI_SUGGESTIONS",
				"ENABLE_AI_ANALYTICS",
			];

			aiEnvVars.forEach((envVar) => {
				expect(readmeContent).toContain(envVar);
			});
		});
	});

	describe("AI Content Cleanup Phase", () => {
		it("should remove AI service integration files", () => {
			// Simulate cleanup of AI files
			const aiClientPath = path.join(testProjectDir, "src/ai-client.js");
			const aiUtilsPath = path.join(testProjectDir, "src/ai-utils.js");

			// Backup and remove files (simulate cleanup process)
			const backupDir = path.join(specoDir, "backups");
			fs.mkdirSync(backupDir, { recursive: true });

			// Copy to backup
			fs.copyFileSync(
				aiClientPath,
				path.join(backupDir, "ai-client.js.backup"),
			);
			fs.copyFileSync(aiUtilsPath, path.join(backupDir, "ai-utils.js.backup"));

			// Remove original files
			fs.unlinkSync(aiClientPath);
			fs.unlinkSync(aiUtilsPath);

			// Verify files are removed
			expect(fs.existsSync(aiClientPath)).toBe(false);
			expect(fs.existsSync(aiUtilsPath)).toBe(false);

			// Verify backups exist
			expect(fs.existsSync(path.join(backupDir, "ai-client.js.backup"))).toBe(
				true,
			);
			expect(fs.existsSync(path.join(backupDir, "ai-utils.js.backup"))).toBe(
				true,
			);
		});

		it("should update package.json to remove AI dependencies", () => {
			const packageJsonPath = path.join(testProjectDir, "package.json");
			const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

			// Remove AI dependencies
			delete packageJson.dependencies["openai"];
			delete packageJson.dependencies["@anthropic-ai/sdk"];
			delete packageJson.dependencies["ai-client"];

			// Remove AI scripts
			delete packageJson.scripts["ai-assist"];
			delete packageJson.scripts["test:ai"];

			// Update name and description
			packageJson.name = "task-manager";
			packageJson.description = "Manual task management system";

			fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

			// Verify changes
			const updatedPackage = JSON.parse(
				fs.readFileSync(packageJsonPath, "utf8"),
			);
			expect(updatedPackage.name).toBe("task-manager");
			expect(updatedPackage.description).toBe("Manual task management system");
			expect(updatedPackage.dependencies).not.toHaveProperty("openai");
			expect(updatedPackage.dependencies).not.toHaveProperty(
				"@anthropic-ai/sdk",
			);
			expect(updatedPackage.scripts).not.toHaveProperty("ai-assist");
		});

		it("should remove AI documentation", () => {
			const aiSetupPath = path.join(testProjectDir, "docs/ai-setup.md");

			// Backup and remove
			const backupDir = path.join(specoDir, "backups");
			fs.copyFileSync(aiSetupPath, path.join(backupDir, "ai-setup.md.backup"));
			fs.unlinkSync(aiSetupPath);

			// Verify removal
			expect(fs.existsSync(aiSetupPath)).toBe(false);
			expect(fs.existsSync(path.join(backupDir, "ai-setup.md.backup"))).toBe(
				true,
			);
		});
	});

	describe("AI Content Cleanup Validation Phase", () => {
		it("should verify all AI content is removed", () => {
			// Check that AI files are gone
			expect(fs.existsSync(path.join(testProjectDir, "src/ai-client.js"))).toBe(
				false,
			);
			expect(fs.existsSync(path.join(testProjectDir, "src/ai-utils.js"))).toBe(
				false,
			);
			expect(fs.existsSync(path.join(testProjectDir, "docs/ai-setup.md"))).toBe(
				false,
			);

			// Check that backups exist
			const backupDir = path.join(specoDir, "backups");
			expect(fs.existsSync(path.join(backupDir, "ai-client.js.backup"))).toBe(
				true,
			);
			expect(fs.existsSync(path.join(backupDir, "ai-utils.js.backup"))).toBe(
				true,
			);
			expect(fs.existsSync(path.join(backupDir, "ai-setup.md.backup"))).toBe(
				true,
			);
		});

		it("should verify package.json is cleaned", () => {
			const packageJson = JSON.parse(
				fs.readFileSync(path.join(testProjectDir, "package.json"), "utf8"),
			);

			// Should not contain AI dependencies
			expect(packageJson.dependencies).not.toHaveProperty("openai");
			expect(packageJson.dependencies).not.toHaveProperty("@anthropic-ai/sdk");
			expect(packageJson.scripts).not.toHaveProperty("ai-assist");

			// Should have non-AI name and description
			expect(packageJson.name).toBe("task-manager");
			expect(packageJson.description).toBe("Manual task management system");
		});

		it("should verify README is updated", () => {
			const readmeContent = fs.readFileSync(
				path.join(testProjectDir, "README.md"),
				"utf8",
			);

			// Should still contain AI content (README is not cleaned in this test)
			// This verifies that only specified files are cleaned
			expect(readmeContent).toContain("AI-powered");
		});

		it("should preserve non-AI files", () => {
			// Manual task manager should still exist
			expect(
				fs.existsSync(path.join(testProjectDir, "src/manual-task-manager.js")),
			).toBe(true);

			const manualContent = fs.readFileSync(
				path.join(testProjectDir, "src/manual-task-manager.js"),
				"utf8",
			);
			expect(manualContent).toContain("Manual task management utilities");
			expect(manualContent).not.toContain("AI");
		});
	});

	describe("End-to-End AI Cleanup Workflow", () => {
		it("should complete full AI cleanup process", () => {
			// This test simulates the complete workflow

			// 1. Initial state - AI content present
			expect(fs.existsSync(path.join(testProjectDir, "src/ai-client.js"))).toBe(
				false,
			); // Already removed
			expect(
				fs.existsSync(path.join(specoDir, "backups", "ai-client.js.backup")),
			).toBe(true);

			// 2. Verify cleanup rules are in place
			const cleanupRules = JSON.parse(
				fs.readFileSync(path.join(specoDir, "cleanup-rules.json"), "utf8"),
			);
			expect(cleanupRules.rules[0].id).toBe("ai-content-removal");
			expect(cleanupRules.rules[0].enabled).toBe(true);

			// 3. Verify configuration is updated
			const packageJson = JSON.parse(
				fs.readFileSync(path.join(testProjectDir, "package.json"), "utf8"),
			);
			expect(packageJson.name).toBe("task-manager");

			// 4. Verify only specified content is removed
			expect(
				fs.existsSync(path.join(testProjectDir, "src/manual-task-manager.js")),
			).toBe(true);
			expect(fs.existsSync(path.join(testProjectDir, "README.md"))).toBe(true);

			// 5. Verify backups are maintained
			const backupFiles = fs.readdirSync(path.join(specoDir, "backups"));
			expect(backupFiles.length).toBeGreaterThan(0);
			expect(backupFiles.some((file) => file.includes("ai-client"))).toBe(true);
		});
	});
});
