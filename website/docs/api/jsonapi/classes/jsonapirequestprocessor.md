---
id: "JSONAPIRequestProcessor"
title: "Class: JSONAPIRequestProcessor"
sidebar_label: "JSONAPIRequestProcessor"
sidebar_position: 0
custom_edit_url: null
---

## Constructors

### constructor

• **new JSONAPIRequestProcessor**(`settings`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `settings` | [`JSONAPIRequestProcessorSettings`](../interfaces/JSONAPIRequestProcessorSettings.md) |

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-request-processor.ts:91](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-request-processor.ts#L91)

## Properties

### allowedContentTypes

• **allowedContentTypes**: `string`[]

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-request-processor.ts:84](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-request-processor.ts#L84)

___

### defaultFetchSettings

• **defaultFetchSettings**: [`FetchSettings`](../interfaces/FetchSettings.md)

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-request-processor.ts:85](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-request-processor.ts#L85)

___

### keyMap

• `Optional` **keyMap**: `RecordKeyMap`

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-request-processor.ts:87](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-request-processor.ts#L87)

___

### schema

• **schema**: `RecordSchema`

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-request-processor.ts:86](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-request-processor.ts#L86)

___

### sourceName

• **sourceName**: `string`

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-request-processor.ts:82](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-request-processor.ts#L82)

___

### urlBuilder

• **urlBuilder**: [`JSONAPIURLBuilder`](JSONAPIURLBuilder.md)

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-request-processor.ts:83](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-request-processor.ts#L83)

## Accessors

### serializer

• `get` **serializer**(): [`JSONAPISerializer`](JSONAPISerializer.md)

#### Returns

[`JSONAPISerializer`](JSONAPISerializer.md)

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-request-processor.ts:138](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-request-processor.ts#L138)

___

### serializerFor

• `get` **serializerFor**(): `SerializerForFn`<`Serializer`<`unknown`, `unknown`, `unknown`, `unknown`\>\>

#### Returns

`SerializerForFn`<`Serializer`<`unknown`, `unknown`, `unknown`, `unknown`\>\>

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-request-processor.ts:151](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-request-processor.ts#L151)

## Methods

### buildFetchSettings

▸ **buildFetchSettings**(`options?`, `customSettings?`): [`FetchSettings`](../interfaces/FetchSettings.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`JSONAPIRequestOptions`](../interfaces/JSONAPIRequestOptions.md) |
| `customSettings?` | [`FetchSettings`](../interfaces/FetchSettings.md) |

#### Returns

[`FetchSettings`](../interfaces/FetchSettings.md)

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-request-processor.ts:245](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-request-processor.ts#L245)

___

### customRequestOptions

▸ **customRequestOptions**(`queryOrTransform`, `queryExpressionOrOperation`): `undefined` \| [`JSONAPIRequestOptions`](../interfaces/JSONAPIRequestOptions.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `queryOrTransform` | `RecordTransform` \| `RecordQuery` |
| `queryExpressionOrOperation` | `AddRecordOperation` \| `UpdateRecordOperation` \| `RemoveRecordOperation` \| `ReplaceKeyOperation` \| `ReplaceAttributeOperation` \| `AddToRelatedRecordsOperation` \| `RemoveFromRelatedRecordsOperation` \| `ReplaceRelatedRecordsOperation` \| `ReplaceRelatedRecordOperation` \| `FindRecord` \| `FindRelatedRecord` \| `FindRelatedRecords` \| `FindRecords` |

#### Returns

`undefined` \| [`JSONAPIRequestOptions`](../interfaces/JSONAPIRequestOptions.md)

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-request-processor.ts:252](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-request-processor.ts#L252)

___

### fetch

▸ **fetch**(`url`, `customSettings?`): `Promise`<[`JSONAPIResponse`](../interfaces/JSONAPIResponse.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `url` | `string` |
| `customSettings?` | [`FetchSettings`](../interfaces/FetchSettings.md) |

#### Returns

`Promise`<[`JSONAPIResponse`](../interfaces/JSONAPIResponse.md)\>

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-request-processor.ts:155](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-request-processor.ts#L155)

___

### initFetchSettings

▸ **initFetchSettings**(`customSettings?`): [`FetchSettings`](../interfaces/FetchSettings.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `customSettings` | [`FetchSettings`](../interfaces/FetchSettings.md) |

#### Returns

[`FetchSettings`](../interfaces/FetchSettings.md)

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-request-processor.ts:204](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-request-processor.ts#L204)

___

### operationsFromDeserializedDocument

▸ **operationsFromDeserializedDocument**(`deserialized`): `RecordOperation`[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `deserialized` | [`RecordDocument`](../interfaces/RecordDocument.md) |

#### Returns

`RecordOperation`[]

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-request-processor.ts:227](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-request-processor.ts#L227)

___

### preprocessResponseDocument

▸ **preprocessResponseDocument**(`document`, `request`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `document` | `undefined` \| [`ResourceDocument`](../interfaces/ResourceDocument.md) |
| `request` | [`FindRecordRequest`](../interfaces/FindRecordRequest.md) \| [`FindRecordsRequest`](../interfaces/FindRecordsRequest.md) \| [`FindRelatedRecordRequest`](../interfaces/FindRelatedRecordRequest.md) \| [`FindRelatedRecordsRequest`](../interfaces/FindRelatedRecordsRequest.md) \| [`AddRecordRequest`](../interfaces/AddRecordRequest.md) \| [`RemoveRecordRequest`](../interfaces/RemoveRecordRequest.md) \| [`UpdateRecordRequest`](../interfaces/UpdateRecordRequest.md) \| [`AddToRelatedRecordsRequest`](../interfaces/AddToRelatedRecordsRequest.md) \| [`RemoveFromRelatedRecordsRequest`](../interfaces/RemoveFromRelatedRecordsRequest.md) \| [`ReplaceRelatedRecordRequest`](../interfaces/ReplaceRelatedRecordRequest.md) \| [`ReplaceRelatedRecordsRequest`](../interfaces/ReplaceRelatedRecordsRequest.md) |

#### Returns

`void`

#### Defined in

[packages/@orbit/jsonapi/src/jsonapi-request-processor.ts:263](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/jsonapi-request-processor.ts#L263)
