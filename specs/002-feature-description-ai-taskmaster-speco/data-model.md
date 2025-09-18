# 数据模型设计

## 概述

Speco Tasker的数据模型围绕品牌重塑和路径配置化需求设计，包含三个核心实体：路径配置实体、品牌信息实体和清理规则实体。

## 核心实体定义

### 1. 路径配置实体 (PathConfig)

**用途**：管理项目中所有文件和目录的路径映射，支持动态路径生成和管理。

**字段定义**：
```typescript
interface PathConfig {
  // 根目录配置
  root: {
    speco: string;        // 主目录路径，默认 ".speco"
    legacy?: string;      // 兼容旧版本路径，默认 ".taskmaster"
  };

  // 子目录映射
  dirs: {
    tasks: string;        // 任务文件目录，默认 "tasks"
    docs: string;         // 文档目录，默认 "docs"
    reports: string;      // 报告目录，默认 "reports"
    templates: string;    // 模板目录，默认 "templates"
    backups: string;      // 备份目录，默认 "backups"
  };

  // 文件映射
  files: {
    tasks: string;        // 任务数据文件，默认 "tasks.json"
    config: string;       // 配置文件，默认 "config.json"
    state: string;        // 状态文件，默认 "state.json"
    changelog: string;    // 更新日志，默认 "changelog.md"
  };
}
```

**关系**：
- `PathConfig` → `PathResolver` (1:1)：配置驱动路径解析
- `PathConfig` → `FileOperations` (1:N)：配置驱动文件操作

**有效性规则**：
- `root.speco`：必须是非空字符串，不能包含特殊字符
- `dirs.*`：必须是非空字符串，只能包含字母、数字、下划线
- `files.*`：必须是有效的文件名格式
- 路径长度限制：单个路径不超过255字符

**状态转换**：
- `未初始化` → `默认配置`：系统提供默认配置
- `默认配置` → `用户配置`：用户修改配置
- `用户配置` → `运行时配置`：系统根据标签生成动态路径
- `运行时配置` → `持久化配置`：配置保存到文件

### 2. 品牌信息实体 (BrandInfo)

**用途**：统一管理产品品牌相关信息，确保所有用户界面显示一致性。

**字段定义**：
```typescript
interface BrandInfo {
  // 基础品牌信息
  name: string;          // 产品名称，默认 "Speco Tasker"
  command: string;       // CLI命令名称，默认 "speco-tasker"
  description: string;   // 产品描述
  version: string;       // 版本信息

  // 显示相关
  shortName?: string;    // 简称，默认 "Speco"
  tagline?: string;      // 标语，默认 "纯净的任务管理系统"

  // 技术信息
  author: string;        // 作者信息，默认 "Speco Team"
  license: string;       // 许可证信息
}
```

**关系**：
- `BrandInfo` → `UIComponents` (1:N)：品牌信息驱动UI显示
- `BrandInfo` → `CLIOptions` (1:1)：品牌信息驱动CLI选项

**有效性规则**：
- `name`：必填，非空，长度1-50字符
- `command`：必填，只能包含小写字母、数字、中划线
- `version`：必须符合语义化版本格式 (MAJOR.MINOR.PATCH)

### 3. 清理规则实体 (CleanupRule)

**用途**：定义需要清理的AI相关内容和品牌信息的识别规则。

**字段定义**：
```typescript
interface CleanupRule {
  // 规则标识
  id: string;            // 规则唯一标识
  name: string;          // 规则名称
  type: CleanupType;     // 清理类型

  // 匹配规则
  patterns: string[];    // 文件匹配模式
  contentPatterns: RegExp[];  // 内容匹配正则表达式

  // 处理规则
  action: CleanupAction; // 处理动作：移除/替换/标记
  replacement?: string;  // 替换内容（当action为替换时）

  // 安全规则
  safePatterns: string[]; // 安全模式（不应该被清理的内容）
  requiresConfirmation: boolean; // 是否需要确认

  // 验证规则
  validationPatterns: RegExp[]; // 验证清理结果的正则表达式
}

enum CleanupType {
  AI_SERVICE = 'ai_service',      // AI服务调用
  AI_CONFIG = 'ai_config',        // AI配置项
  BRAND_INFO = 'brand_info',      // 品牌信息
  DOCUMENTATION = 'documentation' // 文档内容
}

enum CleanupAction {
  REMOVE = 'remove',      // 完全移除
  REPLACE = 'replace',    // 替换内容
  MARK = 'mark'          // 标记需要手动处理
}
```

**关系**：
- `CleanupRule` → `FileScanner` (1:N)：规则驱动文件扫描
- `CleanupRule` → `CleanupEngine` (1:1)：规则驱动清理执行

## 数据流设计

### 1. 路径解析数据流

```
用户请求 → 路径配置 → 标签处理 → 路径生成 → 文件操作
     ↓         ↓         ↓         ↓         ↓
  原始路径  配置映射  动态标签  完整路径  实际操作
```

### 2. 品牌信息数据流

```
系统启动 → 品牌配置 → UI组件 → 用户显示
     ↓         ↓         ↓         ↓
  配置加载  信息映射  组件渲染  品牌展示
```

### 3. 清理规则数据流

```
清理请求 → 规则加载 → 文件扫描 → 内容匹配 → 清理执行 → 结果验证
     ↓         ↓         ↓         ↓         ↓         ↓
  触发条件  规则获取  文件识别  模式匹配  安全清理  完整性检查
```

## 错误处理设计

### 1. 路径配置错误
- **配置不存在**：自动创建默认配置
- **配置格式错误**：提供详细错误信息和修复建议
- **路径权限不足**：检查并报告权限问题

### 2. 品牌信息错误
- **信息缺失**：使用默认品牌信息
- **格式不正确**：验证并修复格式问题
- **显示异常**：提供降级显示方案

### 3. 清理规则错误
- **规则冲突**：检测并报告规则冲突
- **清理失败**：提供回滚机制
- **验证失败**：详细报告清理结果和建议

## 扩展性设计

### 1. 配置扩展点
- 支持自定义路径映射
- 允许插件扩展路径类型
- 支持环境特定配置

### 2. 品牌扩展点
- 支持多语言品牌信息
- 允许主题定制
- 支持品牌信息热更新

### 3. 清理扩展点
- 支持自定义清理规则
- 允许第三方清理插件
- 支持清理规则的版本控制

## 向后兼容性

### 1. 配置兼容性
- 支持从旧版配置自动迁移
- 提供配置格式转换工具
- 保持向后兼容的API接口

### 2. 功能兼容性
- 清理操作支持安全模式
- 提供清理结果的详细报告
- 支持清理操作的撤销功能

这个数据模型设计确保了系统的灵活性、可维护性和安全性，为品牌重塑和路径配置化需求提供了完整的支撑。
