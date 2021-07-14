---
id: "JSONAPIResourceIdentitySerializer"
title: "Class: JSONAPIResourceIdentitySerializer"
sidebar_label: "JSONAPIResourceIdentitySerializer"
sidebar_position: 0
custom_edit_url: null
---

## Hierarchy

- [`JSONAPIBaseSerializer`](JSONAPIBaseSerializer.md)<`InitializedRecord`, [`Resource`](../interfaces/Resource.md), `unknown`, [`JSONAPIResourceIdentityDeserializationOptions`](../interfaces/JSONAPIResourceIdentityDeserializationOptions.md)\>

  ↳ **`JSONAPIResourceIdentitySerializer`**

## Constructors

### constructor

• **new JSONAPIResourceIdentitySerializer**(`settings`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `settings` | [`JSONAPIResourceIdentitySerializerSettings`](../interfaces/JSONAPIResourceIdentitySerializerSettings.md) |

#### Overrides

[JSONAPIBaseSerializer](JSONAPIBaseSerializer.md).[constructor](JSONAPIBaseSerializer.md#constructor)

#### Defined in

[packages/@orbit/jsonapi/src/serializers/jsonapi-resource-identity-serializer.ts:62](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/serializers/jsonapi-resource-identity-serializer.ts#L62)

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

▸ **deserialize**(`resource`, `customOptions?`): `InitializedRecord`

#### Parameters

| Name | Type |
| :------ | :------ |
| `resource` | [`Resource`](../interfaces/Resource.md) |
| `customOptions?` | [`JSONAPIResourceIdentityDeserializationOptions`](../interfaces/JSONAPIResourceIdentityDeserializationOptions.md) |

#### Returns

`InitializedRecord`

#### Overrides

[JSONAPIBaseSerializer](JSONAPIBaseSerializer.md).[deserialize](JSONAPIBaseSerializer.md#deserialize)

#### Defined in

[packages/@orbit/jsonapi/src/serializers/jsonapi-resource-identity-serializer.ts:99](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/serializers/jsonapi-resource-identity-serializer.ts#L99)

___

### getResourceKey

▸ **getResourceKey**(`type`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `type` | `string` |

#### Returns

`string`

#### Defined in

[packages/@orbit/jsonapi/src/serializers/jsonapi-resource-identity-serializer.ts:32](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/serializers/jsonapi-resource-identity-serializer.ts#L32)

___

### serialize

▸ **serialize**(`recordIdentity`): [`Resource`](../interfaces/Resource.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `recordIdentity` | `InitializedRecord` |

#### Returns

[`Resource`](../interfaces/Resource.md)

#### Overrides

[JSONAPIBaseSerializer](JSONAPIBaseSerializer.md).[serialize](JSONAPIBaseSerializer.md#serialize)

#### Defined in

[packages/@orbit/jsonapi/src/serializers/jsonapi-resource-identity-serializer.ts:80](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/serializers/jsonapi-resource-identity-serializer.ts#L80)
