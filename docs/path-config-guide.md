# Speco Tasker 路径配置指南 | Path Configuration Guide

## 概述 | Overview

Speco Tasker 的路径配置系统允许您完全控制项目中所有文件和目录的路径映射，避免硬编码路径，提高项目的灵活性和可维护性。

The path configuration system in Speco Tasker allows you to have complete control over all file and directory path mappings in your project, avoiding hardcoded paths and improving project flexibility and maintainability.

## 配置文件结构 | Configuration File Structure

### 配置文件位置 | Configuration File Location

配置文件位于项目根目录下的 `.speco/config.json`：

The configuration file is located at `.speco/config.json` in the project root:

```json
{
  "version": "1.2.0",
  "paths": {
    "root": {
      "speco": ".speco",
      "legacy": ".taskmaster"
    },
    "dirs": {
      "tasks": "tasks",
      "docs": "docs",
      "reports": "reports",
      "templates": "templates",
      "backups": "backups"
    },
    "files": {
      "tasks": "tasks.json",
      "config": "config.json",
      "state": "state.json",
      "changelog": "changelog.md"
    }
  },
  "security": {
    "enabled": true,
    "maxFileSize": 104857600,
    "allowedExtensions": [".js", ".ts", ".json", ".md", ".txt"],
    "forbiddenPaths": ["/etc", "/usr", "/bin", "/root", "/var"]
  }
}
```

### 配置参数说明 | Configuration Parameters

#### 根路径配置 | Root Path Configuration

| 参数 | 描述 | 默认值 | 示例 |
|------|------|--------|------|
| `root.speco` | 主配置目录路径 | `.speco` | `.my-tasks` |
| `root.legacy` | 兼容旧版本路径 | `.taskmaster` | `.old-tasks` |

#### 目录映射 | Directory Mapping

| 参数 | 描述 | 默认值 | 用途 |
|------|------|--------|------|
| `dirs.tasks` | 任务文件目录 | `tasks` | 存储任务数据文件 |
| `dirs.docs` | 文档目录 | `docs` | 存储项目文档 |
| `dirs.reports` | 报告目录 | `reports` | 存储分析报告 |
| `dirs.templates` | 模板目录 | `templates` | 存储任务模板 |
| `dirs.backups` | 备份目录 | `backups` | 存储配置备份 |

#### 文件映射 | File Mapping

| 参数 | 描述 | 默认值 | 用途 |
|------|------|--------|------|
| `files.tasks` | 任务数据文件 | `tasks.json` | 存储任务信息 |
| `files.config` | 配置文件 | `config.json` | 存储路径配置 |
| `files.state` | 状态文件 | `state.json` | 存储应用状态 |
| `files.changelog` | 更新日志 | `changelog.md` | 记录版本变更 |

#### 安全配置 | Security Configuration

| 参数 | 描述 | 默认值 | 说明 |
|------|------|--------|------|
| `security.enabled` | 启用安全验证 | `true` | 是否启用文件安全检查 |
| `security.maxFileSize` | 最大文件大小 | `104857600` | 字节，100MB |
| `security.allowedExtensions` | 允许的文件扩展名 | `[".js", ".ts", ".json", ".md", ".txt"]` | 可处理的文件类型 |
| `security.forbiddenPaths` | 禁止的路径 | `["/etc", "/usr", "/bin", "/root", "/var"]` | 系统敏感路径 |

## 路径解析机制 | Path Resolution Mechanism

### 绝对路径生成 | Absolute Path Generation

Speco Tasker 根据配置文件动态生成所有路径：

```javascript
// 示例：生成任务文件路径
const tasksPath = path.join(projectRoot, ".speco", "tasks", "tasks.json");
// 结果: /project/root/.speco/tasks/tasks.json
```

### 路径类型 | Path Types

| 路径类型 | 描述 | 示例 |
|----------|------|------|
| `root` | 配置根目录 | `.speco` |
| `dir` | 子目录 | `tasks/`, `docs/` |
| `file` | 配置文件 | `tasks.json`, `config.json` |

### 标签支持 | Tag Support

路径系统支持标签（tag）上下文，不同标签可以有独立的路径配置：

```json
{
  "tags": {
    "feature-auth": {
      "root": {
        "speco": ".auth-tasks"
      }
    },
    "testing": {
      "dirs": {
        "tasks": "test-tasks"
      }
    }
  }
}
```

## 配置管理命令 | Configuration Management Commands

### 查看配置 | View Configuration

```bash
# 查看当前路径配置
speco-tasker config show

# 以 JSON 格式查看
speco-tasker config show --format=json

# 查看特定部分
speco-tasker config show --section=paths
```

### 修改配置 | Modify Configuration

```bash
# 修改单个配置项
speco-tasker config set paths.root.speco ".my-custom-path"

# 修改目录映射
speco-tasker config set dirs.tasks "my-tasks"

# 启用安全验证
speco-tasker config set security.enabled true
```

### 批量配置更新 | Batch Configuration Updates

```bash
# 从文件批量更新配置
speco-tasker config update --file=config-updates.json

# 示例配置文件内容
{
  "paths": {
    "dirs": {
      "tasks": "project-tasks",
      "docs": "documentation"
    }
  },
  "security": {
    "maxFileSize": 52428800
  }
}
```

### 配置验证 | Configuration Validation

```bash
# 验证配置完整性
speco-tasker config validate

# 严格验证模式
speco-tasker config validate --strict
```

### 配置历史 | Configuration History

```bash
# 查看配置变更历史
speco-tasker config history

# 查看最近10次变更
speco-tasker config history --limit=10
```

### 配置回滚 | Configuration Rollback

```bash
# 查看可用的回滚版本
speco-tasker config history

# 回滚到指定版本
speco-tasker config rollback v1.2.0 --confirm
```

## 安全验证功能 | Security Validation Features

### 文件操作安全检查 | File Operation Security Checks

Speco Tasker 在所有文件操作前执行安全验证：

```javascript
// 文件读取前的安全检查
const securityResult = await validateFileSecurity(filePath, "read", {
  checkPermissions: true,
  checkFileSize: true,
  logger: logger
});

if (!securityResult.secure) {
  throw new Error("文件安全验证失败");
}
```

### 安全检查类型 | Security Check Types

| 检查类型 | 描述 | 触发条件 |
|----------|------|----------|
| 路径遍历攻击 | 检测 `..` 和绝对路径 | 所有路径操作 |
| 敏感路径检测 | 检查系统敏感目录 | 所有路径操作 |
| 权限验证 | 检查文件读写权限 | 实际文件操作 |
| 文件大小限制 | 验证文件不超过限制 | 文件读取操作 |
| 扩展名验证 | 检查文件类型是否允许 | 文件处理操作 |
| 符号链接检查 | 检测符号链接文件 | 文件属性检查 |

### 安全配置选项 | Security Configuration Options

```json
{
  "security": {
    "enabled": true,
    "strictMode": false,
    "maxFileSize": 104857600,
    "maxPathLength": 4096,
    "allowedFileExtensions": [
      ".js", ".ts", ".json", ".md", ".txt",
      ".yaml", ".yml", ".html", ".css"
    ],
    "forbiddenPaths": [
      "/etc", "/usr", "/bin", "/sbin",
      "/boot", "/sys", "/proc", "/root"
    ],
    "sensitiveDirectories": [
      "node_modules", ".git", ".svn",
      "tmp", "temp", ".vscode", ".idea"
    ]
  }
}
```

## 高级配置 | Advanced Configuration

### 环境特定配置 | Environment-Specific Configuration

```json
{
  "environments": {
    "development": {
      "paths": {
        "dirs": {
          "tasks": "dev-tasks"
        }
      }
    },
    "production": {
      "security": {
        "strictMode": true,
        "maxFileSize": 52428800
      }
    }
  }
}
```

### 自定义路径解析器 | Custom Path Resolver

```javascript
// 注册自定义路径解析器
import { registerPathResolver } from 'speco-tasker';

registerPathResolver('custom', (type, key, context) => {
  // 自定义路径解析逻辑
  return path.join(context.projectRoot, 'custom', key);
});
```

### 路径缓存配置 | Path Cache Configuration

```json
{
  "cache": {
    "enabled": true,
    "ttl": 3600000,
    "maxSize": 1000,
    "cleanupInterval": 300000
  }
}
```

## 故障排除 | Troubleshooting

### 常见问题 | Common Issues

#### 配置不存在 | Configuration Not Found

```bash
# 重新初始化配置
speco-tasker init

# 或手动创建配置文件
mkdir -p .speco
cat > .speco/config.json << EOF
{
  "version": "1.2.0",
  "paths": {
    "root": { "speco": ".speco" },
    "dirs": { "tasks": "tasks" },
    "files": { "tasks": "tasks.json" }
  }
}
EOF
```

#### 权限错误 | Permission Errors

```bash
# 检查文件权限
ls -la .speco/

# 修复权限
chmod -R 755 .speco/

# 检查父目录权限
ls -ld .
```

#### 路径冲突 | Path Conflicts

```bash
# 验证配置
speco-tasker config validate

# 查看冲突详情
speco-tasker config show --format=json | jq '.conflicts'
```

### 调试模式 | Debug Mode

```bash
# 启用调试日志
DEBUG=speco-tasker speco-tasker config show

# 查看路径解析过程
DEBUG=path-resolution speco-tasker list
```

## 最佳实践 | Best Practices

### 配置组织 | Configuration Organization

1. **使用描述性路径名**：选择清晰的目录和文件名
2. **保持一致的命名约定**：遵循项目命名规范
3. **定期备份配置**：重要变更前创建备份
4. **使用版本控制**：将配置纳入版本管理

### 安全配置 | Security Configuration

1. **启用安全验证**：始终保持 `security.enabled: true`
2. **设置合理限制**：根据项目需要调整文件大小限制
3. **监控敏感操作**：定期检查安全日志
4. **定期更新规则**：根据项目发展调整安全规则

### 性能优化 | Performance Optimization

1. **启用路径缓存**：减少重复路径解析
2. **合理设置TTL**：根据使用频率调整缓存时间
3. **监控缓存效果**：定期检查缓存命中率
4. **优化批量操作**：使用批量验证减少系统调用

## API 参考 | API Reference

### 配置管理 API | Configuration Management API

```javascript
import { getConfig, updateConfig, validateConfig } from 'speco-tasker';

// 获取配置
const config = await getConfig();

// 更新配置
await updateConfig('paths.dirs.tasks', 'new-tasks');

// 验证配置
const result = await validateConfig(config);
```

### 路径解析 API | Path Resolution API

```javascript
import { resolvePath, validatePathSecurity } from 'speco-tasker';

// 解析路径
const tasksPath = resolvePath('file', 'tasks');

// 验证路径安全
const securityResult = await validatePathSecurity(tasksPath, 'read');
```

### 安全验证 API | Security Validation API

```javascript
import { validateFileSecurity, validateBatchFileSecurity } from 'speco-tasker';

// 验证单个文件
const result = await validateFileSecurity('/path/to/file', 'read');

// 批量验证
const results = await validateBatchFileSecurity([
  { filePath: '/path/to/file1', operation: 'read' },
  { filePath: '/path/to/file2', operation: 'write' }
]);
```

## 版本兼容性 | Version Compatibility

### 配置迁移 | Configuration Migration

Speco Tasker 自动处理配置版本迁移：

- **v1.0.x → v1.1.x**：添加安全配置支持
- **v1.1.x → v1.2.0**：增强路径映射功能
- **Legacy → v1.2.0**：从 `.taskmaster/` 迁移到 `.speco/`

### 向后兼容性 | Backward Compatibility

保持对旧版配置的兼容性：

```json
{
  "legacy": {
    "taskmasterPath": ".taskmaster",
    "migration": {
      "autoMigrate": true,
      "backupLegacy": true
    }
  }
}
```

## 贡献指南 | Contributing

### 配置规范 | Configuration Standards

1. **使用 JSON Schema**：所有配置应符合定义的 schema
2. **提供默认值**：为所有配置项提供合理的默认值
3. **添加验证规则**：为新配置项添加相应的验证逻辑
4. **更新文档**：新配置项应及时更新文档

### 安全增强 | Security Enhancements

1. **定期安全审计**：定期审查安全配置和规则
2. **漏洞响应**：及时响应和修复安全漏洞
3. **最佳实践更新**：跟踪安全最佳实践的发展
4. **社区反馈**：收集用户反馈改进安全功能
