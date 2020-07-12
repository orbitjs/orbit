import { Dict } from '@orbit/utils';

export type Inflector = (input: string) => string;

export function buildInflector(
  mappings: Dict<string> = {},
  fallback?: Inflector
): Inflector {
  return (input: string) => {
    if (mappings[input]) {
      return mappings[input];
    } else if (fallback) {
      return fallback(input);
    } else {
      throw new Error(`Inflection mapping for '${input}' does not exist.`);
    }
  };
}
