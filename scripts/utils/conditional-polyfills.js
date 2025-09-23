/**
 * 条件性polyfills应用
 * 只在安全环境中应用polyfills
 */

const EnvironmentDetector = require('./env-detector');

async function shouldApplyPolyfills() {
  const detector = new EnvironmentDetector();
  const env = await detector.detect();

  // 在以下情况下应用polyfills:
  // 1. process.cwd()可用
  // 2. 有文件系统权限
  // 3. graceful-fs存在
  return env.cwdAvailable.available &&
         env.fsPermissions.write &&
         env.gracefulFsVersion !== null;
}

async function applySafePolyfills() {
  try {
    const shouldApply = await shouldApplyPolyfills();

    if (shouldApply) {
      require('./safe-process-polyfills');
      console.log('✅ 安全polyfills已应用');
      return true;
    } else {
      console.log('⚠️ 环境不安全，跳过polyfills应用');
      return false;
    }
  } catch (error) {
    console.error('❌ polyfills应用失败:', error.message);
    return false;
  }
}

module.exports = { shouldApplyPolyfills, applySafePolyfills };
