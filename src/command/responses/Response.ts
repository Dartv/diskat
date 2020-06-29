export class Response<
  T,
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
