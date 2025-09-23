const fs = require('fs');
const path = require('path');
const os = require('os');

class EnvironmentDetector {
  async detect() {
    return {
      nodeVersion: process.version,
      platform: process.platform,
      cwdAvailable: await this.checkCwd(),
      fsPermissions: await this.checkFsPermissions(),
      gracefulFsVersion: this.getGracefulFsVersion()
    };
  }

  async checkCwd() {
    try {
      const cwd = process.cwd();
      return { available: true, path: cwd };
    } catch (error) {
      return { available: false, error: error.message };
    }
  }

  async checkFsPermissions() {
    try {
      const testFile = path.join(os.tmpdir(), `test-${Date.now()}`);
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      return { write: true, read: true, delete: true };
    } catch {
      return { write: false, read: false, delete: false };
    }
  }

  getGracefulFsVersion() {
    try {
      return require('graceful-fs/package.json').version;
    } catch {
      return null;
    }
  }
}

module.exports = EnvironmentDetector;
