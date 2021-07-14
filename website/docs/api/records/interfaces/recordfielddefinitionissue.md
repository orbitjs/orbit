---
id: "RecordFieldDefinitionIssue"
title: "Interface: RecordFieldDefinitionIssue"
sidebar_label: "RecordFieldDefinitionIssue"
sidebar_position: 0
custom_edit_url: null
---

## Hierarchy

- `ValidationIssue`

  ↳ **`RecordFieldDefinitionIssue`**

## Properties

### description

• **description**: `string`

A brief description of the violation. This does not have to be appropriate
for end users, who should typically be shown internationalized, customized
messages.

#### Inherited from

ValidationIssue.description

#### Defined in

packages/@orbit/validators/dist/modules/validator.d.ts:18

___

### details

• `Optional` **details**: `unknown`

Details specific to the validation performed that will be helpful to
understand the violation.

#### Inherited from

ValidationIssue.details

#### Defined in

packages/@orbit/validators/dist/modules/validator.d.ts:30

___

### ref

• **ref**: [`RecordFieldDefinitionInput`](RecordFieldDefinitionInput.md)

#### Overrides

ValidationIssue.ref

#### Defined in

[packages/@orbit/records/src/record-validators/record-field-definition-validator.ts:15](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-validators/record-field-definition-validator.ts#L15)

___

### validation

• **validation**: ``"fieldDefined"``

#### Overrides

ValidationIssue.validation

#### Defined in

[packages/@orbit/records/src/record-validators/record-field-definition-validator.ts:14](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-validators/record-field-definition-validator.ts#L14)

___

### validator

• **validator**: [`RecordFieldDefinition`](../enums/StandardRecordValidators.md#recordfielddefinition)

#### Overrides

ValidationIssue.validator

#### Defined in

[packages/@orbit/records/src/record-validators/record-field-definition-validator.ts:13](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-validators/record-field-definition-validator.ts#L13)
