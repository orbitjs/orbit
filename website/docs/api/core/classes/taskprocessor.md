---
id: "TaskProcessor"
title: "Class: TaskProcessor<Type, Data, Options, Result>"
sidebar_label: "TaskProcessor"
sidebar_position: 0
custom_edit_url: null
---

A `TaskProcessor` performs a `Task` by calling `perform()` on its target.
This is triggered by calling `process()` on the processor.

A processor maintains a promise that represents the eventual state (resolved
or rejected) of the task. This promise is created upon construction, and
will be returned by calling `settle()`.

A task can be re-tried by first calling `reset()` on the processor. This
will clear the processor's state and allow `process()` to be invoked again.

## Type parameters

| Name | Type |
| :------ | :------ |
| `Type` | `string` |
| `Data` | `unknown` |
| `Options` | `unknown` |
| `Result` | `unknown` |

## Constructors

### constructor

• **new TaskProcessor**<`Type`, `Data`, `Options`, `Result`\>(`target`, `task`)

Creates an instance of TaskProcessor.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Type` | `string` |
| `Data` | `unknown` |
| `Options` | `unknown` |
| `Result` | `unknown` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `target` | [`Performer`](../interfaces/Performer.md)<`Type`, `Data`, `Options`, `Result`\> |
| `task` | [`Task`](../interfaces/Task.md)<`Type`, `Data`, `Options`\> |

#### Defined in

[packages/@orbit/core/src/task-processor.ts:32](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/task-processor.ts#L32)

## Properties

### target

• **target**: [`Performer`](../interfaces/Performer.md)<`Type`, `Data`, `Options`, `Result`\>

#### Defined in

[packages/@orbit/core/src/task-processor.ts:20](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/task-processor.ts#L20)

___

### task

• **task**: [`Task`](../interfaces/Task.md)<`Type`, `Data`, `Options`\>

#### Defined in

[packages/@orbit/core/src/task-processor.ts:21](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/task-processor.ts#L21)

## Accessors

### settled

• `get` **settled**(): `boolean`

Has promise settled, either via `process` or `reject`?

#### Returns

`boolean`

#### Defined in

[packages/@orbit/core/src/task-processor.ts:71](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/task-processor.ts#L71)

___

### started

• `get` **started**(): `boolean`

Has `process` been invoked?

#### Returns

`boolean`

#### Defined in

[packages/@orbit/core/src/task-processor.ts:64](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/task-processor.ts#L64)

## Methods

### process

▸ **process**(): `Promise`<`Result`\>

Invokes `perform` on the target.

#### Returns

`Promise`<`Result`\>

#### Defined in

[packages/@orbit/core/src/task-processor.ts:85](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/task-processor.ts#L85)

___

### reject

▸ **reject**(`e`): `void`

Reject the current promise with a specific error.

#### Parameters

| Name | Type |
| :------ | :------ |
| `e` | `Error` |

#### Returns

`void`

#### Defined in

[packages/@orbit/core/src/task-processor.ts:98](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/task-processor.ts#L98)

___

### reset

▸ **reset**(): `void`

Clears the processor state, allowing for a fresh call to `process()`.

#### Returns

`void`

#### Defined in

[packages/@orbit/core/src/task-processor.ts:45](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/task-processor.ts#L45)

___

### settle

▸ **settle**(): `Promise`<`Result`\>

The eventual result of processing.

#### Returns

`Promise`<`Result`\>

#### Defined in

[packages/@orbit/core/src/task-processor.ts:78](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/task-processor.ts#L78)
