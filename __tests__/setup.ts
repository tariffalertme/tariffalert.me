import '@testing-library/jest-dom'

// Mock canvas
class MockCanvas {
  getContext() {
    return {
      canvas: { width: 200, height: 50 },
      clearRect: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      stroke: jest.fn(),
      setLineDash: jest.fn(),
      scale: jest.fn(),
    }
  }
}

// Mock Request and Response for Next.js API routes
global.Request = class {
  constructor(input: RequestInfo | URL, init?: RequestInit) {}
} as unknown as typeof Request

global.Response = class {
  constructor(body?: BodyInit | null, init?: ResponseInit) {}
} as unknown as typeof Response

// Mock HTMLCanvasElement
Object.defineProperty(global, 'HTMLCanvasElement', {
  value: MockCanvas,
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
}) 