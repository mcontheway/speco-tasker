---
"speco-tasker": patch
---

fix: Resolve MCP server JSON parsing errors by suppressing console output in MCP mode

Fixed JSON parsing errors in MCP server logs by:
- Adding MCP mode detection utility function
- Suppressing direct console.log outputs in PathService, init.js, and logger.js when running in MCP mode
- Ensuring all MCP responses are properly JSON serializable
- Using appropriate logger instances instead of direct console methods

This resolves client errors like "Unexpected token 'S', "[SUCCESS] A"... is not valid JSON" that were occurring when MCP tools returned formatted text instead of JSON responses.
