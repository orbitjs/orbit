export interface ValidationOptions {
  [key: string]: unknown;
}

export interface ValidationIssue<Ref = unknown, Details = unknown> {
  /**
   * An identifier for the validator that caused the issue.
   */
  validator: string;

  /**
   * An identifier for the validation violation.
   */
  validation: string;

  /**
   * A brief description of the violation. This does not have to be appropriate
   * for end users, who should typically be shown internationalized, customized
   * messages.
   */
  description: string;

  /**
   * A reference to the source of the validation issue. This should be specific
   * enough to allow dereferencing to a particular record, field, etc. For
   * low-level primitive validations (e.g. booleans, strings, etc.), this should
   * be the value itself.
   */
  ref?: Ref;

  /**
   * Details specific to the validation performed that will be helpful to
   * understand the violation.
   */
  details?: Details;
}

export type Validator<
  Input = unknown,
  Options = ValidationOptions,
  Issue = ValidationIssue<Input>
> = (input: Input, options?: Options) => undefined | Issue[];

export function formatValidationDescription(
  summary: string,
  issues?: ValidationIssue[]
): string {
  if (issues && issues.length > 0) {
    return `${summary}\n${issues
      .map((i) => `- ${i.description.replace(/\n/g, '\n  ')}`)
      .join('\n')}`;
  } else {
    return summary;
  }
}
