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

// Mock other potentially problematic ESM modules
const path = require("node:path");
const fs = require("node:fs");
const url = require("node:url");
const child_process = require("node:child_process");
const os = require("node:os");

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
