---
id: "modules"
title: "@orbit/serializers"
sidebar_label: "Exports"
sidebar_position: 0.5
custom_edit_url: null
---

## Classes

- [BaseSerializer](classes/BaseSerializer.md)
- [BooleanSerializer](classes/BooleanSerializer.md)
- [DateSerializer](classes/DateSerializer.md)
- [DateTimeSerializer](classes/DateTimeSerializer.md)
- [NoopSerializer](classes/NoopSerializer.md)
- [NumberSerializer](classes/NumberSerializer.md)
- [StringSerializer](classes/StringSerializer.md)

## Interfaces

- [Serializer](interfaces/Serializer.md)
- [StringSerializationOptions](interfaces/StringSerializationOptions.md)
- [StringSerializerSettings](interfaces/StringSerializerSettings.md)

## Type aliases

### Inflector

Ƭ **Inflector**: (`input`: `string`) => `string`

#### Type declaration

▸ (`input`): `string`

##### Parameters

| Name | Type |
| :------ | :------ |
| `input` | `string` |

##### Returns

`string`

#### Defined in

[inflector.ts:3](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/serializers/src/inflector.ts#L3)

___

### InflectorOrName

Ƭ **InflectorOrName**: [`Inflector`](modules.md#inflector) \| [`StandardInflectorName`](modules.md#standardinflectorname)

#### Defined in

[string-serializer.ts:10](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/serializers/src/string-serializer.ts#L10)

___

### SerializerClass

Ƭ **SerializerClass**<`S`\>: (`settings?`: `unknown`) => `S`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `S` | [`Serializer`](interfaces/Serializer.md) |

#### Type declaration

• (`settings?`)

##### Parameters

| Name | Type |
| :------ | :------ |
| `settings?` | `unknown` |

#### Defined in

[serializer.ts:11](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/serializers/src/serializer.ts#L11)

___

### SerializerClassForFn

Ƭ **SerializerClassForFn**<`S`\>: (`type`: `string`) => [`SerializerClass`](modules.md#serializerclass)<`S`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `S` | [`Serializer`](interfaces/Serializer.md) |

#### Type declaration

▸ (`type`): [`SerializerClass`](modules.md#serializerclass)<`S`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `type` | `string` |

##### Returns

[`SerializerClass`](modules.md#serializerclass)<`S`\>

#### Defined in

[serializer-builders.ts:37](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/serializers/src/serializer-builders.ts#L37)

___

### SerializerForFn

Ƭ **SerializerForFn**<`S`\>: (`type`: `string`) => `S` \| `undefined`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `S` | [`Serializer`](interfaces/Serializer.md) |

#### Type declaration

▸ (`type`): `S` \| `undefined`

##### Parameters

| Name | Type |
| :------ | :------ |
| `type` | `string` |

##### Returns

`S` \| `undefined`

#### Defined in

[serializer-builders.ts:4](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/serializers/src/serializer-builders.ts#L4)

___

### SerializerSettingsForFn

Ƭ **SerializerSettingsForFn**: (`type`: `string`) => `Dict`<`unknown`\> \| `undefined`

#### Type declaration

▸ (`type`): `Dict`<`unknown`\> \| `undefined`

##### Parameters

| Name | Type |
| :------ | :------ |
| `type` | `string` |

##### Returns

`Dict`<`unknown`\> \| `undefined`

#### Defined in

[serializer-builders.ts:47](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/serializers/src/serializer-builders.ts#L47)

___

### StandardInflectorName

Ƭ **StandardInflectorName**: ``"camelize"`` \| ``"dasherize"`` \| ``"underscore"`` \| ``"pluralize"`` \| ``"singularize"``

#### Defined in

[standard-inflectors.ts:64](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/serializers/src/standard-inflectors.ts#L64)

## Variables

### standardInflectors

• `Const` **standardInflectors**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `camelize` | (`str`: `string`) => `string` |
| `dasherize` | (`str`: `string`) => `string` |
| `pluralize` | (`word`: `string`) => `string` |
| `singularize` | (`word`: `string`) => `string` |
| `underscore` | (`str`: `string`) => `string` |

#### Defined in

[standard-inflectors.ts:71](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/serializers/src/standard-inflectors.ts#L71)

___

### standardInverseInflectors

• `Const` **standardInverseInflectors**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `camelize` | ``null`` |
| `dasherize` | `string` |
| `pluralize` | `string` |
| `singularize` | `string` |
| `underscore` | `string` |

#### Defined in

[standard-inflectors.ts:79](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/serializers/src/standard-inflectors.ts#L79)

## Functions

### buildInflector

▸ **buildInflector**(`mappings?`, `fallback?`): [`Inflector`](modules.md#inflector)

#### Parameters

| Name | Type |
| :------ | :------ |
| `mappings` | `Dict`<`string`\> |
| `fallback?` | [`Inflector`](modules.md#inflector) |

#### Returns

[`Inflector`](modules.md#inflector)

#### Defined in

[inflector.ts:5](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/serializers/src/inflector.ts#L5)

___

### buildSerializerClassFor

▸ **buildSerializerClassFor**<`S`\>(`serializerClasses?`): [`SerializerClassForFn`](modules.md#serializerclassforfn)<`S`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `S` | [`Serializer`](interfaces/Serializer.md)<`unknown`, `unknown`, `unknown`, `unknown`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `serializerClasses` | `Dict`<[`SerializerClass`](modules.md#serializerclass)<`S`\>\> |

#### Returns

[`SerializerClassForFn`](modules.md#serializerclassforfn)<`S`\>

#### Defined in

[serializer-builders.ts:41](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/serializers/src/serializer-builders.ts#L41)

___

### buildSerializerFor

▸ **buildSerializerFor**<`S`\>(`settings`): [`SerializerForFn`](modules.md#serializerforfn)<`S`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `S` | [`Serializer`](interfaces/Serializer.md)<`unknown`, `unknown`, `unknown`, `unknown`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `settings` | `Object` |
| `settings.serializerClassFor?` | [`SerializerClassForFn`](modules.md#serializerclassforfn)<`S`\> |
| `settings.serializerSettingsFor?` | [`SerializerSettingsForFn`](modules.md#serializersettingsforfn) |
| `settings.serializers?` | `Dict`<`S`\> |

#### Returns

[`SerializerForFn`](modules.md#serializerforfn)<`S`\>

#### Defined in

[serializer-builders.ts:6](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/serializers/src/serializer-builders.ts#L6)

___

### buildSerializerSettingsFor

▸ **buildSerializerSettingsFor**(`settings`): [`SerializerSettingsForFn`](modules.md#serializersettingsforfn)

#### Parameters

| Name | Type |
| :------ | :------ |
| `settings` | `Object` |
| `settings.settingsByType?` | `Dict`<`Dict`<`unknown`\>\> |
| `settings.sharedSettings?` | `Dict`<`unknown`\> |

#### Returns

[`SerializerSettingsForFn`](modules.md#serializersettingsforfn)

#### Defined in

[serializer-builders.ts:51](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/serializers/src/serializer-builders.ts#L51)

___

### camelize

▸ **camelize**(`str`): `string`

Convert underscored, dasherized, or space-delimited words into
lowerCamelCase.

#### Parameters

| Name | Type |
| :------ | :------ |
| `str` | `string` |

#### Returns

`string`

#### Defined in

[standard-inflectors.ts:12](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/serializers/src/standard-inflectors.ts#L12)

___

### capitalize

▸ **capitalize**(`str`): `string`

Uppercase the first letter of a string, but don't change the remainder.

#### Parameters

| Name | Type |
| :------ | :------ |
| `str` | `string` |

#### Returns

`string`

#### Defined in

[standard-inflectors.ts:4](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/serializers/src/standard-inflectors.ts#L4)

___

### dasherize

▸ **dasherize**(`str`): `string`

Dasherize words that are underscored, space-delimited, or camelCased.

#### Parameters

| Name | Type |
| :------ | :------ |
| `str` | `string` |

#### Returns

`string`

#### Defined in

[standard-inflectors.ts:32](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/serializers/src/standard-inflectors.ts#L32)

___

### decamelize

▸ **decamelize**(`str`): `string`

Converts a camelized string into all lowercase separated by underscores.

#### Parameters

| Name | Type |
| :------ | :------ |
| `str` | `string` |

#### Returns

`string`

#### Defined in

[standard-inflectors.ts:25](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/serializers/src/standard-inflectors.ts#L25)

___

### pluralize

▸ **pluralize**(`word`): `string`

A naive pluralization method.

#### Parameters

| Name | Type |
| :------ | :------ |
| `word` | `string` |

#### Returns

`string`

#### Defined in

[standard-inflectors.ts:49](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/serializers/src/standard-inflectors.ts#L49)

___

### singularize

▸ **singularize**(`word`): `string`

A naive singularization method.

#### Parameters

| Name | Type |
| :------ | :------ |
| `word` | `string` |

#### Returns

`string`

#### Defined in

[standard-inflectors.ts:56](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/serializers/src/standard-inflectors.ts#L56)

___

### underscore

▸ **underscore**(`str`): `string`

Underscore words that are dasherized, space-delimited, or camelCased.

#### Parameters

| Name | Type |
| :------ | :------ |
| `str` | `string` |

#### Returns

`string`

#### Defined in

[standard-inflectors.ts:39](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/serializers/src/standard-inflectors.ts#L39)
