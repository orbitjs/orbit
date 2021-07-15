---
id: "modules"
title: "@orbit/validators"
sidebar_label: "Exports"
sidebar_position: 0.5
custom_edit_url: null
---

## Enumerations

- [StandardValidators](enums/StandardValidators.md)

## Interfaces

- [ArrayValidationOptions](interfaces/ArrayValidationOptions.md)
- [DateValidationOptions](interfaces/DateValidationOptions.md)
- [NumberValidationOptions](interfaces/NumberValidationOptions.md)
- [StringValidationOptions](interfaces/StringValidationOptions.md)
- [ValidationIssue](interfaces/ValidationIssue.md)
- [ValidationOptions](interfaces/ValidationOptions.md)

## Type aliases

### ArrayValidationIssue

Ƭ **ArrayValidationIssue**: `TypeIssue` \| `MinItemsIssue` \| `MaxItemsIssue`

#### Defined in

[array-validator.ts:25](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/validators/src/array-validator.ts#L25)

___

### ArrayValidator

Ƭ **ArrayValidator**: [`Validator`](modules.md#validator)<`unknown`[], [`ArrayValidationOptions`](interfaces/ArrayValidationOptions.md), [`ArrayValidationIssue`](modules.md#arrayvalidationissue)\>

#### Defined in

[array-validator.ts:32](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/validators/src/array-validator.ts#L32)

___

### BooleanValidationIssue

Ƭ **BooleanValidationIssue**: `TypeIssue`

#### Defined in

[boolean-validator.ts:11](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/validators/src/boolean-validator.ts#L11)

___

### BooleanValidator

Ƭ **BooleanValidator**: [`Validator`](modules.md#validator)<`boolean`, `undefined`, [`BooleanValidationIssue`](modules.md#booleanvalidationissue)\>

#### Defined in

[boolean-validator.ts:13](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/validators/src/boolean-validator.ts#L13)

___

### DateValidationIssue

Ƭ **DateValidationIssue**: `TypeIssue` \| `MinimumIssue` \| `MaximumIssue` \| `ExclusiveMinimumIssue` \| `ExclusiveMaximumIssue`

#### Defined in

[date-validator.ts:39](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/validators/src/date-validator.ts#L39)

___

### DateValidator

Ƭ **DateValidator**: [`Validator`](modules.md#validator)<`Date`, [`DateValidationOptions`](interfaces/DateValidationOptions.md), [`DateValidationIssue`](modules.md#datevalidationissue)\>

#### Defined in

[date-validator.ts:53](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/validators/src/date-validator.ts#L53)

___

### NumberValidationIssue

Ƭ **NumberValidationIssue**: `TypeIssue` \| `MinimumIssue` \| `MaximumIssue` \| `ExclusiveMinimumIssue` \| `ExclusiveMaximumIssue`

#### Defined in

[number-validator.ts:39](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/validators/src/number-validator.ts#L39)

___

### NumberValidator

Ƭ **NumberValidator**: [`Validator`](modules.md#validator)<`number`, [`NumberValidationOptions`](interfaces/NumberValidationOptions.md), [`NumberValidationIssue`](modules.md#numbervalidationissue)\>

#### Defined in

[number-validator.ts:53](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/validators/src/number-validator.ts#L53)

___

### StandardValidator

Ƭ **StandardValidator**: [`ArrayValidator`](modules.md#arrayvalidator) \| [`BooleanValidator`](modules.md#booleanvalidator) \| [`DateValidator`](modules.md#datevalidator) \| [`NumberValidator`](modules.md#numbervalidator) \| `ObjectValidator` \| [`StringValidator`](modules.md#stringvalidator)

#### Defined in

[standard-validators.ts:19](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/validators/src/standard-validators.ts#L19)

___

### StringValidationIssue

Ƭ **StringValidationIssue**: `TypeIssue` \| `MinLengthIssue` \| `MaxLengthIssue`

#### Defined in

[string-validator.ts:25](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/validators/src/string-validator.ts#L25)

___

### StringValidator

Ƭ **StringValidator**: [`Validator`](modules.md#validator)<`string`, [`StringValidationOptions`](interfaces/StringValidationOptions.md), [`StringValidationIssue`](modules.md#stringvalidationissue)\>

#### Defined in

[string-validator.ts:32](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/validators/src/string-validator.ts#L32)

___

### Validator

Ƭ **Validator**<`Input`, `Options`, `Issue`\>: (`input`: `Input`, `options?`: `Options`) => `undefined` \| `Issue`[]

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Input` | `unknown` |
| `Options` | [`ValidationOptions`](interfaces/ValidationOptions.md) |
| `Issue` | [`ValidationIssue`](interfaces/ValidationIssue.md)<`Input`\> |

#### Type declaration

▸ (`input`, `options?`): `undefined` \| `Issue`[]

##### Parameters

| Name | Type |
| :------ | :------ |
| `input` | `Input` |
| `options?` | `Options` |

##### Returns

`undefined` \| `Issue`[]

#### Defined in

[validator.ts:38](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/validators/src/validator.ts#L38)

___

### ValidatorForFn

Ƭ **ValidatorForFn**<`V`\>: (`type`: `string`) => `V` \| `undefined`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `V` | [`Validator`](modules.md#validator) |

#### Type declaration

▸ (`type`): `V` \| `undefined`

##### Parameters

| Name | Type |
| :------ | :------ |
| `type` | `string` |

##### Returns

`V` \| `undefined`

#### Defined in

[validator-builder.ts:4](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/validators/src/validator-builder.ts#L4)

## Variables

### standardValidators

• `Const` **standardValidators**: `Dict`<[`StandardValidator`](modules.md#standardvalidator)\>

#### Defined in

[standard-validators.ts:27](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/validators/src/standard-validators.ts#L27)

## Functions

### buildValidatorFor

▸ **buildValidatorFor**<`V`\>(`settings`): [`ValidatorForFn`](modules.md#validatorforfn)<`V`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `V` | [`Validator`](modules.md#validator)<`unknown`, [`ValidationOptions`](interfaces/ValidationOptions.md), [`ValidationIssue`](interfaces/ValidationIssue.md)<`unknown`, `unknown`\>\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `settings` | `Object` |
| `settings.validators` | `Dict`<`V`\> |

#### Returns

[`ValidatorForFn`](modules.md#validatorforfn)<`V`\>

#### Defined in

[validator-builder.ts:6](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/validators/src/validator-builder.ts#L6)

___

### validateArray

▸ `Const` **validateArray**(`input`, `options?`): `undefined` \| [`ArrayValidationIssue`](modules.md#arrayvalidationissue)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `input` | `unknown`[] |
| `options?` | [`ArrayValidationOptions`](interfaces/ArrayValidationOptions.md) |

#### Returns

`undefined` \| [`ArrayValidationIssue`](modules.md#arrayvalidationissue)[]

#### Defined in

[array-validator.ts:38](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/validators/src/array-validator.ts#L38)

___

### validateBoolean

▸ `Const` **validateBoolean**(`input`, `options?`): `undefined` \| `TypeIssue`[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `input` | `boolean` |
| `options?` | `undefined` |

#### Returns

`undefined` \| `TypeIssue`[]

#### Defined in

[boolean-validator.ts:19](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/validators/src/boolean-validator.ts#L19)

___

### validateDate

▸ `Const` **validateDate**(`input`, `options?`): `undefined` \| [`DateValidationIssue`](modules.md#datevalidationissue)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `input` | `Date` |
| `options?` | [`DateValidationOptions`](interfaces/DateValidationOptions.md) |

#### Returns

`undefined` \| [`DateValidationIssue`](modules.md#datevalidationissue)[]

#### Defined in

[date-validator.ts:59](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/validators/src/date-validator.ts#L59)

___

### validateNumber

▸ `Const` **validateNumber**(`input`, `options?`): `undefined` \| [`NumberValidationIssue`](modules.md#numbervalidationissue)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `input` | `number` |
| `options?` | [`NumberValidationOptions`](interfaces/NumberValidationOptions.md) |

#### Returns

`undefined` \| [`NumberValidationIssue`](modules.md#numbervalidationissue)[]

#### Defined in

[number-validator.ts:59](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/validators/src/number-validator.ts#L59)

___

### validateString

▸ `Const` **validateString**(`input`, `options?`): `undefined` \| [`StringValidationIssue`](modules.md#stringvalidationissue)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `input` | `string` |
| `options?` | [`StringValidationOptions`](interfaces/StringValidationOptions.md) |

#### Returns

`undefined` \| [`StringValidationIssue`](modules.md#stringvalidationissue)[]

#### Defined in

[string-validator.ts:38](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/validators/src/string-validator.ts#L38)
