export class Deferred<T> {
  public promise: Promise<T>;
  public resolve: (value?: T | PromiseLike<T>) => void = () => {
    return;
  };
  public reject: (reason?: any) => void = () => {
    return;
  };

  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}
