import { BaseSerializer } from './base-serializer';

export class DateSerializer extends BaseSerializer<Date, string> {
  serialize(arg: Date): string {
    let YYYY = arg.getFullYear().toString().padStart(4, '0');
    let MM = (arg.getMonth() + 1).toString().padStart(2, '0');
    let DD = arg.getDate().toString().padStart(2, '0');
    return `${YYYY}-${MM}-${DD}`;
  }

  deserialize(arg: string): Date {
    const [year, month, date] = arg.split('-');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(date));
  }
}
