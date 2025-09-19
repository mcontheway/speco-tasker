// ESM Module Mocks for Jest
// This file mocks ESM modules that cause issues in Jest CommonJS environment

// Mock boxen
jest.mock("boxen", () => ({
	__esModule: true,
	default: jest.fn((text, options) => `[BOX] ${text}`),
}));

// Mock chalk
jest.mock("chalk", () => ({
	__esModule: true,
	default: {
		blue: jest.fn((text) => `[BLUE]${text}[/BLUE]`),
		green: jest.fn((text) => `[GREEN]${text}[/GREEN]`),
		red: jest.fn((text) => `[RED]${text}[/RED]`),
		yellow: jest.fn((text) => `[YELLOW]${text}[/YELLOW]`),
		cyan: jest.fn((text) => `[CYAN]${text}[/CYAN]`),
		magenta: jest.fn((text) => `[MAGENTA]${text}[/MAGENTA]`),
		white: jest.fn((text) => text),
		gray: jest.fn((text) => `[GRAY]${text}[/GRAY]`),
		bold: jest.fn((text) => `[BOLD]${text}[/BOLD]`),
	},
	blue: jest.fn((text) => `[BLUE]${text}[/BLUE]`),
	green: jest.fn((text) => `[GREEN]${text}[/GREEN]`),
	red: jest.fn((text) => `[RED]${text}[/RED]`),
	yellow: jest.fn((text) => `[YELLOW]${text}[/YELLOW]`),
	cyan: jest.fn((text) => `[CYAN]${text}[/CYAN]`),
	magenta: jest.fn((text) => `[MAGENTA]${text}[/MAGENTA]`),
	white: jest.fn((text) => text),
	gray: jest.fn((text) => `[GRAY]${text}[/GRAY]`),
	bold: jest.fn((text) => `[BOLD]${text}[/BOLD]`),
}));

import child_process from "node:child_process";
import fs from "node:fs";
import os from "node:os";
// Mock other potentially problematic ESM modules
import path from "node:path";
import url from "node:url";

jest.mock("node:path", () => ({
	__esModule: true,
	default: path,
	...path,
}));

jest.mock("node:fs", () => ({
	__esModule: true,
	default: fs,
	...fs,
}));

jest.mock("node:url", () => ({
	__esModule: true,
	default: url,
	...url,
}));

jest.mock("node:child_process", () => ({
	__esModule: true,
	default: child_process,
	...child_process,
}));

jest.mock("node:os", () => ({
	__esModule: true,
	default: os,
	...os,
}));

jest.mock("node:process", () => ({
	__esModule: true,
	default: process,
	...process,
}));

// Mock @inquirer/confirm if used
jest.mock("@inquirer/confirm", () => ({
	__esModule: true,
	default: jest.fn(() => Promise.resolve(true)),
}));

// Mock fastmcp if used
jest.mock("fastmcp", () => ({
	__esModule: true,
	default: jest.fn(),
	FastMCP: jest.fn(),
}));

console.log("ESM mocks loaded for Jest compatibility");
