---
id: "EventLoggingStrategyOptions"
title: "Interface: EventLoggingStrategyOptions"
sidebar_label: "EventLoggingStrategyOptions"
sidebar_position: 0
custom_edit_url: null
---

## Hierarchy

- [`StrategyOptions`](StrategyOptions.md)

  ↳ **`EventLoggingStrategyOptions`**

## Properties

### events

• `Optional` **events**: `string`[]

#### Defined in

[strategies/event-logging-strategy.ts:17](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/coordinator/src/strategies/event-logging-strategy.ts#L17)

___

### interfaces

• `Optional` **interfaces**: `string`[]

#### Defined in

[strategies/event-logging-strategy.ts:18](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/coordinator/src/strategies/event-logging-strategy.ts#L18)

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

### sources

• `Optional` **sources**: `string`[]

The names of sources to include in this strategy. Leave undefined
to include all sources registered with a coordinator.

#### Inherited from

[StrategyOptions](StrategyOptions.md).[sources](StrategyOptions.md#sources)

#### Defined in

[strategy.ts:19](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/coordinator/src/strategy.ts#L19)
