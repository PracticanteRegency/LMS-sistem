declare function dedupe<T>(
  identifier: string,
  args: any,
  promiseFactory: () => Promise<T>
): Promise<T>;

export default dedupe;
