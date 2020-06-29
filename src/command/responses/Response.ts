export class Response<
  T extends unknown = unknown,
  U extends (...args: unknown[]) => T = (...args: unknown[]) => T,
> {
  executor: U;

  constructor(executor: U) {
    this.executor = executor;
  }

  respond(): T {
    return this.executor();
  }
}
