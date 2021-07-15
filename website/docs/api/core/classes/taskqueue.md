---
id: "TaskQueue"
title: "Class: TaskQueue<Type, Data, Options, Result>"
sidebar_label: "TaskQueue"
sidebar_position: 0
custom_edit_url: null
---

`TaskQueue` is a FIFO queue of asynchronous tasks that should be
performed sequentially.

Tasks are added to the queue with `push`. Each task will be processed by
calling its `process` method.

By default, task queues will be processed automatically, as soon as tasks
are pushed to them. This can be overridden by setting the `autoProcess`
setting to `false` and calling `process` when you'd like to start
processing.

## Type parameters

| Name | Type |
| :------ | :------ |
| `Type` | `string` |
| `Data` | `unknown` |
| `Options` | `unknown` |
| `Result` | `unknown` |

## Hierarchy

- [`Evented`](../interfaces/Evented.md)

  ↳ **`TaskQueue`**

## Constructors

### constructor

• **new TaskQueue**<`Type`, `Data`, `Options`, `Result`\>(`target`, `settings?`)

Creates an instance of `TaskQueue`.

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
| `settings` | [`TaskQueueSettings`](../interfaces/TaskQueueSettings.md)<`Type`, `Data`, `Options`\> |

#### Inherited from

Evented.constructor

#### Defined in

[packages/@orbit/core/src/task-queue.ts:83](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/task-queue.ts#L83)

## Properties

### autoProcess

• **autoProcess**: `boolean`

#### Defined in

[packages/@orbit/core/src/task-queue.ts:67](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/task-queue.ts#L67)

## Accessors

### bucket

• `get` **bucket**(): `undefined` \| [`Bucket`](Bucket.md)<[`Task`](../interfaces/Task.md)<`Type`, `Data`, `unknown`\>[]\>

A bucket used to persist the state of this queue.

#### Returns

`undefined` \| [`Bucket`](Bucket.md)<[`Task`](../interfaces/Task.md)<`Type`, `Data`, `unknown`\>[]\>

#### Defined in

[packages/@orbit/core/src/task-queue.ts:132](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/task-queue.ts#L132)

___

### current

• `get` **current**(): [`Task`](../interfaces/Task.md)<`Type`, `Data`, `unknown`\>

The current task being processed (if actively processing), or the next
task to be processed (if not actively processing).

#### Returns

[`Task`](../interfaces/Task.md)<`Type`, `Data`, `unknown`\>

#### Defined in

[packages/@orbit/core/src/task-queue.ts:154](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/task-queue.ts#L154)

___

### currentProcessor

• `get` **currentProcessor**(): [`TaskProcessor`](TaskProcessor.md)<`Type`, `Data`, `Options`, `Result`\>

The processor wrapper that is processing the current task (or next task,
if none are being processed).

#### Returns

[`TaskProcessor`](TaskProcessor.md)<`Type`, `Data`, `Options`, `Result`\>

#### Defined in

[packages/@orbit/core/src/task-queue.ts:162](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/task-queue.ts#L162)

___

### empty

• `get` **empty**(): `boolean`

Is the queue empty?

#### Returns

`boolean`

#### Defined in

[packages/@orbit/core/src/task-queue.ts:178](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/task-queue.ts#L178)

___

### entries

• `get` **entries**(): [`Task`](../interfaces/Task.md)<`Type`, `Data`, `unknown`\>[]

The tasks in the queue.

#### Returns

[`Task`](../interfaces/Task.md)<`Type`, `Data`, `unknown`\>[]

#### Defined in

[packages/@orbit/core/src/task-queue.ts:146](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/task-queue.ts#L146)

___

### error

• `get` **error**(): `undefined` \| `Error`

If an error occurs while processing a task, processing will be halted, the
`fail` event will be emitted, and this property will reflect the error
encountered.

#### Returns

`undefined` \| `Error`

#### Defined in

[packages/@orbit/core/src/task-queue.ts:171](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/task-queue.ts#L171)

___

### length

• `get` **length**(): `number`

The number of tasks in the queue.

#### Returns

`number`

#### Defined in

[packages/@orbit/core/src/task-queue.ts:139](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/task-queue.ts#L139)

___

### name

• `get` **name**(): `undefined` \| `string`

Name used for tracking / debugging this queue.

#### Returns

`undefined` \| `string`

#### Defined in

[packages/@orbit/core/src/task-queue.ts:118](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/task-queue.ts#L118)

___

### performer

• `get` **performer**(): [`Performer`](../interfaces/Performer.md)<`Type`, `Data`, `Options`, `Result`\>

The object which will `perform` the tasks in this queue.

#### Returns

[`Performer`](../interfaces/Performer.md)<`Type`, `Data`, `Options`, `Result`\>

#### Defined in

[packages/@orbit/core/src/task-queue.ts:125](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/task-queue.ts#L125)

___

### processing

• `get` **processing**(): `boolean`

Is the queue actively processing a task?

#### Returns

`boolean`

#### Defined in

[packages/@orbit/core/src/task-queue.ts:185](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/task-queue.ts#L185)

___

### reified

• `get` **reified**(): `Promise`<`void`\>

Resolves when the queue has been fully reified from its associated bucket,
if applicable.

#### Returns

`Promise`<`void`\>

#### Defined in

[packages/@orbit/core/src/task-queue.ts:195](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/task-queue.ts#L195)

## Methods

### activate

▸ **activate**(): `Promise`<`void`\>

#### Returns

`Promise`<`void`\>

#### Defined in

[packages/@orbit/core/src/task-queue.ts:107](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/task-queue.ts#L107)

___

### clear

▸ **clear**(`e?`): `Promise`<`void`\>

Cancels the current task and completely clears the queue.

#### Parameters

| Name | Type |
| :------ | :------ |
| `e?` | `Error` |

#### Returns

`Promise`<`void`\>

#### Defined in

[packages/@orbit/core/src/task-queue.ts:258](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/task-queue.ts#L258)

___

### emit

▸ **emit**(`event`, ...`args`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `Event` |
| `...args` | `unknown`[] |

#### Returns

`void`

#### Inherited from

[Evented](../interfaces/Evented.md).[emit](../interfaces/Evented.md#emit)

#### Defined in

[packages/@orbit/core/src/evented.ts:29](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/evented.ts#L29)

___

### listeners

▸ **listeners**(`event`): [`Listener`](../modules.md#listener)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `Event` |

#### Returns

[`Listener`](../modules.md#listener)[]

#### Inherited from

[Evented](../interfaces/Evented.md).[listeners](../interfaces/Evented.md#listeners)

#### Defined in

[packages/@orbit/core/src/evented.ts:30](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/evented.ts#L30)

___

### off

▸ **off**(`event`, `listener?`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `Event` |
| `listener?` | [`Listener`](../modules.md#listener) |

#### Returns

`void`

#### Inherited from

[Evented](../interfaces/Evented.md).[off](../interfaces/Evented.md#off)

#### Defined in

[packages/@orbit/core/src/evented.ts:27](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/evented.ts#L27)

___

### on

▸ **on**(`event`, `listener`): () => `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `Event` |
| `listener` | [`Listener`](../modules.md#listener) |

#### Returns

`fn`

▸ (): `void`

##### Returns

`void`

#### Inherited from

[Evented](../interfaces/Evented.md).[on](../interfaces/Evented.md#on)

#### Defined in

[packages/@orbit/core/src/evented.ts:26](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/evented.ts#L26)

___

### one

▸ **one**(`event`, `listener`): () => `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `Event` |
| `listener` | [`Listener`](../modules.md#listener) |

#### Returns

`fn`

▸ (): `void`

##### Returns

`void`

#### Inherited from

[Evented](../interfaces/Evented.md).[one](../interfaces/Evented.md#one)

#### Defined in

[packages/@orbit/core/src/evented.ts:28](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/evented.ts#L28)

___

### process

▸ **process**(): `Promise`<`void`\>

Processes all the tasks in the queue. Resolves when the queue is empty.

#### Returns

`Promise`<`void`\>

#### Defined in

[packages/@orbit/core/src/task-queue.ts:321](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/task-queue.ts#L321)

___

### push

▸ **push**(`task`): `Promise`<`Result`\>

Push a new task onto the end of the queue.

If `autoProcess` is enabled, this will automatically trigger processing of
the queue.

Returns the result of processing the pushed task.

#### Parameters

| Name | Type |
| :------ | :------ |
| `task` | [`Task`](../interfaces/Task.md)<`Type`, `Data`, `Options`\> |

#### Returns

`Promise`<`Result`\>

#### Defined in

[packages/@orbit/core/src/task-queue.ts:207](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/task-queue.ts#L207)

___

### retry

▸ **retry**(): `Promise`<`Result`\>

Cancels and re-tries processing the current task.

Returns the result of the retried task.

#### Returns

`Promise`<`Result`\>

#### Defined in

[packages/@orbit/core/src/task-queue.ts:223](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/task-queue.ts#L223)

___

### shift

▸ **shift**(`e?`): `Promise`<`undefined` \| [`Task`](../interfaces/Task.md)<`Type`, `Data`, `unknown`\>\>

Cancels the current task and removes it, but does not continue processing.

Returns the canceled and removed task.

#### Parameters

| Name | Type |
| :------ | :------ |
| `e?` | `Error` |

#### Returns

`Promise`<`undefined` \| [`Task`](../interfaces/Task.md)<`Type`, `Data`, `unknown`\>\>

#### Defined in

[packages/@orbit/core/src/task-queue.ts:280](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/task-queue.ts#L280)

___

### skip

▸ **skip**(`e?`): `Promise`<`void`\>

Cancels and discards the current task.

If `autoProcess` is enabled, this will automatically trigger processing of
the queue.

#### Parameters

| Name | Type |
| :------ | :------ |
| `e?` | `Error` |

#### Returns

`Promise`<`void`\>

#### Defined in

[packages/@orbit/core/src/task-queue.ts:240](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/task-queue.ts#L240)

___

### unshift

▸ **unshift**(`task`): `Promise`<`Result`\>

Cancels processing the current task and inserts a new task at the beginning
of the queue. This new task will be processed next.

Returns the result of processing the new task.

#### Parameters

| Name | Type |
| :------ | :------ |
| `task` | [`Task`](../interfaces/Task.md)<`Type`, `Data`, `Options`\> |

#### Returns

`Promise`<`Result`\>

#### Defined in

[packages/@orbit/core/src/task-queue.ts:303](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/task-queue.ts#L303)
