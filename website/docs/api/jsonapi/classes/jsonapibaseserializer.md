---
id: "JSONAPIBaseSerializer"
title: "Class: JSONAPIBaseSerializer<From, To, SerializationOptions, DeserializationOptions>"
sidebar_label: "JSONAPIBaseSerializer"
sidebar_position: 0
custom_edit_url: null
---

## Type parameters

| Name |
| :------ |
| `From` |
| `To` |
| `SerializationOptions` |
| `DeserializationOptions` |

## Hierarchy

- `BaseSerializer`<`From`, `To`, `SerializationOptions`, `DeserializationOptions`\>

  ↳ **`JSONAPIBaseSerializer`**

  ↳↳ [`JSONAPIDocumentSerializer`](JSONAPIDocumentSerializer.md)

  ↳↳ [`JSONAPIAtomicOperationSerializer`](JSONAPIAtomicOperationSerializer.md)

  ↳↳ [`JSONAPIAtomicOperationsDocumentSerializer`](JSONAPIAtomicOperationsDocumentSerializer.md)

  ↳↳ [`JSONAPIAtomicResultsDocumentSerializer`](JSONAPIAtomicResultsDocumentSerializer.md)

  ↳↳ [`JSONAPIResourceIdentitySerializer`](JSONAPIResourceIdentitySerializer.md)

  ↳↳ [`JSONAPIResourceSerializer`](JSONAPIResourceSerializer.md)

## Constructors

### constructor

• **new JSONAPIBaseSerializer**<`From`, `To`, `SerializationOptions`, `DeserializationOptions`\>(`settings`)

#### Type parameters

| Name |
| :------ |
| `From` |
| `To` |
| `SerializationOptions` |
| `DeserializationOptions` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `settings` | `Object` |
| `settings.deserializationOptions?` | `DeserializationOptions` |
| `settings.keyMap?` | `RecordKeyMap` |
| `settings.schema` | `RecordSchema` |
| `settings.serializationOptions?` | `SerializationOptions` |
| `settings.serializerFor` | `SerializerForFn`<`Serializer`<`unknown`, `unknown`, `unknown`, `unknown`\>\> |

#### Overrides

BaseSerializer&lt;
  From,
  To,
  SerializationOptions,
  DeserializationOptions
\&gt;.constructor

#### Defined in

[packages/@orbit/jsonapi/src/serializers/jsonapi-base-serializer.ts:31](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/serializers/jsonapi-base-serializer.ts#L31)

## Properties

### serializerFor

• **serializerFor**: `SerializerForFn`<`Serializer`<`unknown`, `unknown`, `unknown`, `unknown`\>\>

#### Overrides

BaseSerializer.serializerFor

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

▸ `Abstract` **deserialize**(`arg`, `options?`): `From`

#### Parameters

| Name | Type |
| :------ | :------ |
| `arg` | `To` |
| `options?` | `DeserializationOptions` |

#### Returns

`From`

#### Inherited from

BaseSerializer.deserialize

#### Defined in

packages/@orbit/serializers/dist/modules/base-serializer.d.ts:15

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

#### Inherited from

BaseSerializer.serialize

#### Defined in

packages/@orbit/serializers/dist/modules/base-serializer.d.ts:14
