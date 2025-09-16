---
"speco-tasker": major
---

**Breaking Change: Complete Rebranding**

This release represents a complete rebranding of Task Master to **Speco Tasker**:

- **Package Name**: Changed from `taskmaster-no-ai` to `speco-tasker`
- **Product Name**: All references to "Task Master" updated to "Speco Tasker"
- **CLI Banner**: Updated ASCII art logo
- **MCP Server**: Renamed to "Speco Tasker MCP Server"
- **Documentation**: All docs, README, and tutorials updated
- **Logo**: SVG logo text updated in both light and dark themes
- **MCP Configuration**: Updated server names in `.cursor/mcp.json` and `.mcp.json`

### Migration Notes

- **For existing users**: The CLI command `task-master` remains unchanged for backward compatibility
- **New installation**: Use `npm install -g speco-tasker` for global installation
- **MCP setup**: Update your MCP server configuration to use `"speco-tasker"` instead of `"taskmaster-no-ai"`

All functionality remains the same - this is purely a branding and naming change.
