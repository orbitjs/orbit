import { capitalize } from 'orbit/lib/strings';

module("Orbit - Lib - Strings", {
});

test("#capitalize capitalizes the first letter of a word", function() {
  equal(capitalize('cauliflower'), 'Cauliflower', 'capitalize capitalizes the first letter of a word');
  equal(capitalize('aSAP'), 'ASAP', 'capitalize doesn\'t touch the rest of the word');
});
