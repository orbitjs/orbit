---
id: "JSONAPIAtomicOperationsDocumentSerializer"
title: "Class: JSONAPIAtomicOperationsDocumentSerializer"
sidebar_label: "JSONAPIAtomicOperationsDocumentSerializer"
sidebar_position: 0
custom_edit_url: null
---

## Hierarchy

- [`JSONAPIBaseSerializer`](JSONAPIBaseSerializer.md)<[`RecordOperationsDocument`](../interfaces/RecordOperationsDocument.md), [`ResourceAtomicOperationsDocument`](../interfaces/ResourceAtomicOperationsDocument.md), `unknown`, `unknown`\>

  ↳ **`JSONAPIAtomicOperationsDocumentSerializer`**

## Constructors

### constructor

• **new JSONAPIAtomicOperationsDocumentSerializer**(`settings`)

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

▸ **deserialize**(`document`): [`RecordOperationsDocument`](../interfaces/RecordOperationsDocument.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `document` | [`ResourceAtomicOperationsDocument`](../interfaces/ResourceAtomicOperationsDocument.md) |

#### Returns

[`RecordOperationsDocument`](../interfaces/RecordOperationsDocument.md)

#### Overrides

[JSONAPIBaseSerializer](JSONAPIBaseSerializer.md).[deserialize](JSONAPIBaseSerializer.md#deserialize)

#### Defined in

[packages/@orbit/jsonapi/src/serializers/jsonapi-atomic-operations-document-serializer.ts:54](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/serializers/jsonapi-atomic-operations-document-serializer.ts#L54)

___

### deserializeAtomicOperation

▸ **deserializeAtomicOperation**(`operation`): `RecordOperation`

#### Parameters

| Name | Type |
| :------ | :------ |
| `operation` | [`ResourceAtomicOperation`](../interfaces/ResourceAtomicOperation.md) |

#### Returns

`RecordOperation`

#### Defined in

[packages/@orbit/jsonapi/src/serializers/jsonapi-atomic-operations-document-serializer.ts:77](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/serializers/jsonapi-atomic-operations-document-serializer.ts#L77)

___

### deserializeAtomicOperations

▸ **deserializeAtomicOperations**(`operations`): `RecordOperation`[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `operations` | [`ResourceAtomicOperation`](../interfaces/ResourceAtomicOperation.md)[] |

#### Returns

`RecordOperation`[]

#### Defined in

[packages/@orbit/jsonapi/src/serializers/jsonapi-atomic-operations-document-serializer.ts:69](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/serializers/jsonapi-atomic-operations-document-serializer.ts#L69)

___

### serialize

▸ **serialize**(`document`): [`ResourceAtomicOperationsDocument`](../interfaces/ResourceAtomicOperationsDocument.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `document` | [`RecordOperationsDocument`](../interfaces/RecordOperationsDocument.md) |

#### Returns

[`ResourceAtomicOperationsDocument`](../interfaces/ResourceAtomicOperationsDocument.md)

#### Overrides

[JSONAPIBaseSerializer](JSONAPIBaseSerializer.md).[serialize](JSONAPIBaseSerializer.md#serialize)

#### Defined in

[packages/@orbit/jsonapi/src/serializers/jsonapi-atomic-operations-document-serializer.ts:15](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/serializers/jsonapi-atomic-operations-document-serializer.ts#L15)
