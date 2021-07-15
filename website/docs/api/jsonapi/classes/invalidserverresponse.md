---
id: "InvalidServerResponse"
title: "Class: InvalidServerResponse"
sidebar_label: "InvalidServerResponse"
sidebar_position: 0
custom_edit_url: null
---

## Hierarchy

- `Exception`

  ↳ **`InvalidServerResponse`**

## Constructors

### constructor

• **new InvalidServerResponse**(`response`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `response` | `string` |

#### Overrides

Exception.constructor

#### Defined in

[packages/@orbit/jsonapi/src/lib/exceptions.ts:6](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/lib/exceptions.ts#L6)

## Properties

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

### response

• **response**: `string`

#### Defined in

[packages/@orbit/jsonapi/src/lib/exceptions.ts:4](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/lib/exceptions.ts#L4)

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
