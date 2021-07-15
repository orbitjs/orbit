---
id: "JSONAPIRequestProcessorSettings"
title: "Interface: JSONAPIRequestProcessorSettings"
sidebar_label: "JSONAPIRequestProcessorSettings"
sidebar_position: 0
custom_edit_url: null
---

## Properties

### SerializerClass

• `Optional` **SerializerClass**: (`settings`: [`JSONAPISerializerSettings`](JSONAPISerializerSettings.md)) => [`JSONAPISerializer`](../classes/JSONAPISerializer.md)

#### Type declaration

• **new JSONAPIRequestProcessorSettings**(`settings`)

##### Parameters

| Name | Type |
| :------ | :------ |
| `settings` | [`JSONAPISerializerSettings`](JSONAPISerializerSettings.md) |

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-request-processor.ts:67](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-request-processor.ts#L67)

___

### URLBuilderClass

• `Optional` **URLBuilderClass**: (`settings`: [`JSONAPIURLBuilderSettings`](JSONAPIURLBuilderSettings.md)) => [`JSONAPIURLBuilder`](../classes/JSONAPIURLBuilder.md)

#### Type declaration

• **new JSONAPIRequestProcessorSettings**(`settings`)

##### Parameters

| Name | Type |
| :------ | :------ |
| `settings` | [`JSONAPIURLBuilderSettings`](JSONAPIURLBuilderSettings.md) |

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-request-processor.ts:70](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-request-processor.ts#L70)

___

### allowedContentTypes

• `Optional` **allowedContentTypes**: `string`[]

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-request-processor.ts:76](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-request-processor.ts#L76)

___

### defaultFetchSettings

• `Optional` **defaultFetchSettings**: [`FetchSettings`](FetchSettings.md)

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-request-processor.ts:75](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-request-processor.ts#L75)

___

### host

• `Optional` **host**: `string`

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-request-processor.ts:74](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-request-processor.ts#L74)

___

### keyMap

• `Optional` **keyMap**: `RecordKeyMap`

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-request-processor.ts:78](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-request-processor.ts#L78)

___

### namespace

• `Optional` **namespace**: `string`

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-request-processor.ts:73](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-request-processor.ts#L73)

___

### schema

• **schema**: `RecordSchema`

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-request-processor.ts:77](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-request-processor.ts#L77)

___

### serializerClassFor

• `Optional` **serializerClassFor**: `SerializerClassForFn`<`Serializer`<`unknown`, `unknown`, `unknown`, `unknown`\>\>

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-request-processor.ts:65](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-request-processor.ts#L65)

___

### serializerFor

• `Optional` **serializerFor**: `SerializerForFn`<`Serializer`<`unknown`, `unknown`, `unknown`, `unknown`\>\>

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-request-processor.ts:64](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-request-processor.ts#L64)

___

### serializerSettingsFor

• `Optional` **serializerSettingsFor**: `SerializerSettingsForFn`

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-request-processor.ts:66](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-request-processor.ts#L66)

___

### sourceName

• **sourceName**: `string`

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-request-processor.ts:63](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-request-processor.ts#L63)
