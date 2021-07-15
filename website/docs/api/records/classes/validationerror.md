---
id: "ValidationError"
title: "Class: ValidationError"
sidebar_label: "ValidationError"
sidebar_position: 0
custom_edit_url: null
---

A validation failed.

## Hierarchy

- `Exception`

  ↳ **`ValidationError`**

## Constructors

### constructor

• **new ValidationError**(`description`, `issues?`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `description` | `string` |
| `issues?` | `ValidationIssue`<`unknown`, `unknown`\>[] |

#### Overrides

Exception.constructor

#### Defined in

[packages/@orbit/records/src/record-exceptions.ts:23](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-exceptions.ts#L23)

## Properties

### description

• **description**: `string`

#### Defined in

[packages/@orbit/records/src/record-exceptions.ts:20](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-exceptions.ts#L20)

___

### issues

• `Optional` **issues**: `ValidationIssue`<`unknown`, `unknown`\>[]

#### Defined in

[packages/@orbit/records/src/record-exceptions.ts:21](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-exceptions.ts#L21)

___

### message

• **message**: `string`

#### Inherited from

Exception.message

#### Defined in

node_modules/typescript/lib/lib.es5.d.ts:974

___

### name

• **name**: `string`

#### Inherited from

Exception.name

#### Defined in

node_modules/typescript/lib/lib.es5.d.ts:973

___

### stack

• `Optional` **stack**: `string`

#### Inherited from

Exception.stack

#### Defined in

node_modules/typescript/lib/lib.es5.d.ts:975

___

### stackTraceLimit

▪ `Static` **stackTraceLimit**: `number`

#### Inherited from

Exception.stackTraceLimit

#### Defined in

node_modules/@types/node/globals.d.ts:13

## Methods

### captureStackTrace

▸ `Static` **captureStackTrace**(`targetObject`, `constructorOpt?`): `void`

Create .stack property on a target object

#### Parameters

| Name | Type |
| :------ | :------ |
| `targetObject` | `object` |
| `constructorOpt?` | `Function` |

#### Returns

`void`

#### Inherited from

Exception.captureStackTrace

#### Defined in

node_modules/@types/node/globals.d.ts:4

___

### prepareStackTrace

▸ `Static` `Optional` **prepareStackTrace**(`err`, `stackTraces`): `any`

Optional override for formatting stack traces

**`see`** https://github.com/v8/v8/wiki/Stack%20Trace%20API#customizing-stack-traces

#### Parameters

| Name | Type |
| :------ | :------ |
| `err` | `Error` |
| `stackTraces` | `CallSite`[] |

#### Returns

`any`

#### Inherited from

Exception.prepareStackTrace

#### Defined in

node_modules/@types/node/globals.d.ts:11
