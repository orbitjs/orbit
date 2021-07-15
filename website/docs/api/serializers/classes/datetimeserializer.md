---
id: "DateTimeSerializer"
title: "Class: DateTimeSerializer"
sidebar_label: "DateTimeSerializer"
sidebar_position: 0
custom_edit_url: null
---

## Hierarchy

- [`BaseSerializer`](BaseSerializer.md)<`Date`, `string`\>

  ↳ **`DateTimeSerializer`**

## Constructors

### constructor

• **new DateTimeSerializer**(`settings?`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `settings?` | `Object` |
| `settings.deserializationOptions?` | `unknown` |
| `settings.serializationOptions?` | `unknown` |
| `settings.serializerFor?` | [`SerializerForFn`](../modules.md#serializerforfn)<[`Serializer`](../interfaces/Serializer.md)<`unknown`, `unknown`, `unknown`, `unknown`\>\> |

#### Inherited from

[BaseSerializer](BaseSerializer.md).[constructor](BaseSerializer.md#constructor)

#### Defined in

[base-serializer.ts:15](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/serializers/src/base-serializer.ts#L15)

## Properties

### serializerFor

• `Optional` **serializerFor**: [`SerializerForFn`](../modules.md#serializerforfn)<[`Serializer`](../interfaces/Serializer.md)<`unknown`, `unknown`, `unknown`, `unknown`\>\>

#### Inherited from

[BaseSerializer](BaseSerializer.md).[serializerFor](BaseSerializer.md#serializerfor)

#### Defined in

[base-serializer.ts:11](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/serializers/src/base-serializer.ts#L11)

## Methods

### deserialize

▸ **deserialize**(`arg`): `Date`

#### Parameters

| Name | Type |
| :------ | :------ |
| `arg` | `string` |

#### Returns

`Date`

#### Overrides

[BaseSerializer](BaseSerializer.md).[deserialize](BaseSerializer.md#deserialize)

#### Defined in

[date-time-serializer.ts:8](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/serializers/src/date-time-serializer.ts#L8)

___

### serialize

▸ **serialize**(`arg`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `arg` | `Date` |

#### Returns

`string`

#### Overrides

[BaseSerializer](BaseSerializer.md).[serialize](BaseSerializer.md#serialize)

#### Defined in

[date-time-serializer.ts:4](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/serializers/src/date-time-serializer.ts#L4)
