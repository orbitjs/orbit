---
id: "BooleanSerializer"
title: "Class: BooleanSerializer"
sidebar_label: "BooleanSerializer"
sidebar_position: 0
custom_edit_url: null
---

## Hierarchy

- [`BaseSerializer`](BaseSerializer.md)<`boolean`, `boolean`\>

  ↳ **`BooleanSerializer`**

## Constructors

### constructor

• **new BooleanSerializer**(`settings?`)

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

▸ **deserialize**(`arg`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `arg` | `boolean` |

#### Returns

`boolean`

#### Overrides

[BaseSerializer](BaseSerializer.md).[deserialize](BaseSerializer.md#deserialize)

#### Defined in

[boolean-serializer.ts:8](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/serializers/src/boolean-serializer.ts#L8)

___

### serialize

▸ **serialize**(`arg`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `arg` | `boolean` |

#### Returns

`boolean`

#### Overrides

[BaseSerializer](BaseSerializer.md).[serialize](BaseSerializer.md#serialize)

#### Defined in

[boolean-serializer.ts:4](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/serializers/src/boolean-serializer.ts#L4)
