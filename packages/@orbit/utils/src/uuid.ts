/**
 * Fast UUID generator, RFC4122 version 4 compliant.
 * @author Jeff Ward (jcward.com).
 * @license MIT license
 * @link http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/21963136#21963136
 **/

const lut: string[] = [];

for (let i = 0; i < 256; i++) {
  lut[i] = (i < 16 ? '0' : '') + i.toString(16);
}

/**
 * `uuid` generates a Version 4 UUID using Jeff Ward's high performance
 * generator.
 */
export function uuid(): string {
  let d0 = (Math.random() * 0xffffffff) | 0;
  let d1 = (Math.random() * 0xffffffff) | 0;
  let d2 = (Math.random() * 0xffffffff) | 0;
  let d3 = (Math.random() * 0xffffffff) | 0;

  return (
    lut[d0 & 0xff] +
    lut[(d0 >> 8) & 0xff] +
    lut[(d0 >> 16) & 0xff] +
    lut[(d0 >> 24) & 0xff] +
    '-' +
    lut[d1 & 0xff] +
    lut[(d1 >> 8) & 0xff] +
    '-' +
    lut[((d1 >> 16) & 0x0f) | 0x40] +
    lut[(d1 >> 24) & 0xff] +
    '-' +
    lut[(d2 & 0x3f) | 0x80] +
    lut[(d2 >> 8) & 0xff] +
    '-' +
    lut[(d2 >> 16) & 0xff] +
    lut[(d2 >> 24) & 0xff] +
    lut[d3 & 0xff] +
    lut[(d3 >> 8) & 0xff] +
    lut[(d3 >> 16) & 0xff] +
    lut[(d3 >> 24) & 0xff]
  );
}
