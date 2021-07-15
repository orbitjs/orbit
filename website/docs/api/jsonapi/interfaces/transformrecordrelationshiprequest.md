---
id: "TransformRecordRelationshipRequest"
title: "Interface: TransformRecordRelationshipRequest"
sidebar_label: "TransformRecordRelationshipRequest"
sidebar_position: 0
custom_edit_url: null
---

## Hierarchy

- [`BaseTransformRecordRequest`](BaseTransformRecordRequest.md)

  ↳ **`TransformRecordRelationshipRequest`**

  ↳↳ [`AddToRelatedRecordsRequest`](AddToRelatedRecordsRequest.md)

  ↳↳ [`RemoveFromRelatedRecordsRequest`](RemoveFromRelatedRecordsRequest.md)

  ↳↳ [`ReplaceRelatedRecordRequest`](ReplaceRelatedRecordRequest.md)

  ↳↳ [`ReplaceRelatedRecordsRequest`](ReplaceRelatedRecordsRequest.md)

## Properties

### op

• **op**: `string`

#### Inherited from

[BaseTransformRecordRequest](BaseTransformRecordRequest.md).[op](BaseTransformRecordRequest.md#op)

#### Defined in

[packages/@orbit/jsonapi/src/lib/transform-requests.ts:30](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/lib/transform-requests.ts#L30)

___

### options

• `Optional` **options**: [`JSONAPIRequestOptions`](JSONAPIRequestOptions.md)

#### Inherited from

[BaseTransformRecordRequest](BaseTransformRecordRequest.md).[options](BaseTransformRecordRequest.md#options)

#### Defined in

[packages/@orbit/jsonapi/src/lib/transform-requests.ts:31](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/lib/transform-requests.ts#L31)

___

### record

• **record**: `RecordIdentity`

#### Inherited from

[BaseTransformRecordRequest](BaseTransformRecordRequest.md).[record](BaseTransformRecordRequest.md#record)

#### Defined in

[packages/@orbit/jsonapi/src/lib/transform-requests.ts:32](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/lib/transform-requests.ts#L32)

___

### relationship

• **relationship**: `string`

#### Defined in

[packages/@orbit/jsonapi/src/lib/transform-requests.ts:37](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/lib/transform-requests.ts#L37)
