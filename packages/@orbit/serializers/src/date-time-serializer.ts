import { BaseSerializer } from './base-serializer';

export class DateTimeSerializer extends BaseSerializer<Date, string> {
  serialize(arg: Date): string {
    return arg.toISOString();
  }

  deserialize(arg: string): Date {
    let offset = arg.indexOf('+');
    if (offset !== -1 && arg.length - 5 === offset) {
      offset += 3;
      return new Date(arg.slice(0, offset) + ':' + arg.slice(offset));
    }
    return new Date(arg);
  }
}
