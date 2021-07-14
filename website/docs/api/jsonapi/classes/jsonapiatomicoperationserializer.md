---
id: "JSONAPIAtomicOperationSerializer"
title: "Class: JSONAPIAtomicOperationSerializer"
sidebar_label: "JSONAPIAtomicOperationSerializer"
sidebar_position: 0
custom_edit_url: null
---

## Hierarchy

- [`JSONAPIBaseSerializer`](JSONAPIBaseSerializer.md)<`RecordOperation`, [`ResourceAtomicOperation`](../interfaces/ResourceAtomicOperation.md), `unknown`, `unknown`\>

  ↳ **`JSONAPIAtomicOperationSerializer`**

## Constructors

### constructor

• **new JSONAPIAtomicOperationSerializer**(`settings`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `settings` | `Object` |
| `settings.deserializationOptions?` | `unknown` |
| `settings.keyMap?` | `RecordKeyMap` |
| `settings.schema` | `RecordSchema` |
| `settings.serializationOptions?` | `unknown` |
| `settings.serializerFor` | `SerializerForFn`<`Serializer`<`unknown`, `unknown`, `unknown`, `unknown`\>\> |

#### Inherited from

[JSONAPIBaseSerializer](JSONAPIBaseSerializer.md).[constructor](JSONAPIBaseSerializer.md#constructor)

#### Defined in

[packages/@orbit/jsonapi/src/serializers/jsonapi-base-serializer.ts:31](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/serializers/jsonapi-base-serializer.ts#L31)

## Properties

### serializerFor

• **serializerFor**: `SerializerForFn`<`Serializer`<`unknown`, `unknown`, `unknown`, `unknown`\>\>

#### Inherited from

[JSONAPIBaseSerializer](JSONAPIBaseSerializer.md).[serializerFor](JSONAPIBaseSerializer.md#serializerfor)

#### Defined in

[packages/@orbit/jsonapi/src/serializers/jsonapi-base-serializer.ts:27](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/serializers/jsonapi-base-serializer.ts#L27)

## Accessors

### keyMap

• `get` **keyMap**(): `undefined` \| `RecordKeyMap`

#### Returns

`undefined` \| `RecordKeyMap`

#### Defined in

[packages/@orbit/jsonapi/src/serializers/jsonapi-base-serializer.ts:58](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/serializers/jsonapi-base-serializer.ts#L58)

___

### schema

• `get` **schema**(): `RecordSchema`

#### Returns

`RecordSchema`

#### Defined in

[packages/@orbit/jsonapi/src/serializers/jsonapi-base-serializer.ts:54](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/serializers/jsonapi-base-serializer.ts#L54)

## Methods

### deserialize

▸ **deserialize**(`operation`): `RecordOperation`

#### Parameters

| Name | Type |
| :------ | :------ |
| `operation` | [`ResourceAtomicOperation`](../interfaces/ResourceAtomicOperation.md) |

#### Returns

`RecordOperation`

#### Overrides

[JSONAPIBaseSerializer](JSONAPIBaseSerializer.md).[deserialize](JSONAPIBaseSerializer.md#deserialize)

#### Defined in

[packages/@orbit/jsonapi/src/serializers/jsonapi-atomic-operation-serializer.ts:57](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/serializers/jsonapi-atomic-operation-serializer.ts#L57)

___

### serialize

▸ **serialize**(`operation`): [`ResourceAtomicOperation`](../interfaces/ResourceAtomicOperation.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `operation` | `RecordOperation` |

#### Returns

[`ResourceAtomicOperation`](../interfaces/ResourceAtomicOperation.md)

#### Overrides

[JSONAPIBaseSerializer](JSONAPIBaseSerializer.md).[serialize](JSONAPIBaseSerializer.md#serialize)

#### Defined in

[packages/@orbit/jsonapi/src/serializers/jsonapi-atomic-operation-serializer.ts:32](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/serializers/jsonapi-atomic-operation-serializer.ts#L32)
