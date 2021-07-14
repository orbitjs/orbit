---
id: "RecordException"
title: "Class: RecordException"
sidebar_label: "RecordException"
sidebar_position: 0
custom_edit_url: null
---

An error occurred related to a particular record.

## Hierarchy

- `Exception`

  ↳ **`RecordException`**

  ↳↳ [`RecordNotFoundException`](RecordNotFoundException.md)

## Constructors

### constructor

• **new RecordException**(`description`, `type`, `id`, `field?`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `description` | `string` |
| `type` | `string` |
| `id` | `string` |
| `field?` | `string` |

#### Overrides

Exception.constructor

#### Defined in

[packages/@orbit/records/src/record-exceptions.ts:75](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-exceptions.ts#L75)

## Properties

### description

• **description**: `string`

#### Defined in

[packages/@orbit/records/src/record-exceptions.ts:70](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-exceptions.ts#L70)

___

### field

• `Optional` **field**: `string`

#### Defined in

[packages/@orbit/records/src/record-exceptions.ts:73](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-exceptions.ts#L73)

___

### id

• **id**: `string`

#### Defined in

[packages/@orbit/records/src/record-exceptions.ts:72](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-exceptions.ts#L72)

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

### type

• **type**: `string`

#### Defined in

[packages/@orbit/records/src/record-exceptions.ts:71](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-exceptions.ts#L71)

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
