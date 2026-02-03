import { test, expect } from "@jest/globals";

import logger, { setLogger } from "../src/utils/logger";

test("logger - should have all methods", () => {
  expect(logger).toHaveProperty("info");
  expect(logger).toHaveProperty("debug");
  expect(logger).toHaveProperty("error");
  expect(logger).toHaveProperty("warn");
});

test("setLogger - should update logger", () => {
  const originalInfo = console.info;
  const originalDebug = console.debug;
  const originalError = console.error;
  const originalWarn = console.warn;
  
  const mockLogger = {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  };
  
  setLogger(mockLogger);
  
  logger.info("test info");
  logger.debug("test debug");
  logger.error("test error");
  logger.warn("test warn");
  
  expect(mockLogger.info).toHaveBeenCalledWith("test info");
  expect(mockLogger.debug).toHaveBeenCalledWith("test debug");
  expect(mockLogger.error).toHaveBeenCalledWith("test error");
  expect(mockLogger.warn).toHaveBeenCalledWith("test warn");
  
  // Restore original logger
  setLogger({
    info: originalInfo,
    debug: originalDebug,
    error: originalError,
    warn: originalWarn,
  });
});

test("setLogger - should update logger", () => {
  const originalInfo = console.info;
  const originalDebug = console.debug;
  const originalError = console.error;
  const originalWarn = console.warn;
  
  const mockLogger = {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  };
  
  setLogger(mockLogger);
  
  // Call through new reference
  logger.info("test info");
  logger.debug("test debug");
  logger.error("test error");
  logger.warn("test warn");
  
  expect(mockLogger.info).toHaveBeenCalledWith("test info");
  expect(mockLogger.debug).toHaveBeenCalledWith("test debug");
  expect(mockLogger.error).toHaveBeenCalledWith("test error");
  expect(mockLogger.warn).toHaveBeenCalledWith("test warn");
  
  // Restore original logger
  setLogger(console);
});

test("setLogger - should handle null logger", () => {
  expect(() => {
    setLogger(null);
  }).not.toThrow();
  
  // Restore original logger
  setLogger(console);
});

test("setLogger - should handle partial logger", () => {
  const partialLogger = {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  };
  
  setLogger(partialLogger);
  
  // Call methods - missing methods should not throw
  expect(() => {
    logger.info("test");
    logger.debug("test");
    logger.error("test");
    logger.warn("test");
  }).not.toThrow();
  
  // Restore original logger
  setLogger(console);
});
