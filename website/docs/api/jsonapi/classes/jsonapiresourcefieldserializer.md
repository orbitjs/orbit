---
id: "JSONAPIResourceFieldSerializer"
title: "Class: JSONAPIResourceFieldSerializer"
sidebar_label: "JSONAPIResourceFieldSerializer"
sidebar_position: 0
custom_edit_url: null
---

## Hierarchy

- `StringSerializer`

  ↳ **`JSONAPIResourceFieldSerializer`**

## Constructors

### constructor

• **new JSONAPIResourceFieldSerializer**(`settings?`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `settings?` | `StringSerializerSettings` |

#### Inherited from

StringSerializer.constructor

#### Defined in

packages/@orbit/serializers/dist/modules/string-serializer.d.ts:18

## Properties

### inflectors

• **inflectors**: `Dict`<`Inflector`\>

#### Inherited from

StringSerializer.inflectors

#### Defined in

packages/@orbit/serializers/dist/modules/string-serializer.d.ts:16

___

### inverseInflectors

• **inverseInflectors**: `Dict`<`InflectorOrName`\>

#### Inherited from

StringSerializer.inverseInflectors

#### Defined in

packages/@orbit/serializers/dist/modules/string-serializer.d.ts:17

___

### serializerFor

• `Optional` **serializerFor**: `SerializerForFn`<`Serializer`<`unknown`, `unknown`, `unknown`, `unknown`\>\>

#### Inherited from

StringSerializer.serializerFor

#### Defined in

packages/@orbit/serializers/dist/modules/base-serializer.d.ts:4

## Methods

### deserialize

▸ **deserialize**(`arg`, `customOptions?`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `arg` | `string` |
| `customOptions?` | [`JSONAPIResourceFieldSerializationOptions`](../interfaces/JSONAPIResourceFieldSerializationOptions.md) |

#### Returns

`string`

#### Overrides

StringSerializer.deserialize

#### Defined in

[packages/@orbit/jsonapi/src/serializers/jsonapi-resource-field-serializer.ts:19](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/serializers/jsonapi-resource-field-serializer.ts#L19)

___

### serialize

▸ **serialize**(`arg`, `customOptions?`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `arg` | `string` |
| `customOptions?` | [`JSONAPIResourceFieldSerializationOptions`](../interfaces/JSONAPIResourceFieldSerializationOptions.md) |

#### Returns

`string`

#### Overrides

StringSerializer.serialize

#### Defined in

[packages/@orbit/jsonapi/src/serializers/jsonapi-resource-field-serializer.ts:12](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/serializers/jsonapi-resource-field-serializer.ts#L12)
