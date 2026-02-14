import '@testing-library/jest-dom'

// Functional localStorage mock for tests
class MockLocalStorage implements Storage {
  private store: Map<string, string> = new Map()

  get length(): number {
    return this.store.size
  }

  clear(): void {
    this.store.clear()
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null
  }

  key(index: number): string | null {
    const keys = Array.from(this.store.keys())
    return keys[index] ?? null
  }

  removeItem(key: string): void {
    this.store.delete(key)
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value))
  }

  [Symbol.iterator](): IterableIterator<string> {
    return this.store.keys()
  }
}

const localStorageMock = new MockLocalStorage()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
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