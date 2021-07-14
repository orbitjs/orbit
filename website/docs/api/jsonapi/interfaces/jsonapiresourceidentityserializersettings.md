---
id: "JSONAPIResourceIdentitySerializerSettings"
title: "Interface: JSONAPIResourceIdentitySerializerSettings"
sidebar_label: "JSONAPIResourceIdentitySerializerSettings"
sidebar_position: 0
custom_edit_url: null
---

## Properties

### deserializationOptions

• `Optional` **deserializationOptions**: [`JSONAPIResourceIdentityDeserializationOptions`](JSONAPIResourceIdentityDeserializationOptions.md)

#### Defined in

[packages/@orbit/jsonapi/src/serializers/jsonapi-resource-identity-serializer.ts:17](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/serializers/jsonapi-resource-identity-serializer.ts#L17)

___

### keyMap

• `Optional` **keyMap**: `RecordKeyMap`

#### Defined in

[packages/@orbit/jsonapi/src/serializers/jsonapi-resource-identity-serializer.ts:19](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/serializers/jsonapi-resource-identity-serializer.ts#L19)

___

### schema

• **schema**: `RecordSchema`

#### Defined in

[packages/@orbit/jsonapi/src/serializers/jsonapi-resource-identity-serializer.ts:18](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/serializers/jsonapi-resource-identity-serializer.ts#L18)

___

### serializerFor

• **serializerFor**: `SerializerForFn`<`Serializer`<`unknown`, `unknown`, `unknown`, `unknown`\>\>

#### Defined in

[packages/@orbit/jsonapi/src/serializers/jsonapi-resource-identity-serializer.ts:16](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/serializers/jsonapi-resource-identity-serializer.ts#L16)

## Methods

### getResourceKey

▸ `Optional` **getResourceKey**(`recordType`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `recordType` | `string` |

#### Returns

`string`

#### Defined in

[packages/@orbit/jsonapi/src/serializers/jsonapi-resource-identity-serializer.ts:20](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/serializers/jsonapi-resource-identity-serializer.ts#L20)
