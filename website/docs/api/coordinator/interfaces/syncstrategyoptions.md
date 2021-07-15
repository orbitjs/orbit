---
id: "SyncStrategyOptions"
title: "Interface: SyncStrategyOptions"
sidebar_label: "SyncStrategyOptions"
sidebar_position: 0
custom_edit_url: null
---

## Hierarchy

- [`StrategyOptions`](StrategyOptions.md)

  ↳ **`SyncStrategyOptions`**

## Properties

### blocking

• `Optional` **blocking**: `boolean` \| (...`args`: `any`[]) => `boolean`

Should resolution of the target's `sync` block the completion of the
source's `transform`?

By default, `blocking` is false.

#### Defined in

[strategies/sync-strategy.ts:40](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/coordinator/src/strategies/sync-strategy.ts#L40)

___

### logLevel

• `Optional` **logLevel**: [`None`](../enums/LogLevel.md#none) \| [`Errors`](../enums/LogLevel.md#errors) \| [`Warnings`](../enums/LogLevel.md#warnings) \| [`Info`](../enums/LogLevel.md#info)

A specific log level for this strategy.

Overrides the log level used when activating the coordinator.

#### Inherited from

[StrategyOptions](StrategyOptions.md).[logLevel](StrategyOptions.md#loglevel)

#### Defined in

[strategy.ts:33](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/coordinator/src/strategy.ts#L33)

___

### logPrefix

• `Optional` **logPrefix**: `string`

The prefix to use for logging from this strategy.

Defaults to `[${name}]`.

#### Inherited from

[StrategyOptions](StrategyOptions.md).[logPrefix](StrategyOptions.md#logprefix)

#### Defined in

[strategy.ts:26](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/coordinator/src/strategy.ts#L26)

___

### name

• `Optional` **name**: `string`

Name of strategy.

Used to uniquely identify this strategy in a coordinator's collection.

#### Inherited from

[StrategyOptions](StrategyOptions.md).[name](StrategyOptions.md#name)

#### Defined in

[strategy.ts:13](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/coordinator/src/strategy.ts#L13)

___

### source

• **source**: `string`

The name of the source to be observed.

#### Defined in

[strategies/sync-strategy.ts:14](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/coordinator/src/strategies/sync-strategy.ts#L14)

___

### sources

• `Optional` **sources**: `string`[]

The names of sources to include in this strategy. Leave undefined
to include all sources registered with a coordinator.

#### Inherited from

[StrategyOptions](StrategyOptions.md).[sources](StrategyOptions.md#sources)

#### Defined in

[strategy.ts:19](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/coordinator/src/strategy.ts#L19)

___

### target

• **target**: `string`

The name of the source which will be acted upon.

#### Defined in

[strategies/sync-strategy.ts:19](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/coordinator/src/strategies/sync-strategy.ts#L19)

## Methods

### catch

▸ `Optional` **catch**(`error`, ...`args`): `void`

A handler for any errors thrown as a result of the sync operation.

#### Parameters

| Name | Type |
| :------ | :------ |
| `error` | `Error` |
| `...args` | `any`[] |

#### Returns

`void`

#### Defined in

[strategies/sync-strategy.ts:24](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/coordinator/src/strategies/sync-strategy.ts#L24)

___

### filter

▸ `Optional` **filter**(...`args`): `boolean`

A filter function that returns `true` if the sync should be performed.

`filter` will be invoked in the context of this strategy (and thus will
have access to both `this.source` and `this.target`).

#### Parameters

| Name | Type |
| :------ | :------ |
| `...args` | `any`[] |

#### Returns

`boolean`

#### Defined in

[strategies/sync-strategy.ts:32](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/coordinator/src/strategies/sync-strategy.ts#L32)
