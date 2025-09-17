# Task Master Progress Testing Guide

Quick reference for testing streaming/non-streaming functionality with token tracking.

## 🎯 Test Modes

1. **MCP Streaming** - Has `reportProgress` + `mcpLog`, shows emoji indicators (🔴🟠🟢)
2. **CLI Streaming** - No `reportProgress`, shows terminal progress bars  
3. **Non-Streaming** - No progress reporting, single response

## 🚀 Quick Commands

```bash
# Test Scripts (accept: mcp-streaming, cli-streaming, non-streaming, both, all)
node test-add-task.js [mode]
node test-update-task.js [mode]
node test-update-subtask.js [mode]

# CLI Commands
node scripts/dev.js add-task --title="Test task" --description="Test description"
node scripts/dev.js update-task --id=1 --title="Updated title"
node scripts/dev.js update-subtask --id=1.1 --title="Updated subtask"

task-master [command]                          # Global CLI (non-streaming)
```

## ✅ Success Indicators

### Indicators
- **Priority**: 🔴🔴🔴 (high), 🟠🟠⚪ (medium), 🟢⚪⚪ (low)
- **Status**: ✅ Done, ⏱️ Pending, 🚫 Blocked, 🔄 In Progress

### Output Format
Standard text output with clear status messages

### Manual Operations
All operations are now manual with immediate feedback

## 🐛 Quick Fixes

| Issue | Fix |
|-------|-----|
| Command not found | Check if task-master is installed globally |
| File not found | Verify .taskmaster/tasks/tasks.json exists |
| Invalid task ID | Use `task-master list` to see available tasks |
| Permission denied | Check file permissions for .taskmaster directory |

```bash
# Debug
TASKMASTER_DEBUG=true node scripts/dev.js list
npm run lint
```

## 📊 Manual Operation Performance
- All operations are immediate (<1s)
- No external dependencies required
- Consistent performance across all environments

## 🔄 Test Workflow

```bash
# Quick check
node test-add-task.js both && npm test

# Full suite (before release)
for test in add-task update-task update-subtask; do
  node test-$test.js all
done
npm test
```

## 🎯 MCP Tool Example

```javascript
{
  "tool": "update_task",
  "args": {
    "id": "1",
    "title": "Updated task title",
    "description": "Updated description",
    "projectRoot": "/path/to/project"
  }
}
