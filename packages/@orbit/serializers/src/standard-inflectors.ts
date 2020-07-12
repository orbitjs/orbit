/**
 * Uppercase the first letter of a string, but don't change the remainder.
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Convert underscored, dasherized, or space-delimited words into
 * lowerCamelCase.
 */
export function camelize(str: string): string {
  return str
    .replace(/(\-|\_|\.|\s)+(.)?/g, function (match, separator, chr) {
      return chr ? chr.toUpperCase() : '';
    })
    .replace(/(^|\/)([A-Z])/g, function (match) {
      return match.toLowerCase();
    });
}

/**
 * Converts a camelized string into all lowercase separated by underscores.
 */
export function decamelize(str: string): string {
  return str.replace(/([a-z\d])([A-Z])/g, '$1_$2').toLowerCase();
}

/**
 * Dasherize words that are underscored, space-delimited, or camelCased.
 */
export function dasherize(str: string): string {
  return decamelize(str).replace(/[ _]/g, '-');
}

/**
 * Underscore words that are dasherized, space-delimited, or camelCased.
 */
export function underscore(str: string): string {
  return str
    .replace(/([a-z\d])([A-Z]+)/g, '$1_$2')
    .replace(/\-|\s+/g, '_')
    .toLowerCase();
}

/**
 * A naive pluralization method.
 */
export function pluralize(word: string): string {
  return word + 's';
}

/**
 * A naive singularization method.
 */
export function singularize(word: string): string {
  if (word.lastIndexOf('s') === word.length - 1) {
    return word.substr(0, word.length - 1);
  } else {
    return word;
  }
}

export type StandardInflectorName =
  | 'camelize'
  | 'dasherize'
  | 'underscore'
  | 'pluralize'
  | 'singularize';

export const standardInflectors = {
  camelize,
  dasherize,
  underscore,
  pluralize,
  singularize
};

export const standardInverseInflectors = {
  camelize: null, // There's no rational inverse for camelization
  dasherize: 'camelize',
  underscore: 'camelize',
  pluralize: 'singularize',
  singularize: 'pluralize'
};
