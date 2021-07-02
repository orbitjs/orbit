/**
 * A `Task` represents work to be performed asynchronously.
 *
 * Tasks can be identified with a `type` and `id`, although only `type` is
 * required. Processors may use `id` for tracking purposes.
 *
 * A task's optional `data` can be applied during processing, which may be
 * further influenced by its `options`.
 */
export interface Task<Type = string, Data = unknown, Options = unknown> {
  type: Type;
  id?: string;
  data?: Data;
  options?: Options;
}

/**
 * Classes that can perform tasks should implement the Performer interface.
 */
export interface Performer<
  Type = string,
  Data = unknown,
  Options = unknown,
  Result = unknown
> {
  perform(task: Task<Type, Data, Options>): Promise<Result>;
}
