---
id: "ValidationIssue"
title: "Interface: ValidationIssue<Ref, Details>"
sidebar_label: "ValidationIssue"
sidebar_position: 0
custom_edit_url: null
---

## Type parameters

| Name | Type |
| :------ | :------ |
| `Ref` | `unknown` |
| `Details` | `unknown` |

## Properties

### description

• **description**: `string`

A brief description of the violation. This does not have to be appropriate
for end users, who should typically be shown internationalized, customized
messages.

#### Defined in

[validator.ts:21](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/validators/src/validator.ts#L21)

___

### details

• `Optional` **details**: `Details`

Details specific to the validation performed that will be helpful to
understand the violation.

#### Defined in

[validator.ts:35](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/validators/src/validator.ts#L35)

___

### ref

• `Optional` **ref**: `Ref`

A reference to the source of the validation issue. This should be specific
enough to allow dereferencing to a particular record, field, etc. For
low-level primitive validations (e.g. booleans, strings, etc.), this should
be the value itself.

#### Defined in

[validator.ts:29](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/validators/src/validator.ts#L29)

___

### validation

• **validation**: `string`

An identifier for the validation violation.

#### Defined in

[validator.ts:14](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/validators/src/validator.ts#L14)

___

### validator

• **validator**: `string`

An identifier for the validator that caused the issue.

#### Defined in

[validator.ts:9](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/validators/src/validator.ts#L9)
