import '@testing-library/jest-dom'

// Mock localStorage for tests
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock indexedDB for tests
const indexedDBMock = {
  open: vi.fn(),
  deleteDatabase: vi.fn(),
  cmp: vi.fn(),
}

Object.defineProperty(window, 'indexedDB', {
  value: indexedDBMock,
})

// Clean up after each test
beforeEach(() => {
  vi.clearAllMocks()
  localStorageMock.clear()
})