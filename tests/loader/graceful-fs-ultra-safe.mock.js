/**
 * Ultra-safe graceful-fs mock
 * This completely bypasses graceful-fs and returns standard node:fs
 */

// Use standard node:fs without any graceful-fs polyfills
const fs = require('node:fs');

// Ensure we don't have any graceful-fs specific properties
const safeFs = Object.assign({}, fs, {
  // Mark this as not graceful-fs
  _isGracefulFs: false,
  _gracefulFsVersion: null,

  // Remove any graceful-fs specific methods that might cause issues
  gracefulify: undefined,
  monkeypatch: undefined,
});

// Export the safe version
module.exports = safeFs;
