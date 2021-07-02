/**
 * A simple dictionary interface.
 */
export interface Dict<T> {
  [key: string]: T;
}

/**
 * A type to narrow an interface by requiring a specific property or
 * properties that are optional in the base interface.
 */
export type RequireProperty<T, K extends keyof T> = Required<Pick<T, K>> &
  Omit<T, K>;
