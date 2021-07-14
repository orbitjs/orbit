---
id: "Strategy"
title: "Class: Strategy"
sidebar_label: "Strategy"
sidebar_position: 0
custom_edit_url: null
---

## Hierarchy

- **`Strategy`**

  ↳ [`LogTruncationStrategy`](LogTruncationStrategy.md)

  ↳ [`EventLoggingStrategy`](EventLoggingStrategy.md)

  ↳ [`ConnectionStrategy`](ConnectionStrategy.md)

## Constructors

### constructor

• **new Strategy**(`options?`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`StrategyOptions`](../interfaces/StrategyOptions.md) |

#### Defined in

[strategy.ts:45](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/coordinator/src/strategy.ts#L45)

## Accessors

### coordinator

• `get` **coordinator**(): `undefined` \| [`default`](default.md)

#### Returns

`undefined` \| [`default`](default.md)

#### Defined in

[strategy.ts:90](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/coordinator/src/strategy.ts#L90)

___

### logLevel

• `get` **logLevel**(): `undefined` \| [`None`](../enums/LogLevel.md#none) \| [`Errors`](../enums/LogLevel.md#errors) \| [`Warnings`](../enums/LogLevel.md#warnings) \| [`Info`](../enums/LogLevel.md#info)

#### Returns

`undefined` \| [`None`](../enums/LogLevel.md#none) \| [`Errors`](../enums/LogLevel.md#errors) \| [`Warnings`](../enums/LogLevel.md#warnings) \| [`Info`](../enums/LogLevel.md#info)

#### Defined in

[strategy.ts:102](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/coordinator/src/strategy.ts#L102)

___

### logPrefix

• `get` **logPrefix**(): `string`

#### Returns

`string`

#### Defined in

[strategy.ts:98](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/coordinator/src/strategy.ts#L98)

___

### name

• `get` **name**(): `string`

#### Returns

`string`

#### Defined in

[strategy.ts:86](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/coordinator/src/strategy.ts#L86)

___

### sources

• `get` **sources**(): `Source`<`RequestOptions`, `RequestOptions`, `unknown`, `unknown`\>[]

#### Returns

`Source`<`RequestOptions`, `RequestOptions`, `unknown`, `unknown`\>[]

#### Defined in

[strategy.ts:94](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/coordinator/src/strategy.ts#L94)

## Methods

### activate

▸ **activate**(`coordinator`, `options?`): `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `coordinator` | [`default`](default.md) |
| `options` | [`ActivationOptions`](../interfaces/ActivationOptions.md) |

#### Returns

`Promise`<`void`\>

#### Defined in

[strategy.ts:57](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/coordinator/src/strategy.ts#L57)

___

### afterSourceActivation

▸ **afterSourceActivation**(): `Promise`<`void`\>

#### Returns

`Promise`<`void`\>

#### Defined in

[strategy.ts:81](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/coordinator/src/strategy.ts#L81)

___

### afterSourceDeactivation

▸ **afterSourceDeactivation**(): `Promise`<`void`\>

#### Returns

`Promise`<`void`\>

#### Defined in

[strategy.ts:84](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/coordinator/src/strategy.ts#L84)

___

### beforeSourceActivation

▸ **beforeSourceActivation**(): `Promise`<`void`\>

#### Returns

`Promise`<`void`\>

#### Defined in

[strategy.ts:80](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/coordinator/src/strategy.ts#L80)

___

### beforeSourceDeactivation

▸ **beforeSourceDeactivation**(): `Promise`<`void`\>

#### Returns

`Promise`<`void`\>

#### Defined in

[strategy.ts:83](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/coordinator/src/strategy.ts#L83)

___

### deactivate

▸ **deactivate**(): `Promise`<`void`\>

#### Returns

`Promise`<`void`\>

#### Defined in

[strategy.ts:76](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/coordinator/src/strategy.ts#L76)
