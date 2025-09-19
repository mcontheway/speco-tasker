/**
 * Advanced Node.js loader to fix process.cwd() and graceful-fs compatibility
 * This loader intercepts graceful-fs at module resolution level
 */

import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';

// Store original functions before any modifications
const originalCwd = process.cwd;

// Create ultra-safe cwd function with comprehensive fallbacks
const ultraSafeCwd = () => {
  // Attempt 1: Try original cwd
  try {
    const cwd = originalCwd.call(process);
    if (typeof cwd === 'string' && cwd.length > 0 && cwd !== 'undefined') {
      return cwd;
    }
  } catch (error) {
    console.warn('[LOADER] Original process.cwd() failed:', error.message);
  }

  // Attempt 2: Environment variables
  const envCwd = process.env.PWD || process.env.INIT_CWD || process.env.npm_config_local_prefix;
  if (envCwd && typeof envCwd === 'string' && envCwd.length > 0) {
    console.log('[LOADER] Using env fallback:', envCwd);
    return envCwd;
  }

  // Attempt 3: Node.js homedir
  try {
    const homeDir = os.homedir();
    if (homeDir && typeof homeDir === 'string') {
      console.log('[LOADER] Using homedir fallback:', homeDir);
      return homeDir;
    }
  } catch (error) {
    console.warn('[LOADER] Homedir fallback failed:', error.message);
  }

  // Attempt 4: Current file directory (if available)
  try {
    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    const projectRoot = path.resolve(currentDir, '../..');
    console.log('[LOADER] Using project root fallback:', projectRoot);
    return projectRoot;
  } catch (error) {
    console.warn('[LOADER] Project root fallback failed:', error.message);
  }

  // Final fallback
  console.warn('[LOADER] All fallbacks failed, using /tmp');
  return '/tmp';
};

// Create a smart cwd protection that allows Jest mocking
const originalDescriptor = Object.getOwnPropertyDescriptor(process, 'cwd');
const smartCwdDescriptor = {
  get: function() {
    // If there's an active Jest mock, use it
    if (typeof jest !== 'undefined' && jest.isMockFunction && jest.isMockFunction(this.cwd)) {
      try {
        return this.cwd();
      } catch (error) {
        console.warn('[LOADER] Jest mock failed, using fallback:', error.message);
      }
    }

    // Otherwise use our ultra-safe version
    return ultraSafeCwd.call(this);
  },
  set: function(value) {
    // Allow Jest to set mocks
    if (typeof jest !== 'undefined') {
      Object.defineProperty(this, 'cwd', {
        value: value,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    } else {
      // In production, keep it protected
      console.warn('[LOADER] Attempted to override process.cwd in production');
    }
  },
  enumerable: true,
  configurable: true,
};

// Apply the smart descriptor
Object.defineProperty(process, 'cwd', smartCwdDescriptor);

// Also protect global.process if it exists
if (typeof global !== 'undefined' && global.process && global.process !== process) {
  Object.defineProperty(global.process, 'cwd', smartCwdDescriptor);
}

console.log(`[LOADER] process.cwd() ultra-protected: ${ultraSafeCwd()}`);

// Create safe graceful-fs mock
const createGracefulFsMock = () => `
  const fs = require('node:fs');

  // Override any graceful-fs specific methods
  const safeFs = Object.assign({}, fs, {
    // Ensure no graceful-fs specific polyfills
    _originalCwd: ${ultraSafeCwd.toString()},
    _isGracefulFs: false
  });

  module.exports = safeFs;
`;

// Intercept graceful-fs and related modules at resolution level
export async function resolve(specifier, context, defaultResolve) {
  // Block graceful-fs completely
  if (specifier === 'graceful-fs' ||
      specifier === 'graceful-fs/graceful-fs' ||
      specifier.endsWith('/graceful-fs') ||
      specifier.includes('graceful-fs/')) {

    console.log(`[LOADER] 🚫 Blocking graceful-fs: ${specifier}`);

    // Return our safe mock instead
    const mockUrl = new URL('./graceful-fs-ultra-safe.mock.js', context.parentURL || import.meta.url);
    return {
      url: mockUrl.href,
      format: 'commonjs',
      shortCircuit: true,
    };
  }

  // Intercept Jest modules that might use graceful-fs
  if (specifier.includes('@jest/') && (
      specifier.includes('transform') ||
      specifier.includes('core') ||
      specifier.includes('runtime'))) {
    console.log(`[LOADER] 👀 Jest module detected: ${specifier}`);
  }

  return defaultResolve(specifier, context);
}

// Provide ultra-safe load implementation
export async function load(url, context, defaultLoad) {
  // For our ultra-safe graceful-fs mock
  if (url.includes('graceful-fs-ultra-safe.mock.js')) {
    console.log('[LOADER] 📦 Loading ultra-safe graceful-fs mock');
    return {
      format: 'commonjs',
      source: createGracefulFsMock(),
      shortCircuit: true,
    };
  }

  return defaultLoad(url, context);
}
