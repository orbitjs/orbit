---
id: "RemoveFromRelatedRecordsRequest"
title: "Interface: RemoveFromRelatedRecordsRequest"
sidebar_label: "RemoveFromRelatedRecordsRequest"
sidebar_position: 0
custom_edit_url: null
---

## Hierarchy

- [`TransformRecordRelationshipRequest`](TransformRecordRelationshipRequest.md)

  ↳ **`RemoveFromRelatedRecordsRequest`**

## Properties

### op

• **op**: ``"removeFromRelatedRecords"``

#### Overrides

[TransformRecordRelationshipRequest](TransformRecordRelationshipRequest.md).[op](TransformRecordRelationshipRequest.md#op)

#### Defined in

[packages/@orbit/jsonapi/src/lib/transform-requests.ts:62](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/lib/transform-requests.ts#L62)

___

### options

• `Optional` **options**: [`JSONAPIRequestOptions`](JSONAPIRequestOptions.md)

#### Inherited from

[TransformRecordRelationshipRequest](TransformRecordRelationshipRequest.md).[options](TransformRecordRelationshipRequest.md#options)

#### Defined in

[packages/@orbit/jsonapi/src/lib/transform-requests.ts:31](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/lib/transform-requests.ts#L31)

___

### record

• **record**: `RecordIdentity`

#### Inherited from

[TransformRecordRelationshipRequest](TransformRecordRelationshipRequest.md).[record](TransformRecordRelationshipRequest.md#record)

#### Defined in

[packages/@orbit/jsonapi/src/lib/transform-requests.ts:32](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/lib/transform-requests.ts#L32)

___

### relatedRecords

• **relatedRecords**: `RecordIdentity`[]

#### Defined in

[packages/@orbit/jsonapi/src/lib/transform-requests.ts:63](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/lib/transform-requests.ts#L63)

___

### relationship

• **relationship**: `string`

#### Inherited from

[TransformRecordRelationshipRequest](TransformRecordRelationshipRequest.md).[relationship](TransformRecordRelationshipRequest.md#relationship)

#### Defined in

[packages/@orbit/jsonapi/src/lib/transform-requests.ts:37](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/lib/transform-requests.ts#L37)
