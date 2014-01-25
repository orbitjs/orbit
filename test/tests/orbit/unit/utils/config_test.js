import { arrayToOptions } from 'orbit/utils/config';

module("Orbit - Utils - arrayToOptions", {
});

test("`arrayToOptions` converts an array to an options hash", function() {
  deepEqual(arrayToOptions(), {}, 'no args return empty hash');
  deepEqual(arrayToOptions([]), {}, 'empty array returns empty hash');
  deepEqual(arrayToOptions(['a', 'b']), {a: true, b: true}, 'items in array are converted to items in hash');
});
