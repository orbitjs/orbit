---
id: "ModelNotDefined"
title: "Class: ModelNotDefined"
sidebar_label: "ModelNotDefined"
sidebar_position: 0
custom_edit_url: null
---

A model is not defined in the schema.

## Hierarchy

- [`SchemaError`](SchemaError.md)

  ↳ **`ModelNotDefined`**

## Constructors

### constructor

• **new ModelNotDefined**(`type`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `type` | `string` |

#### Overrides

[SchemaError](SchemaError.md).[constructor](SchemaError.md#constructor)

#### Defined in

[packages/@orbit/records/src/record-exceptions.ts:34](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-exceptions.ts#L34)

## Properties

### description

• **description**: `string`

#### Inherited from

[SchemaError](SchemaError.md).[description](SchemaError.md#description)

#### Defined in

[packages/@orbit/records/src/record-exceptions.ts:8](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/records/src/record-exceptions.ts#L8)

___

### message

• **message**: `string`

#### Inherited from

[SchemaError](SchemaError.md).[message](SchemaError.md#message)

#### Defined in

node_modules/typescript/lib/lib.es5.d.ts:974

___

### name

• **name**: `string`

#### Inherited from

[SchemaError](SchemaError.md).[name](SchemaError.md#name)

#### Defined in

node_modules/typescript/lib/lib.es5.d.ts:973

___

### stack

• `Optional` **stack**: `string`

#### Inherited from

[SchemaError](SchemaError.md).[stack](SchemaError.md#stack)

#### Defined in

node_modules/typescript/lib/lib.es5.d.ts:975

___

### stackTraceLimit

▪ `Static` **stackTraceLimit**: `number`

#### Inherited from

[SchemaError](SchemaError.md).[stackTraceLimit](SchemaError.md#stacktracelimit)

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

[SchemaError](SchemaError.md).[captureStackTrace](SchemaError.md#capturestacktrace)

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

[SchemaError](SchemaError.md).[prepareStackTrace](SchemaError.md#preparestacktrace)

#### Defined in

node_modules/@types/node/globals.d.ts:11
