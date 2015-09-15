import { toIdentifier, parseIdentifier } from 'orbit-common/lib/identifiers';

module("OC - Lib - Identifiers", {
});

test("`toIdentifier` converts a `type` and `id` to an identifier string", function() {
  equal(toIdentifier('planet', '1'), 'planet:1');
});

test("`parseIdentifier` converts an identifier string to an object with a `type` and `id`", function() {
  deepEqual(parseIdentifier('planet:1'), {type: 'planet', id: '1'});
});
