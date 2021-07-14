---
id: "ConnectionStrategyOptions"
title: "Interface: ConnectionStrategyOptions"
sidebar_label: "ConnectionStrategyOptions"
sidebar_position: 0
custom_edit_url: null
---

## Hierarchy

- [`StrategyOptions`](StrategyOptions.md)

  ↳ **`ConnectionStrategyOptions`**

  ↳↳ [`RequestStrategyOptions`](RequestStrategyOptions.md)

## Properties

### action

• **action**: `string` \| (...`args`: `unknown`[]) => `unknown`

The action to perform on the target.

Can be specified as a string (e.g. `pull`) or a function which will be
invoked in the context of this strategy (and thus will have access to
both `this.source` and `this.target`).

#### Defined in

[strategies/connection-strategy.ts:31](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/coordinator/src/strategies/connection-strategy.ts#L31)

___

### blocking

• `Optional` **blocking**: `boolean` \| (...`args`: `unknown`[]) => `boolean`

Should resolution of `action` on the the target block the completion
of the source's event?

By default, `blocking` is false.

#### Defined in

[strategies/connection-strategy.ts:52](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/coordinator/src/strategies/connection-strategy.ts#L52)

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

### on

• **on**: `string`

The name of the event to observe.

#### Defined in

[strategies/connection-strategy.ts:17](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/coordinator/src/strategies/connection-strategy.ts#L17)

___

### source

• **source**: `string`

The name of the source to be observed.

#### Defined in

[strategies/connection-strategy.ts:12](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/coordinator/src/strategies/connection-strategy.ts#L12)

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

• `Optional` **target**: `string`

The name of the source which will be acted upon.

#### Defined in

[strategies/connection-strategy.ts:22](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/coordinator/src/strategies/connection-strategy.ts#L22)

## Methods

### catch

▸ `Optional` **catch**(`error`, ...`args`): `void`

A handler for any errors thrown as a result of performing the action.

#### Parameters

| Name | Type |
| :------ | :------ |
| `error` | `Error` |
| `...args` | `unknown`[] |

#### Returns

`void`

#### Defined in

[strategies/connection-strategy.ts:36](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/coordinator/src/strategies/connection-strategy.ts#L36)

___

### filter

▸ `Optional` **filter**(...`args`): `boolean`

A filter function that returns `true` if the `action` should be performed.

`filter` will be invoked in the context of this strategy (and thus will
have access to both `this.source` and `this.target`).

#### Parameters

| Name | Type |
| :------ | :------ |
| `...args` | `unknown`[] |

#### Returns

`boolean`

#### Defined in

[strategies/connection-strategy.ts:44](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/coordinator/src/strategies/connection-strategy.ts#L44)
