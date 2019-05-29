/**
 * A `Task` represents work to be performed asynchronously.
 *
 * Tasks can be uniquely identified with a `type` and `id`, although only
 * `type` is required. Processors may choose to add an `id` for tracking
 * purposes.
 *
 * A task's optional `data` can be applied during processing.
 *
 * @export
 * @interface Task
 */
export interface Task {
  type: string;
  id?: string;
  data?: any;
}

/**
 * Classes that can perform tasks should implement the Performer interface.
 *
 * @export
 * @interface Performer
 */
export interface Performer {
  perform(task: Task): Promise<any>;
}
