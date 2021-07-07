import { Dict } from '@orbit/utils';
import { ArrayValidator, validateArray } from './array-validator';
import { BooleanValidator, validateBoolean } from './boolean-validator';
import { DateValidator, validateDate } from './date-validator';
import { NumberValidator, validateNumber } from './number-validator';
import { StringValidator, validateString } from './string-validator';

export enum StandardValidators {
  Array = 'array',
  Boolean = 'boolean',
  Date = 'date',
  DateTime = 'datetime',
  Number = 'number',
  String = 'string'
}

export type StandardValidator =
  | ArrayValidator
  | BooleanValidator
  | DateValidator
  | NumberValidator
  | StringValidator;

export const standardValidators: Dict<StandardValidator> = {
  array: validateArray,
  boolean: validateBoolean,
  date: validateDate,
  datetime: validateDate,
  number: validateNumber,
  string: validateString
};
