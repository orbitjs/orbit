---
id: "JSONAPIDocumentSerializer"
title: "Class: JSONAPIDocumentSerializer"
sidebar_label: "JSONAPIDocumentSerializer"
sidebar_position: 0
custom_edit_url: null
---

## Hierarchy

- [`JSONAPIBaseSerializer`](JSONAPIBaseSerializer.md)<[`RecordDocument`](../interfaces/RecordDocument.md), [`ResourceDocument`](../interfaces/ResourceDocument.md), `unknown`, [`JSONAPIDocumentDeserializationOptions`](../interfaces/JSONAPIDocumentDeserializationOptions.md)\>

  ↳ **`JSONAPIDocumentSerializer`**

## Constructors

### constructor

• **new JSONAPIDocumentSerializer**(`settings`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `settings` | `Object` |
| `settings.deserializationOptions?` | [`JSONAPIDocumentDeserializationOptions`](../interfaces/JSONAPIDocumentDeserializationOptions.md) |
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

▸ **deserialize**(`resDocument`, `customOptions?`): [`RecordDocument`](../interfaces/RecordDocument.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `resDocument` | [`ResourceDocument`](../interfaces/ResourceDocument.md) |
| `customOptions?` | [`JSONAPIDocumentDeserializationOptions`](../interfaces/JSONAPIDocumentDeserializationOptions.md) |

#### Returns

[`RecordDocument`](../interfaces/RecordDocument.md)

#### Overrides

[JSONAPIBaseSerializer](JSONAPIBaseSerializer.md).[deserialize](JSONAPIBaseSerializer.md#deserialize)

#### Defined in

[packages/@orbit/jsonapi/src/serializers/jsonapi-document-serializer.ts:30](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/serializers/jsonapi-document-serializer.ts#L30)

___

### serialize

▸ **serialize**(`document`): [`ResourceDocument`](../interfaces/ResourceDocument.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `document` | [`RecordDocument`](../interfaces/RecordDocument.md) |

#### Returns

[`ResourceDocument`](../interfaces/ResourceDocument.md)

#### Overrides

[JSONAPIBaseSerializer](JSONAPIBaseSerializer.md).[serialize](JSONAPIBaseSerializer.md#serialize)

#### Defined in

[packages/@orbit/jsonapi/src/serializers/jsonapi-document-serializer.ts:17](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/serializers/jsonapi-document-serializer.ts#L17)
