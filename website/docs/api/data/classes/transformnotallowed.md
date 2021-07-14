---
id: "TransformNotAllowed"
title: "Class: TransformNotAllowed"
sidebar_label: "TransformNotAllowed"
sidebar_position: 0
custom_edit_url: null
---

A transform is invalid for a particular source.

## Hierarchy

- `Exception`

  ↳ **`TransformNotAllowed`**

## Constructors

### constructor

• **new TransformNotAllowed**(`description`, `transform`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `description` | `string` |
| `transform` | [`Transform`](../interfaces/Transform.md)<[`Operation`](../interfaces/Operation.md)\> |

#### Overrides

Exception.constructor

#### Defined in

[packages/@orbit/data/src/exception.ts:79](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/exception.ts#L79)

## Properties

### description

• **description**: `string`

#### Defined in

[packages/@orbit/data/src/exception.ts:76](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/exception.ts#L76)

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

### transform

• **transform**: [`Transform`](../interfaces/Transform.md)<[`Operation`](../interfaces/Operation.md)\>

#### Defined in

[packages/@orbit/data/src/exception.ts:77](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/exception.ts#L77)

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
