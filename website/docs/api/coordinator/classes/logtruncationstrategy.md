---
id: "LogTruncationStrategy"
title: "Class: LogTruncationStrategy"
sidebar_label: "LogTruncationStrategy"
sidebar_position: 0
custom_edit_url: null
---

## Hierarchy

- [`Strategy`](Strategy.md)

  ↳ **`LogTruncationStrategy`**

## Constructors

### constructor

• **new LogTruncationStrategy**(`options?`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`StrategyOptions`](../interfaces/StrategyOptions.md) |

#### Overrides

[Strategy](Strategy.md).[constructor](Strategy.md#constructor)

#### Defined in

[strategies/log-truncation-strategy.ts:11](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/coordinator/src/strategies/log-truncation-strategy.ts#L11)

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

### \_connectSource

▸ **_connectSource**(`source`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `source` | `Source`<`RequestOptions`, `RequestOptions`, `unknown`, `unknown`\> |

#### Returns

`void`

#### Defined in

[strategies/log-truncation-strategy.ts:74](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/coordinator/src/strategies/log-truncation-strategy.ts#L74)

___

### \_disconnectSource

▸ **_disconnectSource**(`source`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `source` | `Source`<`RequestOptions`, `RequestOptions`, `unknown`, `unknown`\> |

#### Returns

`void`

#### Defined in

[strategies/log-truncation-strategy.ts:86](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/coordinator/src/strategies/log-truncation-strategy.ts#L86)

___

### \_review

▸ **_review**(`source`): `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `source` | `Source`<`RequestOptions`, `RequestOptions`, `unknown`, `unknown`\> |

#### Returns

`Promise`<`void`\>

#### Defined in

[strategies/log-truncation-strategy.ts:37](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/coordinator/src/strategies/log-truncation-strategy.ts#L37)

___

### \_truncateSources

▸ **_truncateSources**(`transformId`, `relativePosition`): `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `transformId` | `string` |
| `relativePosition` | `number` |

#### Returns

`Promise`<`void`\>

#### Defined in

[strategies/log-truncation-strategy.ts:63](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/coordinator/src/strategies/log-truncation-strategy.ts#L63)

___

### activate

▸ **activate**(`coordinator`, `options?`): `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `coordinator` | [`default`](default.md) |
| `options` | [`ActivationOptions`](../interfaces/ActivationOptions.md) |

#### Returns

`Promise`<`void`\>

#### Overrides

[Strategy](Strategy.md).[activate](Strategy.md#activate)

#### Defined in

[strategies/log-truncation-strategy.ts:18](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/coordinator/src/strategies/log-truncation-strategy.ts#L18)

___

### afterSourceActivation

▸ **afterSourceActivation**(): `Promise`<`void`\>

#### Returns

`Promise`<`void`\>

#### Inherited from

[Strategy](Strategy.md).[afterSourceActivation](Strategy.md#aftersourceactivation)

#### Defined in

[strategy.ts:81](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/coordinator/src/strategy.ts#L81)

___

### afterSourceDeactivation

▸ **afterSourceDeactivation**(): `Promise`<`void`\>

#### Returns

`Promise`<`void`\>

#### Inherited from

[Strategy](Strategy.md).[afterSourceDeactivation](Strategy.md#aftersourcedeactivation)

#### Defined in

[strategy.ts:84](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/coordinator/src/strategy.ts#L84)

___

### beforeSourceActivation

▸ **beforeSourceActivation**(): `Promise`<`void`\>

#### Returns

`Promise`<`void`\>

#### Inherited from

[Strategy](Strategy.md).[beforeSourceActivation](Strategy.md#beforesourceactivation)

#### Defined in

[strategy.ts:80](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/coordinator/src/strategy.ts#L80)

___

### beforeSourceDeactivation

▸ **beforeSourceDeactivation**(): `Promise`<`void`\>

#### Returns

`Promise`<`void`\>

#### Inherited from

[Strategy](Strategy.md).[beforeSourceDeactivation](Strategy.md#beforesourcedeactivation)

#### Defined in

[strategy.ts:83](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/coordinator/src/strategy.ts#L83)

___

### deactivate

▸ **deactivate**(): `Promise`<`void`\>

#### Returns

`Promise`<`void`\>

#### Overrides

[Strategy](Strategy.md).[deactivate](Strategy.md#deactivate)

#### Defined in

[strategies/log-truncation-strategy.ts:29](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/coordinator/src/strategies/log-truncation-strategy.ts#L29)
