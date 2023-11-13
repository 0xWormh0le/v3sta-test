class LocalStorageMock implements Storage {
  readonly length: number

  store: { [key: string]: string }

  constructor() {
    this.length = 0
    this.store = {}
  }

  clear() {
    this.store = {}
  }

  getItem(key: string) {
    return this.store[key] || null
  }

  key(index: number) {
    return null
  }

  setItem(key: string, value: string) {
    this.store[key] = String(value)
  }

  removeItem(key: string) {
    delete this.store[key]
  }
}

export default LocalStorageMock
