/**
 * Generic object pool. Keeps recycled instances alive off-screen instead of
 * destroying/recreating GameObjects every spawn — avoids GC churn at speed.
 */
export class ObjectPool<T> {
  private readonly free: T[] = [];
  private readonly factory: () => T;
  private readonly reset: (item: T) => void;

  constructor(factory: () => T, reset: (item: T) => void, preallocate = 0) {
    this.factory = factory;
    this.reset = reset;
    for (let i = 0; i < preallocate; i++) {
      this.free.push(this.factory());
    }
  }

  acquire(): T {
    const item = this.free.pop();
    if (item !== undefined) return item;
    return this.factory();
  }

  release(item: T): void {
    this.reset(item);
    this.free.push(item);
  }
}
