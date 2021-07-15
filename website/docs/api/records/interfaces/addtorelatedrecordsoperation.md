---
id: "AddToRelatedRecordsOperation"
title: "Interface: AddToRelatedRecordsOperation"
sidebar_label: "AddToRelatedRecordsOperation"
sidebar_position: 0
custom_edit_url: null
---

Add to has-many relationship operation.

## Hierarchy

- `Operation`

  ↳ **`AddToRelatedRecordsOperation`**

## Properties

### op

• **op**: ``"addToRelatedRecords"``

#### Overrides

Operation.op

#### Defined in

[packages/@orbit/records/src/record-operation.ts:60](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-operation.ts#L60)

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

[packages/@orbit/records/src/record-operation.ts:61](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-operation.ts#L61)

___

### relatedRecord

• **relatedRecord**: [`RecordIdentity`](RecordIdentity.md)

#### Defined in

[packages/@orbit/records/src/record-operation.ts:63](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-operation.ts#L63)

___

### relationship

• **relationship**: `string`

#### Defined in

[packages/@orbit/records/src/record-operation.ts:62](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-operation.ts#L62)
