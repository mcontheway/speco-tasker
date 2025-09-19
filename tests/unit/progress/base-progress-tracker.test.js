// Mock the cli-progress module first
jest.mock("cli-progress", () => ({
	MultiBar: jest.fn().mockImplementation(() => ({
		create: jest.fn(),
		stop: jest.fn(),
	})),
	Presets: {
		shades_classic: {},
		shades_grey: {},
		rect: {},
		legacy: {},
	},
}));

// Mock the cli-progress-factory module
const mockNewMultiBar = jest.fn();
jest.mock("../../../src/progress/cli-progress-factory.js", () => ({
	newMultiBar: mockNewMultiBar,
}));

// Use Jest's require to handle ES module
const {
	BaseProgressTracker,
} = require("../../../src/progress/base-progress-tracker.js");

describe("BaseProgressTracker", () => {
	let tracker;
	let mockProgressBar;
	let mockTimeTokensBar;
	let mockMultiBar;

	beforeEach(() => {
		jest.clearAllMocks();
		jest.useFakeTimers();

		// Setup mocks
		mockProgressBar = { update: jest.fn() };
		mockTimeTokensBar = { update: jest.fn() };
		mockMultiBar = {
			create: jest
				.fn()
				.mockReturnValueOnce(mockTimeTokensBar)
				.mockReturnValueOnce(mockProgressBar),
			stop: jest.fn(),
		};

		// Mock the newMultiBar function
		mockNewMultiBar.mockReturnValue(mockMultiBar);

		tracker = new BaseProgressTracker({ numUnits: 10, unitName: "task" });
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	describe("cleanup", () => {
		it("should stop and clear timer interval", () => {
			tracker.start();
			expect(tracker._timerInterval).toBeTruthy();

			tracker.cleanup();
			expect(tracker._timerInterval).toBeNull();
		});

		it("should stop and null multibar reference", () => {
			tracker.start();
			expect(tracker.multibar).toBeTruthy();

			tracker.cleanup();
			expect(mockMultiBar.stop).toHaveBeenCalled();
			expect(tracker.multibar).toBeNull();
		});

		it("should null progress bar references", () => {
			tracker.start();
			expect(tracker.timeTokensBar).toBeTruthy();
			expect(tracker.progressBar).toBeTruthy();

			tracker.cleanup();
			expect(tracker.timeTokensBar).toBeNull();
			expect(tracker.progressBar).toBeNull();
		});

		it("should set finished state", () => {
			tracker.start();
			expect(tracker.isStarted).toBe(true);
			expect(tracker.isFinished).toBe(false);

			tracker.cleanup();
			expect(tracker.isStarted).toBe(false);
			expect(tracker.isFinished).toBe(true);
		});

		it("should handle cleanup when multibar.stop throws error", () => {
			tracker.start();
			mockMultiBar.stop.mockImplementation(() => {
				throw new Error("Stop failed");
			});

			expect(() => tracker.cleanup()).not.toThrow();
			expect(tracker.multibar).toBeNull();
		});

		it("should be safe to call multiple times", () => {
			tracker.start();

			tracker.cleanup();
			tracker.cleanup();
			tracker.cleanup();

			expect(mockMultiBar.stop).toHaveBeenCalledTimes(1);
		});

		it("should be safe to call without starting", () => {
			expect(() => tracker.cleanup()).not.toThrow();
			expect(tracker.multibar).toBeNull();
		});
	});

	describe("stop vs cleanup", () => {
		it("stop should call cleanup and null multibar reference", () => {
			tracker.start();
			tracker.stop();

			// stop() now calls cleanup() which nulls the multibar
			expect(tracker.multibar).toBeNull();
			expect(tracker.isFinished).toBe(true);
		});

		it("cleanup should null multibar preventing getSummary", () => {
			tracker.start();
			tracker.cleanup();

			expect(tracker.multibar).toBeNull();
			expect(tracker.isFinished).toBe(true);
		});
	});
});
