# Task Structure

Tasks in Speco Tasker follow a specific format designed to provide comprehensive information for both humans and AI assistants.

## Task Fields in tasks.json

Tasks in tasks.json have the following structure:

- `id`: Unique identifier for the task (Example: `1`)
- `title`: Brief, descriptive title of the task (Example: `"Initialize Repo"`)
- `description`: **Required** Concise description of what the task involves (Example: `"Create a new repository, set up initial structure."`)
- `status`: Current state of the task (Example: `"pending"`, `"done"`, `"deferred"`)
- `dependencies`: IDs of tasks that must be completed before this task (Example: `[1, 2]`)
  - Dependencies are displayed with status indicators (✅ for completed, ⏱️ for pending)
  - This helps quickly identify which prerequisite tasks are blocking work
- `priority`: **Required** Importance level of the task. Must be one of: `"high"`, `"medium"`, `"low"` (Example: `"high"`)
- `details`: **Required** In-depth implementation instructions (Example: `"Use GitHub client ID/secret, handle callback, set session token."`)
- `testStrategy`: **Required** Verification approach (Example: `"Deploy and call endpoint to confirm 'Hello World' response."`)
- `spec_files`: **Required** Associated specification documents (Example: `[{"type": "plan", "title": "Implementation Plan", "file": "specs/001-task-plan.md"}]`)
- `logs`: Implementation process logs (Example: `"2024-01-15: Started implementation, identified key challenges..."`)
- `subtasks`: List of smaller, more specific tasks that make up the main task (Example: `[{"id": 1, "title": "Configure OAuth", ...}]`)

## Task File Format

Individual task files follow this format:

```
# Task ID: <id>
# Title: <title>
# Status: <status>
# Dependencies: <comma-separated list of dependency IDs>
# Priority: <priority>
# Description: <brief description>
# Details:
<detailed implementation notes>

# Test Strategy:
<verification approach>
```

## New Required Fields

### spec_files (Required)

This field is **mandatory** for all tasks and subtasks. It establishes a clear link between implementation tasks and their specification documents.

**Structure:**
```json
"spec_files": [
  {
    "type": "plan",
    "title": "Implementation Plan",
    "file": "specs/001-task-plan.md"
  },
  {
    "type": "spec",
    "title": "Technical Specification",
    "file": "specs/001-technical-spec.md"
  }
]
```

**Common Types:**
- `plan`: Implementation plans and roadmaps
- `spec`: Technical specifications and requirements
- `requirement`: Business requirements documents
- `design`: Design documents and wireframes
- `analysis`: Analysis reports and research findings

**Validation Rules:**
- Field is required and cannot be empty
- Each entry must have `type`, `title`, and `file` fields
- File paths should be relative to project root
- System will warn if referenced files don't exist

### logs (Optional)

This field provides a chronological record of the implementation process, challenges encountered, and decisions made.

**Example:**
```json
"logs": "2024-01-15 10:30: Started implementation of authentication module\n2024-01-15 14:20: Identified issue with token validation - switched to JWT\n2024-01-16 09:15: Completed basic auth flow, testing in progress"
```

**Usage Guidelines:**
- Use timestamps for chronological tracking
- Document important decisions and why they were made
- Record challenges and how they were resolved
- Include references to related code changes or commits

## Required Field Validation

### Validation Rules

The system enforces strict validation for all required fields during task creation and updates:

#### Task Required Fields:
- **description**: Must be non-empty string
- **priority**: Must be one of: `"high"`, `"medium"`, `"low"`
- **details**: Must be non-empty string
- **testStrategy**: Must be non-empty string
- **spec_files**: Must contain at least one specification document

#### Subtask Required Fields:
- **description**: Must be non-empty string
- **priority**: Must be one of: `"high"`, `"medium"`, `"low"`
- **details**: Must be non-empty string
- **testStrategy**: Must be non-empty string
- **spec_files**: Must contain at least one specification document

### Validation Behavior

- **Creation**: Tasks and subtasks cannot be created without all required fields
- **Updates**: Attempting to update tasks/subtasks with invalid required fields will be rejected
- **Error Messages**: Clear, specific error messages guide users to complete missing information
- **Strict Validation**: No default values are provided; users must provide meaningful content for all required fields

### Best Practices for Required Fields

#### Description Field:
- Write clear, actionable descriptions
- Focus on what the task accomplishes
- Keep descriptions concise but informative

#### Priority Field:
- Use `"high"` for critical, time-sensitive tasks
- Use `"medium"` for standard development tasks (default)
- Use `"low"` for nice-to-have or deferred tasks

#### Details Field:
- Provide comprehensive implementation guidance
- Include technical specifications and constraints
- Reference related code, files, or external resources
- Consider edge cases and error handling

#### Test Strategy Field:
- Define clear verification criteria
- Include both positive and negative test cases
- Specify expected outcomes and success metrics
- Consider integration and regression testing needs

## Features in Detail

### Analyzing Task Complexity

The `analyze-complexity` command:

- Analyzes each task using AI to assess its complexity on a scale of 1-10
- Recommends optimal number of subtasks based on configured DEFAULT_SUBTASKS
- Generates tailored prompts for expanding each task
- Creates a comprehensive JSON report with ready-to-use commands
- Saves the report to scripts/task-complexity-report.json by default

The generated report contains:

- Complexity analysis for each task (scored 1-10)
- Recommended number of subtasks based on complexity
- AI-generated expansion prompts customized for each task
- Ready-to-run expansion commands directly within each task analysis

### Viewing Complexity Report

The `complexity-report` command:

- Displays a formatted, easy-to-read version of the complexity analysis report
- Shows tasks organized by complexity score (highest to lowest)
- Provides complexity distribution statistics (low, medium, high)
- Highlights tasks recommended for expansion based on threshold score
- Includes ready-to-use expansion commands for each complex task
- If no report exists, offers to generate one on the spot

### Smart Task Expansion

The `expand` command automatically checks for and uses the complexity report:

When a complexity report exists:

- Tasks are automatically expanded using the recommended subtask count and prompts
- When expanding all tasks, they're processed in order of complexity (highest first)
- Research-backed generation is preserved from the complexity analysis
- You can still override recommendations with explicit command-line options

Example workflow:

```bash
# Generate the complexity analysis report with research capabilities
task-master analyze-complexity --research

# Review the report in a readable format
task-master complexity-report

# Expand tasks using the optimized recommendations
task-master expand --id=8
# or expand all tasks
task-master expand --all
```

### Finding the Next Task

The `next` command:

- Identifies tasks that are pending/in-progress and have all dependencies satisfied
- Prioritizes tasks by priority level, dependency count, and task ID
- Displays comprehensive information about the selected task:
  - Basic task details (ID, title, priority, dependencies)
  - Implementation details
  - Subtasks (if they exist)
- Provides contextual suggested actions:
  - Command to mark the task as in-progress
  - Command to mark the task as done
  - Commands for working with subtasks

### Viewing Specific Task Details

The `show` command:

- Displays comprehensive details about a specific task or subtask
- Shows task status, priority, dependencies, and detailed implementation notes
- For parent tasks, displays all subtasks and their status
- For subtasks, shows parent task relationship
- Provides contextual action suggestions based on the task's state
- Works with both regular tasks and subtasks (using the format taskId.subtaskId)

## Best Practices for AI-Driven Development

1. **Start with a detailed PRD**: The more detailed your PRD, the better the generated tasks will be.

2. **Review generated tasks**: After parsing the PRD, review the tasks to ensure they make sense and have appropriate dependencies.

3. **Analyze task complexity**: Use the complexity analysis feature to identify which tasks should be broken down further.

4. **Follow the dependency chain**: Always respect task dependencies - the Cursor agent will help with this.

5. **Update as you go**: If your implementation diverges from the plan, use the update command to keep future tasks aligned with your current approach.

6. **Break down complex tasks**: Use the expand command to break down complex tasks into manageable subtasks.

7. **Regenerate task files**: After any updates to tasks.json, regenerate the task files to keep them in sync.

8. **Communicate context to the agent**: When asking the Cursor agent to help with a task, provide context about what you're trying to achieve.

9. **Validate dependencies**: Periodically run the validate-dependencies command to check for invalid or circular dependencies.

# Task Structure Documentation

Speco Tasker uses a structured JSON format to organize and manage tasks. As of version 0.16.2, Speco Tasker introduces **Tagged Task Lists** for multi-context task management while maintaining full backward compatibility.

## Tagged Task Lists System

Speco Tasker now organizes tasks into separate contexts called **tags**. This enables working across multiple contexts such as different branches, environments, or project phases without conflicts.

### Data Structure Overview

**Tagged Format (Current)**:

```json
{
  "main": {
    "tasks": [
      { "id": 1, "title": "Setup API", "status": "pending", ... }
    ]
  },
  "feature-branch": {
    "tasks": [
      { "id": 1, "title": "New Feature", "status": "pending", ... }
    ]
  }
}
```

**Legacy Format (Automatically Migrated)**:

```json
{
  "tasks": [
    { "id": 1, "title": "Setup API", "status": "pending", ... }
  ]
}
```

### Tag-based Task Lists (v0.17+) and Compatibility

- **Seamless Migration**: Existing `tasks.json` files are automatically migrated to use a "main" tag
- **Zero Disruption**: All existing commands continue to work exactly as before
- **Backward Compatibility**: Existing workflows remain unchanged
- **Silent Process**: Migration happens transparently on first use with a friendly notification

## Core Task Properties

Each task within a tag context contains the following properties:

### Required Properties

- **`id`** (number): Unique identifier within the tag context

  ```json
  "id": 1
  ```

- **`title`** (string): Brief, descriptive title

  ```json
  "title": "Implement user authentication"
  ```

- **`description`** (string): Concise summary of what the task involves

  ```json
  "description": "Create a secure authentication system using JWT tokens"
  ```

- **`status`** (string): Current state of the task
  - Valid values: `"pending"`, `"in-progress"`, `"done"`, `"review"`, `"deferred"`, `"cancelled"`
  ```json
  "status": "pending"
  ```

### Optional Properties

- **`dependencies`** (array): IDs of prerequisite tasks that must be completed first

  ```json
  "dependencies": [2, 3]
  ```

- **`priority`** (string): Importance level

  - Valid values: `"high"`, `"medium"`, `"low"`
  - Default: `"medium"`

  ```json
  "priority": "high"
  ```

- **`details`** (string): In-depth implementation instructions

  ```json
  "details": "Use GitHub OAuth client ID/secret, handle callback, set session token"
  ```

- **`testStrategy`** (string): Verification approach

  ```json
  "testStrategy": "Deploy and call endpoint to confirm authentication flow"
  ```

- **`subtasks`** (array): List of smaller, more specific tasks
  ```json
  "subtasks": [
    {
      "id": 1,
      "title": "Configure OAuth",
      "description": "Set up OAuth configuration",
      "status": "pending",
      "dependencies": [],
      "details": "Configure GitHub OAuth app and store credentials"
    }
  ]
  ```

## Subtask Structure

Subtasks follow a similar structure to main tasks but with some differences:

### Subtask Properties

- **`id`** (number): Unique identifier within the parent task
- **`title`** (string): Brief, descriptive title
- **`description`** (string): **Required** Concise summary of the subtask
- **`status`** (string): Current state (same values as main tasks)
- **`dependencies`** (array): Can reference other subtasks or main task IDs
- **`priority`** (string): **Required** Importance level. Must be one of: `"high"`, `"medium"`, `"low"`
- **`details`** (string): **Required** Implementation instructions and notes
- **`testStrategy`** (string): **Required** Verification approach for the subtask
- **`spec_files`** (array): **Required** Associated specification documents (same structure as main tasks)
- **`logs`** (string): **Optional** Implementation process logs

### Subtask Example

```json
{
  "id": 2,
  "title": "Handle OAuth callback",
  "description": "Process the OAuth callback and extract user data",
  "status": "pending",
  "dependencies": [1],
  "priority": "high",
  "details": "Parse callback parameters, exchange code for token, fetch user profile",
  "testStrategy": "Test OAuth callback with valid and invalid parameters",
  "spec_files": [
    {
      "type": "spec",
      "title": "OAuth Implementation Specification",
      "file": "specs/oauth-callback-spec.md"
    }
  ],
  "logs": "2024-01-15: Started OAuth callback implementation\n2024-01-15: Completed parameter parsing logic"
}
```

## Complete Example

Here's a complete example showing the tagged task structure:

```json
{
  "main": {
    "tasks": [
      {
        "id": 1,
        "title": "Setup Express Server",
        "description": "Initialize and configure Express.js server with middleware",
        "status": "done",
        "dependencies": [],
        "priority": "high",
        "details": "Create Express app with CORS, body parser, and error handling",
        "testStrategy": "Start server and verify health check endpoint responds",
        "spec_files": [
          {
            "type": "plan",
            "title": "Express Server Setup Plan",
            "file": "specs/001-express-setup-plan.md"
          },
          {
            "type": "spec",
            "title": "Express Server Technical Specification",
            "file": "specs/001-express-server-spec.md"
          }
        ],
        "logs": "2024-01-15: Started Express server setup\n2024-01-15: Configured middleware and basic routes",
        "subtasks": [
          {
            "id": 1,
            "title": "Initialize npm project",
            "description": "Set up package.json and install dependencies",
            "status": "done",
            "dependencies": [],
            "priority": "high",
            "details": "Run npm init, install express, cors, body-parser",
            "testStrategy": "Verify package.json is created and dependencies are installed",
            "spec_files": [
              {
                "type": "spec",
                "title": "NPM Project Setup Specification",
                "file": "specs/001-npm-setup-spec.md"
              }
            ],
            "logs": "2024-01-15: Ran npm init and installed core dependencies"
          },
          {
            "id": 2,
            "title": "Configure middleware",
            "description": "Set up CORS and body parsing middleware",
            "status": "done",
            "dependencies": [1],
            "priority": "medium",
            "details": "Add app.use() calls for cors() and express.json()",
            "testStrategy": "Test middleware configuration with sample requests",
            "spec_files": [
              {
                "type": "spec",
                "title": "Middleware Configuration Specification",
                "file": "specs/001-middleware-config-spec.md"
              }
            ],
            "logs": "2024-01-15: Added CORS and body parsing middleware\n2024-01-15: Verified middleware configuration"
          }
        ]
      },
      {
        "id": 2,
        "title": "Implement user authentication",
        "description": "Create secure authentication system",
        "status": "pending",
        "dependencies": [1],
        "priority": "high",
        "details": "Use JWT tokens for session management",
        "testStrategy": "Test login/logout flow with valid and invalid credentials",
        "spec_files": [
          {
            "type": "spec",
            "title": "Authentication System Specification",
            "file": "specs/002-auth-system-spec.md"
          },
          {
            "type": "design",
            "title": "Authentication Flow Design",
            "file": "specs/002-auth-flow-design.md"
          }
        ],
        "logs": "2024-01-16: Started authentication system design\n2024-01-16: Chose JWT over session-based auth",
        "subtasks": []
      }
    ]
  },
  "feature-auth": {
    "tasks": [
      {
        "id": 1,
        "title": "OAuth Integration",
        "description": "Add OAuth authentication support",
        "status": "pending",
        "dependencies": [],
        "priority": "medium",
        "details": "Integrate with GitHub OAuth for user authentication",
        "testStrategy": "Test OAuth flow with GitHub account",
        "spec_files": [
          {
            "type": "spec",
            "title": "OAuth Integration Specification",
            "file": "specs/feature-auth-oauth-spec.md"
          },
          {
            "type": "requirement",
            "title": "OAuth Integration Requirements",
            "file": "specs/feature-auth-requirements.md"
          }
        ],
        "logs": "2024-01-17: Started OAuth integration analysis\n2024-01-17: Selected GitHub OAuth as primary provider",
        "subtasks": []
      }
    ]
  }
}
```

## Tag Context Management

### Current Tag Resolution

Speco Tasker automatically determines the current tag context based on:

1. **State Configuration**: Current tag stored in `.taskmaster/state.json`
2. **Default Fallback**: "main" tag when no context is specified
3. **Future Enhancement**: Git branch-based tag switching (Part 2)

### Tag Isolation

- **Context Separation**: Tasks in different tags are completely isolated
- **Independent Numbering**: Each tag has its own task ID sequence starting from 1
- **Parallel Development**: Multiple team members can work on separate tags without conflicts

## Data Validation

Speco Tasker validates the following aspects of task data:

### Required Validations

- **Unique IDs**: Task IDs must be unique within each tag context
- **Valid Status**: Status values must be from the allowed set
- **Dependency References**: Dependencies must reference existing task IDs within the same tag
- **Subtask IDs**: Subtask IDs must be unique within their parent task

### Optional Validations

- **Circular Dependencies**: System detects and prevents circular dependency chains
- **Priority Values**: Priority must be one of the allowed values if specified
- **Data Types**: All properties must match their expected data types

## File Generation

Speco Tasker can generate individual markdown files for each task based on the JSON structure. These files include:

- **Task Overview**: ID, title, status, dependencies
- **Tag Context**: Which tag the task belongs to
- **Implementation Details**: Full task details and test strategy
- **Subtask Breakdown**: All subtasks with their current status
- **Dependency Status**: Visual indicators showing which dependencies are complete

## Migration Process

When Speco Tasker encounters a legacy format `tasks.json` file:

1. **Detection**: Automatically detects `{"tasks": [...]}` format
2. **Transformation**: Converts to `{"main": {"tasks": [...]}}` format
3. **Configuration**: Updates `.taskmaster/config.json` with tagged system settings
4. **State Creation**: Creates `.taskmaster/state.json` for tag management
5. **Notification**: Shows one-time friendly notice about the new system
6. **Preservation**: All existing task data is preserved exactly as-is

## Best Practices

### Task Organization

- **Logical Grouping**: Use tags to group related tasks (e.g., by feature, branch, or milestone)
- **Clear Titles**: Use descriptive titles that explain the task's purpose
- **Proper Dependencies**: Define dependencies to ensure correct execution order
- **Detailed Instructions**: Include sufficient detail in the `details` field for implementation

### Specification Documents Management

- **Complete Documentation**: Always ensure `spec_files` field is populated before task implementation
- **File Organization**: Keep specification documents in a consistent location (e.g., `specs/` directory)
- **Version Control**: Include specification documents in version control
- **Cross-References**: Use consistent file naming patterns for easy reference

### Implementation Logging

- **Regular Updates**: Update `logs` field regularly during implementation
- **Timestamps**: Include timestamps for chronological tracking
- **Decision Records**: Document important architectural and implementation decisions
- **Problem-Solution Pairs**: Record challenges encountered and how they were resolved

### Tag Management

- **Meaningful Names**: Use descriptive tag names that reflect their purpose
- **Consistent Naming**: Establish naming conventions for tags (e.g., branch names, feature names)
- **Context Switching**: Be aware of which tag context you're working in
- **Isolation Benefits**: Leverage tag isolation to prevent merge conflicts

### Subtask Design

- **Granular Tasks**: Break down complex tasks into manageable subtasks
- **Clear Dependencies**: Define subtask dependencies to show implementation order
- **Implementation Notes**: Use subtask details to track progress and decisions
- **Status Tracking**: Keep subtask status updated as work progresses
