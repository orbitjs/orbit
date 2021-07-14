---
id: "StrategyOptions"
title: "Interface: StrategyOptions"
sidebar_label: "StrategyOptions"
sidebar_position: 0
custom_edit_url: null
---

## Hierarchy

- **`StrategyOptions`**

  ↳ [`EventLoggingStrategyOptions`](EventLoggingStrategyOptions.md)

  ↳ [`ConnectionStrategyOptions`](ConnectionStrategyOptions.md)

  ↳ [`SyncStrategyOptions`](SyncStrategyOptions.md)

## Properties

### logLevel

• `Optional` **logLevel**: [`None`](../enums/LogLevel.md#none) \| [`Errors`](../enums/LogLevel.md#errors) \| [`Warnings`](../enums/LogLevel.md#warnings) \| [`Info`](../enums/LogLevel.md#info)

A specific log level for this strategy.

Overrides the log level used when activating the coordinator.

#### Defined in

[strategy.ts:33](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/coordinator/src/strategy.ts#L33)

___

### logPrefix

• `Optional` **logPrefix**: `string`

The prefix to use for logging from this strategy.

Defaults to `[${name}]`.

#### Defined in

[strategy.ts:26](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/coordinator/src/strategy.ts#L26)

___

### name

• `Optional` **name**: `string`

Name of strategy.

Used to uniquely identify this strategy in a coordinator's collection.

#### Defined in

[strategy.ts:13](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/coordinator/src/strategy.ts#L13)

___

### sources

• `Optional` **sources**: `string`[]

The names of sources to include in this strategy. Leave undefined
to include all sources registered with a coordinator.

#### Defined in

[strategy.ts:19](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/coordinator/src/strategy.ts#L19)
