---
id: "ReplaceRelatedRecordOperation"
title: "Interface: ReplaceRelatedRecordOperation"
sidebar_label: "ReplaceRelatedRecordOperation"
sidebar_position: 0
custom_edit_url: null
---

Replace has-one relationship operation.

## Hierarchy

- `Operation`

  ↳ **`ReplaceRelatedRecordOperation`**

## Properties

### op

• **op**: ``"replaceRelatedRecord"``

#### Overrides

Operation.op

#### Defined in

[packages/@orbit/records/src/record-operation.ts:90](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-operation.ts#L90)

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

[packages/@orbit/records/src/record-operation.ts:91](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-operation.ts#L91)

___

### relatedRecord

• **relatedRecord**: ``null`` \| [`RecordIdentity`](RecordIdentity.md)

#### Defined in

[packages/@orbit/records/src/record-operation.ts:93](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-operation.ts#L93)

___

### relationship

• **relationship**: `string`

#### Defined in

[packages/@orbit/records/src/record-operation.ts:92](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-operation.ts#L92)
