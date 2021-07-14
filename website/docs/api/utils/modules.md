---
id: "modules"
title: "@orbit/utils"
sidebar_label: "Exports"
sidebar_position: 0.5
custom_edit_url: null
---

## Interfaces

- [Dict](interfaces/Dict.md)

## Type aliases

### RequireProperty

Ƭ **RequireProperty**<`T`, `K`\>: `Required`<`Pick`<`T`, `K`\>\> & `Omit`<`T`, `K`\>

A type to narrow an interface by requiring a specific property or
properties that are optional in the base interface.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | `T` |
| `K` | extends keyof `T` |

#### Defined in

[types.ts:12](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/utils/src/types.ts#L12)

## Functions

### camelize

▸ **camelize**(`str`): `string`

Convert underscored, dasherized, or space-delimited words into
lowerCamelCase.

**`deprecated`** since v0.17

#### Parameters

| Name | Type |
| :------ | :------ |
| `str` | `string` |

#### Returns

`string`

#### Defined in

[strings.ts:19](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/utils/src/strings.ts#L19)

___

### capitalize

▸ **capitalize**(`str`): `string`

Uppercase the first letter of a string, but don't change the remainder.

**`deprecated`** since v0.17

#### Parameters

| Name | Type |
| :------ | :------ |
| `str` | `string` |

#### Returns

`string`

#### Defined in

[strings.ts:6](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/utils/src/strings.ts#L6)

___

### clone

▸ **clone**(`obj`): `any`

Clones a value. If the value is an object, a deeply nested clone will be
created.

Traverses all object properties (but not prototype properties).

#### Parameters

| Name | Type |
| :------ | :------ |
| `obj` | `any` |

#### Returns

`any`

#### Defined in

[objects.ts:9](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/utils/src/objects.ts#L9)

___

### dasherize

▸ **dasherize**(`str`): `string`

Dasherize words that are underscored, space-delimited, or camelCased.

**`deprecated`** since v0.17

#### Parameters

| Name | Type |
| :------ | :------ |
| `str` | `string` |

#### Returns

`string`

#### Defined in

[strings.ts:49](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/utils/src/strings.ts#L49)

___

### decamelize

▸ **decamelize**(`str`): `string`

Converts a camelized string into all lowercase separated by underscores.

**`deprecated`** since v0.17

#### Parameters

| Name | Type |
| :------ | :------ |
| `str` | `string` |

#### Returns

`string`

#### Defined in

[strings.ts:37](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/utils/src/strings.ts#L37)

___

### deepGet

▸ **deepGet**(`obj`, `path`): `any`

Retrieves a value from a nested path on an object.

Returns any falsy value encountered while traversing the path.

#### Parameters

| Name | Type |
| :------ | :------ |
| `obj` | `any` |
| `path` | `string`[] |

#### Returns

`any`

#### Defined in

[objects.ts:180](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/utils/src/objects.ts#L180)

___

### deepMerge

▸ **deepMerge**(`object`, ...`sources`): `any`

Merges properties from other objects into a base object, traversing and
merging any objects that are encountered.

Properties that resolve to `undefined` will not overwrite properties on the
base object that already exist.

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | `any` |
| `...sources` | `any`[] |

#### Returns

`any`

#### Defined in

[objects.ts:153](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/utils/src/objects.ts#L153)

___

### deepSet

▸ **deepSet**(`obj`, `path`, `value`): `boolean`

Sets a value on an object at a nested path.

This function will create objects along the path if necessary to allow
setting a deeply nested value.

Returns `false` only if the current value is already strictly equal to the
requested `value` argument. Otherwise returns `true`.

#### Parameters

| Name | Type |
| :------ | :------ |
| `obj` | `any` |
| `path` | `string`[] |
| `value` | `any` |

#### Returns

`boolean`

#### Defined in

[objects.ts:203](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/utils/src/objects.ts#L203)

___

### eq

▸ **eq**(`a`, `b`): `boolean`

`eq` checks the equality of two objects.

The properties belonging to objects (but not their prototypes) will be
traversed deeply and compared.

Includes special handling for strings, numbers, dates, booleans, regexes, and
arrays

#### Parameters

| Name | Type |
| :------ | :------ |
| `a` | `any` |
| `b` | `any` |

#### Returns

`boolean`

#### Defined in

[eq.ts:12](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/utils/src/eq.ts#L12)

___

### every

▸ **every**(`array`, `predicate`): `boolean`

Like the Lodash _.every function, this function takes an array and a
predicate function and returns true or false depending on whether the
predicate is true for every item in the array.

#### Parameters

| Name | Type |
| :------ | :------ |
| `array` | `any`[] |
| `predicate` | (`member`: `any`, `index`: `number`) => `boolean` |

#### Returns

`boolean`

#### Defined in

[arrays.ts:6](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/utils/src/arrays.ts#L6)

___

### expose

▸ **expose**(`destination`, `source`): `void`

Expose properties and methods from one object on another.

Methods will be called on `source` and will maintain `source` as the context.

**`deprecated`** since v0.17

#### Parameters

| Name | Type |
| :------ | :------ |
| `destination` | `any` |
| `source` | `any` |

#### Returns

`void`

#### Defined in

[objects.ts:53](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/utils/src/objects.ts#L53)

___

### extend

▸ **extend**(`destination`, ...`sources`): `any`

Extend an object with the properties of one or more other objects.

**`deprecated`** since v0.17

#### Parameters

| Name | Type |
| :------ | :------ |
| `destination` | `any` |
| `...sources` | `any`[] |

#### Returns

`any`

#### Defined in

[objects.ts:77](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/utils/src/objects.ts#L77)

___

### firstResult

▸ **firstResult**(`array`, `valueFn`): `any`

This function is similar to Array.prototype.find, but it returns the result
of calling the value function rather than an item of the array.

**`deprecated`** since v0.17, remove in v0.18

#### Parameters

| Name | Type |
| :------ | :------ |
| `array` | `any`[] |
| `valueFn` | (`member`: `any`, `index`: `number`) => `any` |

#### Returns

`any`

#### Defined in

[arrays.ts:49](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/utils/src/arrays.ts#L49)

___

### isNone

▸ **isNone**(`obj`): `boolean`

Checks whether an object is null or undefined

**`export`**

#### Parameters

| Name | Type |
| :------ | :------ |
| `obj` | `unknown` |

#### Returns

`boolean`

#### Defined in

[objects.ts:121](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/utils/src/objects.ts#L121)

___

### isObject

▸ **isObject**(`obj`): `boolean`

Checks whether a value is a non-null object

**`export`**

#### Parameters

| Name | Type |
| :------ | :------ |
| `obj` | `unknown` |

#### Returns

`boolean`

#### Defined in

[objects.ts:110](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/utils/src/objects.ts#L110)

___

### merge

▸ **merge**(`object`, ...`sources`): `any`

Merges properties from other objects into a base object. Properties that
resolve to `undefined` will not overwrite properties on the base object
that already exist.

**`deprecated`** since v0.17

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | `any` |
| `...sources` | `any`[] |

#### Returns

`any`

#### Defined in

[objects.ts:132](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/utils/src/objects.ts#L132)

___

### objectValues

▸ **objectValues**(`obj`): `any`[]

Find an array of values that correspond to the keys of an object.

This is a ponyfill for `Object.values`, which is still experimental.

#### Parameters

| Name | Type |
| :------ | :------ |
| `obj` | `any` |

#### Returns

`any`[]

#### Defined in

[objects.ts:227](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/utils/src/objects.ts#L227)

___

### some

▸ **some**(`array`, `predicate`): `boolean`

Like the Lodash _.some function, this function takes an array and a predicate
function and returns true or false depending on whether the predicate is true
for any of the items in the array.

#### Parameters

| Name | Type |
| :------ | :------ |
| `array` | `any`[] |
| `predicate` | (`member`: `any`, `index`: `number`) => `boolean` |

#### Returns

`boolean`

#### Defined in

[arrays.ts:27](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/utils/src/arrays.ts#L27)

___

### toArray

▸ **toArray**(`obj`): `any`[]

Converts an object to an `Array` if it's not already.

**`export`**

#### Parameters

| Name | Type |
| :------ | :------ |
| `obj` | `unknown` |

#### Returns

`any`[]

#### Defined in

[objects.ts:95](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/utils/src/objects.ts#L95)

___

### underscore

▸ **underscore**(`str`): `string`

Underscore words that are dasherized, space-delimited, or camelCased.

**`deprecated`** since v0.17

#### Parameters

| Name | Type |
| :------ | :------ |
| `str` | `string` |

#### Returns

`string`

#### Defined in

[strings.ts:61](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/utils/src/strings.ts#L61)

___

### uuid

▸ **uuid**(): `string`

`uuid` generates a Version 4 UUID using Jeff Ward's high performance
generator.

#### Returns

`string`

#### Defined in

[uuid.ts:18](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/utils/src/uuid.ts#L18)
