---
id: "BaseSerializer"
title: "Class: BaseSerializer<From, To, SerializationOptions, DeserializationOptions>"
sidebar_label: "BaseSerializer"
sidebar_position: 0
custom_edit_url: null
---

## Type parameters

| Name | Type |
| :------ | :------ |
| `From` | `From` |
| `To` | `To` |
| `SerializationOptions` | `unknown` |
| `DeserializationOptions` | `unknown` |

## Hierarchy

- **`BaseSerializer`**

  ↳ [`BooleanSerializer`](BooleanSerializer.md)

  ↳ [`DateSerializer`](DateSerializer.md)

  ↳ [`DateTimeSerializer`](DateTimeSerializer.md)

  ↳ [`NumberSerializer`](NumberSerializer.md)

  ↳ [`StringSerializer`](StringSerializer.md)

## Implements

- [`Serializer`](../interfaces/Serializer.md)<`From`, `To`, `SerializationOptions`, `DeserializationOptions`\>

## Constructors

### constructor

• **new BaseSerializer**<`From`, `To`, `SerializationOptions`, `DeserializationOptions`\>(`settings?`)

#### Type parameters

| Name | Type |
| :------ | :------ |
| `From` | `From` |
| `To` | `To` |
| `SerializationOptions` | `unknown` |
| `DeserializationOptions` | `unknown` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `settings?` | `Object` |
| `settings.deserializationOptions?` | `DeserializationOptions` |
| `settings.serializationOptions?` | `SerializationOptions` |
| `settings.serializerFor?` | [`SerializerForFn`](../modules.md#serializerforfn)<[`Serializer`](../interfaces/Serializer.md)<`unknown`, `unknown`, `unknown`, `unknown`\>\> |

#### Defined in

[base-serializer.ts:15](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/serializers/src/base-serializer.ts#L15)

## Properties

### serializerFor

• `Optional` **serializerFor**: [`SerializerForFn`](../modules.md#serializerforfn)<[`Serializer`](../interfaces/Serializer.md)<`unknown`, `unknown`, `unknown`, `unknown`\>\>

#### Defined in

[base-serializer.ts:11](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/serializers/src/base-serializer.ts#L11)

## Methods

### deserialize

▸ `Abstract` **deserialize**(`arg`, `options?`): `From`

#### Parameters

| Name | Type |
| :------ | :------ |
| `arg` | `To` |
| `options?` | `DeserializationOptions` |

#### Returns

`From`

#### Implementation of

[Serializer](../interfaces/Serializer.md).[deserialize](../interfaces/Serializer.md#deserialize)

#### Defined in

[base-serializer.ts:54](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/serializers/src/base-serializer.ts#L54)

___

### serialize

▸ `Abstract` **serialize**(`arg`, `options?`): `To`

#### Parameters

| Name | Type |
| :------ | :------ |
| `arg` | `From` |
| `options?` | `SerializationOptions` |

#### Returns

`To`

#### Implementation of

[Serializer](../interfaces/Serializer.md).[serialize](../interfaces/Serializer.md#serialize)

#### Defined in

[base-serializer.ts:53](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/serializers/src/base-serializer.ts#L53)
