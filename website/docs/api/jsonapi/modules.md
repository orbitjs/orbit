---
id: "modules"
title: "@orbit/jsonapi"
sidebar_label: "Exports"
sidebar_position: 0.5
custom_edit_url: null
---

## Enumerations

- [JSONAPISerializers](enums/JSONAPISerializers.md)

## Classes

- [InvalidServerResponse](classes/InvalidServerResponse.md)
- [JSONAPIAtomicOperationSerializer](classes/JSONAPIAtomicOperationSerializer.md)
- [JSONAPIAtomicOperationsDocumentSerializer](classes/JSONAPIAtomicOperationsDocumentSerializer.md)
- [JSONAPIAtomicResultsDocumentSerializer](classes/JSONAPIAtomicResultsDocumentSerializer.md)
- [JSONAPIBaseSerializer](classes/JSONAPIBaseSerializer.md)
- [JSONAPIDocumentSerializer](classes/JSONAPIDocumentSerializer.md)
- [JSONAPIRequestProcessor](classes/JSONAPIRequestProcessor.md)
- [JSONAPIResourceFieldSerializer](classes/JSONAPIResourceFieldSerializer.md)
- [JSONAPIResourceIdentitySerializer](classes/JSONAPIResourceIdentitySerializer.md)
- [JSONAPIResourceSerializer](classes/JSONAPIResourceSerializer.md)
- [JSONAPISerializer](classes/JSONAPISerializer.md)
- [JSONAPISource](classes/JSONAPISource.md)
- [JSONAPIURLBuilder](classes/JSONAPIURLBuilder.md)
- [default](classes/default.md)

## Interfaces

- [AddRecordRequest](interfaces/AddRecordRequest.md)
- [AddResourceAtomicOperation](interfaces/AddResourceAtomicOperation.md)
- [AddToRelatedRecordsRequest](interfaces/AddToRelatedRecordsRequest.md)
- [AddToRelatedResourcesAtomicOperation](interfaces/AddToRelatedResourcesAtomicOperation.md)
- [BaseTransformRecordRequest](interfaces/BaseTransformRecordRequest.md)
- [ExpressionToRequestConverter](interfaces/ExpressionToRequestConverter.md)
- [FetchSettings](interfaces/FetchSettings.md)
- [Filter](interfaces/Filter.md)
- [FindRecordRequest](interfaces/FindRecordRequest.md)
- [FindRecordsRequest](interfaces/FindRecordsRequest.md)
- [FindRelatedRecordRequest](interfaces/FindRelatedRecordRequest.md)
- [FindRelatedRecordsRequest](interfaces/FindRelatedRecordsRequest.md)
- [JSONAPIDocumentDeserializationOptions](interfaces/JSONAPIDocumentDeserializationOptions.md)
- [JSONAPIQueryOptions](interfaces/JSONAPIQueryOptions.md)
- [JSONAPIRequestOptions](interfaces/JSONAPIRequestOptions.md)
- [JSONAPIRequestProcessorSettings](interfaces/JSONAPIRequestProcessorSettings.md)
- [JSONAPIResourceFieldSerializationOptions](interfaces/JSONAPIResourceFieldSerializationOptions.md)
- [JSONAPIResourceIdentityDeserializationOptions](interfaces/JSONAPIResourceIdentityDeserializationOptions.md)
- [JSONAPIResourceIdentitySerializerSettings](interfaces/JSONAPIResourceIdentitySerializerSettings.md)
- [JSONAPIResponse](interfaces/JSONAPIResponse.md)
- [JSONAPISerializationOptions](interfaces/JSONAPISerializationOptions.md)
- [JSONAPISerializerSettings](interfaces/JSONAPISerializerSettings.md)
- [JSONAPISourceSettings](interfaces/JSONAPISourceSettings.md)
- [JSONAPITransformOptions](interfaces/JSONAPITransformOptions.md)
- [JSONAPIURLBuilderSettings](interfaces/JSONAPIURLBuilderSettings.md)
- [OperationToRequestConverter](interfaces/OperationToRequestConverter.md)
- [Param](interfaces/Param.md)
- [QueryRequest](interfaces/QueryRequest.md)
- [QueryRequestProcessor](interfaces/QueryRequestProcessor.md)
- [RecordDocument](interfaces/RecordDocument.md)
- [RecordOperationsDocument](interfaces/RecordOperationsDocument.md)
- [RecordResultsDocument](interfaces/RecordResultsDocument.md)
- [RemoveFromRelatedRecordsRequest](interfaces/RemoveFromRelatedRecordsRequest.md)
- [RemoveFromRelatedResourcesAtomicOperation](interfaces/RemoveFromRelatedResourcesAtomicOperation.md)
- [RemoveRecordRequest](interfaces/RemoveRecordRequest.md)
- [RemoveResourceAtomicOperation](interfaces/RemoveResourceAtomicOperation.md)
- [ReplaceRelatedRecordRequest](interfaces/ReplaceRelatedRecordRequest.md)
- [ReplaceRelatedRecordsRequest](interfaces/ReplaceRelatedRecordsRequest.md)
- [ReplaceRelatedResourceAtomicOperation](interfaces/ReplaceRelatedResourceAtomicOperation.md)
- [ReplaceRelatedResourcesAtomicOperation](interfaces/ReplaceRelatedResourcesAtomicOperation.md)
- [Resource](interfaces/Resource.md)
- [ResourceAtomicOperation](interfaces/ResourceAtomicOperation.md)
- [ResourceAtomicOperationsDocument](interfaces/ResourceAtomicOperationsDocument.md)
- [ResourceAtomicResultsDocument](interfaces/ResourceAtomicResultsDocument.md)
- [ResourceDocument](interfaces/ResourceDocument.md)
- [ResourceHasManyRelationship](interfaces/ResourceHasManyRelationship.md)
- [ResourceHasOneRelationship](interfaces/ResourceHasOneRelationship.md)
- [ResourceIdentity](interfaces/ResourceIdentity.md)
- [TransformRecordRelationshipRequest](interfaces/TransformRecordRelationshipRequest.md)
- [TransformRequestProcessor](interfaces/TransformRequestProcessor.md)
- [UpdateRecordRequest](interfaces/UpdateRecordRequest.md)
- [UpdateResourceAtomicOperation](interfaces/UpdateResourceAtomicOperation.md)

## Type aliases

### PrimaryResourceData

Ƭ **PrimaryResourceData**: [`Resource`](interfaces/Resource.md) \| [`Resource`](interfaces/Resource.md)[] \| [`ResourceIdentity`](interfaces/ResourceIdentity.md) \| [`ResourceIdentity`](interfaces/ResourceIdentity.md)[] \| ``null``

#### Defined in

[packages/@orbit/jsonapi/src/resource-document.ts:34](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/resource-document.ts#L34)

___

### QueryRequestProcessorResponse

Ƭ **QueryRequestProcessorResponse**: `FullResponse`<`RecordQueryExpressionResult`, [`JSONAPIResponse`](interfaces/JSONAPIResponse.md), `RecordOperation`\>

#### Defined in

[packages/@orbit/jsonapi/src/lib/query-requests.ts:62](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/lib/query-requests.ts#L62)

___

### RecordDocumentOrDocuments

Ƭ **RecordDocumentOrDocuments**: [`RecordDocument`](interfaces/RecordDocument.md) \| [`RecordDocument`](interfaces/RecordDocument.md)[]

#### Defined in

[packages/@orbit/jsonapi/src/record-document.ts:11](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/record-document.ts#L11)

___

### RecordQueryRequest

Ƭ **RecordQueryRequest**: [`FindRecordRequest`](interfaces/FindRecordRequest.md) \| [`FindRecordsRequest`](interfaces/FindRecordsRequest.md) \| [`FindRelatedRecordRequest`](interfaces/FindRelatedRecordRequest.md) \| [`FindRelatedRecordsRequest`](interfaces/FindRelatedRecordsRequest.md)

#### Defined in

[packages/@orbit/jsonapi/src/lib/query-requests.ts:56](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/lib/query-requests.ts#L56)

___

### RecordTransformRequest

Ƭ **RecordTransformRequest**: [`AddRecordRequest`](interfaces/AddRecordRequest.md) \| [`RemoveRecordRequest`](interfaces/RemoveRecordRequest.md) \| [`UpdateRecordRequest`](interfaces/UpdateRecordRequest.md) \| [`AddToRelatedRecordsRequest`](interfaces/AddToRelatedRecordsRequest.md) \| [`RemoveFromRelatedRecordsRequest`](interfaces/RemoveFromRelatedRecordsRequest.md) \| [`ReplaceRelatedRecordRequest`](interfaces/ReplaceRelatedRecordRequest.md) \| [`ReplaceRelatedRecordsRequest`](interfaces/ReplaceRelatedRecordsRequest.md)

#### Defined in

[packages/@orbit/jsonapi/src/lib/transform-requests.ts:78](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/lib/transform-requests.ts#L78)

___

### ResourceRelationship

Ƭ **ResourceRelationship**: [`ResourceHasOneRelationship`](interfaces/ResourceHasOneRelationship.md) \| [`ResourceHasManyRelationship`](interfaces/ResourceHasManyRelationship.md)

#### Defined in

[packages/@orbit/jsonapi/src/resource-document.ts:21](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/resource-document.ts#L21)

___

### TransformRequestProcessorResponse

Ƭ **TransformRequestProcessorResponse**: `FullResponse`<`RecordOperationResult`, [`JSONAPIResponse`](interfaces/JSONAPIResponse.md), `RecordOperation`\>

#### Defined in

[packages/@orbit/jsonapi/src/lib/transform-requests.ts:87](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/lib/transform-requests.ts#L87)

## Variables

### QueryRequestProcessors

• `Const` **QueryRequestProcessors**: `Dict`<[`QueryRequestProcessor`](interfaces/QueryRequestProcessor.md)\>

#### Defined in

[packages/@orbit/jsonapi/src/lib/query-requests.ts:183](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/lib/query-requests.ts#L183)

___

### TransformRequestProcessors

• `Const` **TransformRequestProcessors**: `Dict`<[`TransformRequestProcessor`](interfaces/TransformRequestProcessor.md)\>

#### Defined in

[packages/@orbit/jsonapi/src/lib/transform-requests.ts:100](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/lib/transform-requests.ts#L100)

## Functions

### appendQueryParams

▸ **appendQueryParams**(`url`, `obj`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `url` | `string` |
| `obj` | `Dict`<`string`\> |

#### Returns

`string`

#### Defined in

[packages/@orbit/jsonapi/src/lib/query-params.ts:66](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/lib/query-params.ts#L66)

___

### buildFetchSettings

▸ **buildFetchSettings**(`options?`, `customSettings?`): [`FetchSettings`](interfaces/FetchSettings.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`JSONAPIRequestOptions`](interfaces/JSONAPIRequestOptions.md) |
| `customSettings?` | [`FetchSettings`](interfaces/FetchSettings.md) |

#### Returns

[`FetchSettings`](interfaces/FetchSettings.md)

#### Defined in

[packages/@orbit/jsonapi/src/lib/jsonapi-request-options.ts:19](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/lib/jsonapi-request-options.ts#L19)

___

### buildJSONAPISerializerFor

▸ **buildJSONAPISerializerFor**(`settings`): `SerializerForFn`

#### Parameters

| Name | Type |
| :------ | :------ |
| `settings` | `Object` |
| `settings.keyMap?` | `RecordKeyMap` |
| `settings.schema` | `RecordSchema` |
| `settings.serializerClassFor?` | `SerializerClassForFn` |
| `settings.serializerFor?` | `SerializerForFn` |
| `settings.serializerSettingsFor?` | `SerializerSettingsForFn` |

#### Returns

`SerializerForFn`

#### Defined in

[packages/@orbit/jsonapi/src/serializers/jsonapi-serializer-builder.ts:25](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/serializers/jsonapi-serializer-builder.ts#L25)

___

### encodeQueryParams

▸ **encodeQueryParams**(`obj`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `obj` | `Dict`<`any`\> |

#### Returns

`string`

#### Defined in

[packages/@orbit/jsonapi/src/lib/query-params.ts:40](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/lib/query-params.ts#L40)

___

### getQueryRequests

▸ **getQueryRequests**(`requestProcessor`, `query`): [`RecordQueryRequest`](modules.md#recordqueryrequest)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestProcessor` | [`JSONAPIRequestProcessor`](classes/JSONAPIRequestProcessor.md) |
| `query` | `RecordQuery` |

#### Returns

[`RecordQueryRequest`](modules.md#recordqueryrequest)[]

#### Defined in

[packages/@orbit/jsonapi/src/lib/query-requests.ts:75](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/lib/query-requests.ts#L75)

___

### getTransformRequests

▸ **getTransformRequests**(`requestProcessor`, `transform`): [`RecordTransformRequest`](modules.md#recordtransformrequest)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestProcessor` | [`JSONAPIRequestProcessor`](classes/JSONAPIRequestProcessor.md) |
| `transform` | `RecordTransform` |

#### Returns

[`RecordTransformRequest`](modules.md#recordtransformrequest)[]

#### Defined in

[packages/@orbit/jsonapi/src/lib/transform-requests.ts:315](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/lib/transform-requests.ts#L315)

___

### mergeJSONAPIRequestOptions

▸ **mergeJSONAPIRequestOptions**(`options`, `customOptions`): [`JSONAPIRequestOptions`](interfaces/JSONAPIRequestOptions.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`JSONAPIRequestOptions`](interfaces/JSONAPIRequestOptions.md) |
| `customOptions` | [`JSONAPIRequestOptions`](interfaces/JSONAPIRequestOptions.md) |

#### Returns

[`JSONAPIRequestOptions`](interfaces/JSONAPIRequestOptions.md)

#### Defined in

[packages/@orbit/jsonapi/src/lib/jsonapi-request-options.ts:43](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/lib/jsonapi-request-options.ts#L43)
