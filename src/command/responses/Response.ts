export class Response<T extends (...args: any[]) => any = (...args: any[]) => any> {
  executor: T;

  constructor(executor: T) {
    this.executor = executor;
  }

  respond(): ReturnType<T> {
    return this.executor();
  }
}
