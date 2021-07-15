---
id: "StringSerializer"
title: "Class: StringSerializer"
sidebar_label: "StringSerializer"
sidebar_position: 0
custom_edit_url: null
---

## Hierarchy

- [`BaseSerializer`](BaseSerializer.md)<`string`, `string`, [`StringSerializationOptions`](../interfaces/StringSerializationOptions.md), [`StringSerializationOptions`](../interfaces/StringSerializationOptions.md)\>

  ↳ **`StringSerializer`**

## Constructors

### constructor

• **new StringSerializer**(`settings?`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `settings?` | [`StringSerializerSettings`](../interfaces/StringSerializerSettings.md) |

#### Overrides

[BaseSerializer](BaseSerializer.md).[constructor](BaseSerializer.md#constructor)

#### Defined in

[string-serializer.ts:32](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/serializers/src/string-serializer.ts#L32)

## Properties

### inflectors

• **inflectors**: `Dict`<[`Inflector`](../modules.md#inflector)\>

#### Defined in

[string-serializer.ts:29](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/serializers/src/string-serializer.ts#L29)

___

### inverseInflectors

• **inverseInflectors**: `Dict`<[`InflectorOrName`](../modules.md#inflectororname)\>

#### Defined in

[string-serializer.ts:30](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/serializers/src/string-serializer.ts#L30)

___

### serializerFor

• `Optional` **serializerFor**: [`SerializerForFn`](../modules.md#serializerforfn)<[`Serializer`](../interfaces/Serializer.md)<`unknown`, `unknown`, `unknown`, `unknown`\>\>

#### Inherited from

[BaseSerializer](BaseSerializer.md).[serializerFor](BaseSerializer.md#serializerfor)

#### Defined in

[base-serializer.ts:11](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/serializers/src/base-serializer.ts#L11)

## Methods

### deserialize

▸ **deserialize**(`arg`, `customOptions?`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `arg` | `string` |
| `customOptions?` | [`StringSerializationOptions`](../interfaces/StringSerializationOptions.md) |

#### Returns

`string`

#### Overrides

[BaseSerializer](BaseSerializer.md).[deserialize](BaseSerializer.md#deserialize)

#### Defined in

[string-serializer.ts:63](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/serializers/src/string-serializer.ts#L63)

___

### serialize

▸ **serialize**(`arg`, `customOptions?`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `arg` | `string` |
| `customOptions?` | [`StringSerializationOptions`](../interfaces/StringSerializationOptions.md) |

#### Returns

`string`

#### Overrides

[BaseSerializer](BaseSerializer.md).[serialize](BaseSerializer.md#serialize)

#### Defined in

[string-serializer.ts:49](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/serializers/src/string-serializer.ts#L49)
