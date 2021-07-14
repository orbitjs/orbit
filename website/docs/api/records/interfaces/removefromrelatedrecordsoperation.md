---
id: "RemoveFromRelatedRecordsOperation"
title: "Interface: RemoveFromRelatedRecordsOperation"
sidebar_label: "RemoveFromRelatedRecordsOperation"
sidebar_position: 0
custom_edit_url: null
---

Remove from has-many relationship operation.

## Hierarchy

- `Operation`

  ↳ **`RemoveFromRelatedRecordsOperation`**

## Properties

### op

• **op**: ``"removeFromRelatedRecords"``

#### Overrides

Operation.op

#### Defined in

[packages/@orbit/records/src/record-operation.ts:70](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-operation.ts#L70)

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

[packages/@orbit/records/src/record-operation.ts:71](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-operation.ts#L71)

___

### relatedRecord

• **relatedRecord**: [`RecordIdentity`](RecordIdentity.md)

#### Defined in

[packages/@orbit/records/src/record-operation.ts:73](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-operation.ts#L73)

___

### relationship

• **relationship**: `string`

#### Defined in

[packages/@orbit/records/src/record-operation.ts:72](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-operation.ts#L72)
