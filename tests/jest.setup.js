import { jest } from "@jest/globals";
// Mute RCC console logs while running test
console.log = jest.fn();
console.warn = jest.fn();
console.error = jest.fn();
