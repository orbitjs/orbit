---
id: "JSONAPIAtomicResultsDocumentSerializer"
title: "Class: JSONAPIAtomicResultsDocumentSerializer"
sidebar_label: "JSONAPIAtomicResultsDocumentSerializer"
sidebar_position: 0
custom_edit_url: null
---

## Hierarchy

- [`JSONAPIBaseSerializer`](JSONAPIBaseSerializer.md)<[`RecordResultsDocument`](../interfaces/RecordResultsDocument.md), [`ResourceAtomicResultsDocument`](../interfaces/ResourceAtomicResultsDocument.md), `unknown`, `unknown`\>

  ↳ **`JSONAPIAtomicResultsDocumentSerializer`**

## Constructors

### constructor

• **new JSONAPIAtomicResultsDocumentSerializer**(`settings`)

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

▸ **deserialize**(`document`): [`RecordResultsDocument`](../interfaces/RecordResultsDocument.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `document` | [`ResourceAtomicResultsDocument`](../interfaces/ResourceAtomicResultsDocument.md) |

#### Returns

[`RecordResultsDocument`](../interfaces/RecordResultsDocument.md)

#### Overrides

[JSONAPIBaseSerializer](JSONAPIBaseSerializer.md).[deserialize](JSONAPIBaseSerializer.md#deserialize)

#### Defined in

[packages/@orbit/jsonapi/src/serializers/jsonapi-atomic-results-document-serializer.ts:42](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/serializers/jsonapi-atomic-results-document-serializer.ts#L42)

___

### deserializeAtomicResults

▸ **deserializeAtomicResults**(`results`): `InitializedRecord`[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `results` | [`Resource`](../interfaces/Resource.md)[] |

#### Returns

`InitializedRecord`[]

#### Defined in

[packages/@orbit/jsonapi/src/serializers/jsonapi-atomic-results-document-serializer.ts:53](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/serializers/jsonapi-atomic-results-document-serializer.ts#L53)

___

### serialize

▸ **serialize**(`document`): [`ResourceAtomicResultsDocument`](../interfaces/ResourceAtomicResultsDocument.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `document` | [`RecordResultsDocument`](../interfaces/RecordResultsDocument.md) |

#### Returns

[`ResourceAtomicResultsDocument`](../interfaces/ResourceAtomicResultsDocument.md)

#### Overrides

[JSONAPIBaseSerializer](JSONAPIBaseSerializer.md).[serialize](JSONAPIBaseSerializer.md#serialize)

#### Defined in

[packages/@orbit/jsonapi/src/serializers/jsonapi-atomic-results-document-serializer.ts:15](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/serializers/jsonapi-atomic-results-document-serializer.ts#L15)

___

### serializeResults

▸ **serializeResults**(`results`): [`Resource`](../interfaces/Resource.md)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `results` | `InitializedRecord`[] |

#### Returns

[`Resource`](../interfaces/Resource.md)[]

#### Defined in

[packages/@orbit/jsonapi/src/serializers/jsonapi-atomic-results-document-serializer.ts:26](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/serializers/jsonapi-atomic-results-document-serializer.ts#L26)
