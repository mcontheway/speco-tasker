/**
 * process.cwd()降级策略
 */

const path = require('path');
const os = require('os');

function getFallbackCwd() {
  // 策略1: 使用__dirname
  if (typeof __dirname !== 'undefined') {
    return path.resolve(__dirname, '..');
  }

  // 策略2: 使用require.main
  if (require.main && require.main.filename) {
    return path.dirname(require.main.filename);
  }

  // 策略3: 使用临时目录
  return os.tmpdir();
}

function robustCwd() {
  try {
    return process.cwd();
  } catch (error) {
    console.warn('process.cwd()失败，使用降级策略:', error.message);
    return getFallbackCwd();
  }
}

module.exports = { robustCwd, getFallbackCwd };
