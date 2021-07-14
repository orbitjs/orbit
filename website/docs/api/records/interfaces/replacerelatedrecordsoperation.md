---
id: "ReplaceRelatedRecordsOperation"
title: "Interface: ReplaceRelatedRecordsOperation"
sidebar_label: "ReplaceRelatedRecordsOperation"
sidebar_position: 0
custom_edit_url: null
---

Replace has-many relationship operation.

## Hierarchy

- `Operation`

  ↳ **`ReplaceRelatedRecordsOperation`**

## Properties

### op

• **op**: ``"replaceRelatedRecords"``

#### Overrides

Operation.op

#### Defined in

[packages/@orbit/records/src/record-operation.ts:80](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-operation.ts#L80)

___

### options

• `Optional` **options**: `RequestOptions`

#### Inherited from

Operation.options

#### Defined in

packages/@orbit/data/dist/modules/operation.d.ts:4

___

### record

• **record**: [`RecordIdentity`](RecordIdentity.md)

#### Defined in

[packages/@orbit/records/src/record-operation.ts:81](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-operation.ts#L81)

___

### relatedRecords

• **relatedRecords**: [`RecordIdentity`](RecordIdentity.md)[]

#### Defined in

[packages/@orbit/records/src/record-operation.ts:83](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-operation.ts#L83)

___

### relationship

• **relationship**: `string`

#### Defined in

[packages/@orbit/records/src/record-operation.ts:82](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-operation.ts#L82)
