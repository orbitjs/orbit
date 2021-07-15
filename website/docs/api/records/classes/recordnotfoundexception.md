---
id: "RecordNotFoundException"
title: "Class: RecordNotFoundException"
sidebar_label: "RecordNotFoundException"
sidebar_position: 0
custom_edit_url: null
---

A record could not be found.

## Hierarchy

- [`RecordException`](RecordException.md)

  ↳ **`RecordNotFoundException`**

## Constructors

### constructor

• **new RecordNotFoundException**(`type`, `id`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `type` | `string` |
| `id` | `string` |

#### Overrides

[RecordException](RecordException.md).[constructor](RecordException.md#constructor)

#### Defined in

[packages/@orbit/records/src/record-exceptions.ts:97](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-exceptions.ts#L97)

## Properties

### description

• **description**: `string`

#### Inherited from

[RecordException](RecordException.md).[description](RecordException.md#description)

#### Defined in

[packages/@orbit/records/src/record-exceptions.ts:70](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-exceptions.ts#L70)

___

### field

• `Optional` **field**: `string`

#### Inherited from

[RecordException](RecordException.md).[field](RecordException.md#field)

#### Defined in

[packages/@orbit/records/src/record-exceptions.ts:73](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-exceptions.ts#L73)

___

### id

• **id**: `string`

#### Inherited from

[RecordException](RecordException.md).[id](RecordException.md#id)

#### Defined in

[packages/@orbit/records/src/record-exceptions.ts:72](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-exceptions.ts#L72)

___

### message

• **message**: `string`

#### Inherited from

[RecordException](RecordException.md).[message](RecordException.md#message)

#### Defined in

node_modules/typescript/lib/lib.es5.d.ts:974

___

### name

• **name**: `string`

#### Inherited from

[RecordException](RecordException.md).[name](RecordException.md#name)

#### Defined in

node_modules/typescript/lib/lib.es5.d.ts:973

___

### stack

• `Optional` **stack**: `string`

#### Inherited from

[RecordException](RecordException.md).[stack](RecordException.md#stack)

#### Defined in

node_modules/typescript/lib/lib.es5.d.ts:975

___

### type

• **type**: `string`

#### Inherited from

[RecordException](RecordException.md).[type](RecordException.md#type)

#### Defined in

[packages/@orbit/records/src/record-exceptions.ts:71](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-exceptions.ts#L71)

___

### stackTraceLimit

▪ `Static` **stackTraceLimit**: `number`

#### Inherited from

[RecordException](RecordException.md).[stackTraceLimit](RecordException.md#stacktracelimit)

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

[RecordException](RecordException.md).[captureStackTrace](RecordException.md#capturestacktrace)

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

[RecordException](RecordException.md).[prepareStackTrace](RecordException.md#preparestacktrace)

#### Defined in

node_modules/@types/node/globals.d.ts:11
