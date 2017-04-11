/**
 * A simple dictionary interface.
 * 
 * @export
 * @interface Dict
 * @template T 
 */
export interface Dict<T> {
  [key: string]: T;
}
