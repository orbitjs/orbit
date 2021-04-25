import { BaseSerializer } from './base-serializer';

export class DateSerializer extends BaseSerializer<Date, string> {
  serialize(arg: Date): string {
    return `${arg.getFullYear()}-${arg.getMonth() + 1}-${arg.getDate()}`;
  }

  deserialize(arg: string): Date {
    const [year, month, date] = arg.split('-');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(date));
  }
}
