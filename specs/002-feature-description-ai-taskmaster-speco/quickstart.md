# Speco Tasker 快速入门指南

## 概述

本指南将帮助您快速了解并使用Speco Tasker的新功能，特别是品牌重塑后的路径配置系统和纯净的任务管理体验。

## 🚀 快速开始

### 1. 安装与初始化

```bash
# 全局安装（推荐）
npm install -g speco-tasker

# 验证安装
speco-tasker --version
# 输出: Speco Tasker v1.1.5

# 初始化项目
speco-tasker init
# 项目将在 .speco/ 目录下初始化
```

### 2. 核心功能体验

```bash
# 查看帮助信息
speco-tasker --help

# 创建第一个任务
speco-tasker add-task --title "项目规划" --description "制定项目开发计划"

# 查看任务列表
speco-tasker list

# 开始处理任务
speco-tasker next

# 完成任务
speco-tasker set-status --id=1 --status=done
```

## 📁 路径配置系统

### 默认目录结构

品牌重塑后，Speco Tasker使用以下目录结构：

```
.your-project/
├── .speco/                    # 主配置目录（原.taskmaster/）
│   ├── tasks/                 # 任务文件目录
│   │   ├── tasks.json        # 任务数据
│   │   └── task_001.txt      # 任务详情
│   ├── docs/                  # 项目文档
│   ├── reports/               # 报告文件
│   ├── templates/             # 模板文件
│   └── config.json           # 路径配置
└── src/                       # 您的项目代码
```

### 自定义路径配置

如果需要自定义路径，可以编辑 `.speco/config.json`：

```json
{
  "paths": {
    "root": {
      "speco": ".my-tasks"
    },
    "dirs": {
      "tasks": "my-tasks",
      "docs": "documentation"
    }
  }
}
```

## 🎯 主要功能

### 任务管理

```bash
# 添加任务
speco-tasker add-task --title "功能开发" --description "实现用户认证功能"

# 添加子任务
speco-tasker add-subtask --parent=1 --title "设计API接口"

# 设置任务状态
speco-tasker set-status --id=1.1 --status=in-progress

# 查看任务详情
speco-tasker show 1
```

### 标签系统

```bash
# 创建功能标签
speco-tasker add-tag feature-auth

# 切换到标签
speco-tasker use-tag feature-auth

# 查看所有标签
speco-tasker tags
```

### 依赖管理

```bash
# 添加任务依赖
speco-tasker add-dependency --id=2 --depends-on=1

# 移除依赖
speco-tasker remove-dependency --id=2 --depends-on=1

# 验证依赖
speco-tasker validate-dependencies
```

## 🔧 配置管理

### 查看当前配置

```bash
# 查看路径配置
cat .speco/config.json

# 查看任务数据
cat .speco/tasks/tasks.json
```

### 备份与恢复

```bash
# 手动备份配置
cp .speco/config.json .speco/config.json.backup

# 恢复配置
cp .speco/config.json.backup .speco/config.json
```

## 📊 报告与分析

### 生成项目报告

```bash
# 查看任务统计
speco-tasker list --status=done | wc -l

# 导出任务列表
speco-tasker list > project-tasks.txt
```

### 性能监控

```bash
# 检查响应时间
time speco-tasker list

# 查看系统状态
speco-tasker --version
```

## 🛠️ 故障排除

### 常见问题

#### 1. 命令未找到
```bash
# 重新安装
npm install -g speco-tasker

# 检查PATH
which speco-tasker
```

#### 2. 配置文件损坏
```bash
# 重置配置
rm .speco/config.json
speco-tasker init
```

#### 3. 权限问题
```bash
# 检查文件权限
ls -la .speco/

# 修复权限
chmod -R 755 .speco/
```

### 调试模式

```bash
# 启用调试输出
DEBUG=1 speco-tasker list
```

## 📚 进阶功能

### 批量操作

```bash
# 批量更新状态
for id in 1 2 3; do
  speco-tasker set-status --id=$id --status=done
done
```

### 脚本集成

```bash
#!/bin/bash
# 项目构建脚本
speco-tasker add-task --title "构建项目"
speco-tasker set-status --id=1 --status=in-progress
npm run build
speco-tasker set-status --id=1 --status=done
```

### CI/CD集成

```yaml
# GitHub Actions 示例
- name: Update Task Status
  run: |
    npx speco-tasker add-task --title "CI Build"
    npx speco-tasker set-status --id=1 --status=done
```

## 🔗 相关资源

- **文档**: 查看完整文档
- **示例**: 参考示例项目
- **社区**: 加入用户社区

## 📞 支持

如果遇到问题：

1. 查看此快速入门指南
2. 检查项目文档
3. 在GitHub上提交Issue
4. 联系技术支持团队

---

**恭喜！** 您已经掌握了Speco Tasker的基本使用方法。现在可以开始高效管理您的项目任务了。

如需了解更多高级功能，请参考完整的使用文档。
