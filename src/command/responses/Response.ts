export class Response<T extends unknown = unknown> {
  executor: () => Promise<T>;

  constructor(executor: Response<T>['executor']) {
    this.executor = executor;
  }

  respond(): Promise<T> {
    return this.executor();
  }
}
