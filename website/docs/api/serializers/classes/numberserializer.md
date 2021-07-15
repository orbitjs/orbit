---
id: "NumberSerializer"
title: "Class: NumberSerializer"
sidebar_label: "NumberSerializer"
sidebar_position: 0
custom_edit_url: null
---

## Hierarchy

- [`BaseSerializer`](BaseSerializer.md)<`number`, `number`\>

  ↳ **`NumberSerializer`**

## Constructors

### constructor

• **new NumberSerializer**(`settings?`)

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

▸ **deserialize**(`arg`): `number`

#### Parameters

| Name | Type |
| :------ | :------ |
| `arg` | `number` |

#### Returns

`number`

#### Overrides

[BaseSerializer](BaseSerializer.md).[deserialize](BaseSerializer.md#deserialize)

#### Defined in

[number-serializer.ts:8](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/serializers/src/number-serializer.ts#L8)

___

### serialize

▸ **serialize**(`arg`): `number`

#### Parameters

| Name | Type |
| :------ | :------ |
| `arg` | `number` |

#### Returns

`number`

#### Overrides

[BaseSerializer](BaseSerializer.md).[serialize](BaseSerializer.md#serialize)

#### Defined in

[number-serializer.ts:4](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/serializers/src/number-serializer.ts#L4)
