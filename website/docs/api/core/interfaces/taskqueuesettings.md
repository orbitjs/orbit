---
id: "TaskQueueSettings"
title: "Interface: TaskQueueSettings<Type, Data, Options>"
sidebar_label: "TaskQueueSettings"
sidebar_position: 0
custom_edit_url: null
---

Settings for a `TaskQueue`.

## Type parameters

| Name | Type |
| :------ | :------ |
| `Type` | `string` |
| `Data` | `unknown` |
| `Options` | `unknown` |

## Properties

### autoActivate

• `Optional` **autoActivate**: `boolean`

A flag indicating whether activation should happen as part of
instantiation. Set to `false` to override the default `true` behavior. When
`autoActivate === false`, no tasks reified from the queue's bucket will be
automatically processed as part of queue instantiation, regardless of the
`autoProcess` setting. Invoke `queue.activate()` as a separate step to
finish activation and start processing tasks.

#### Defined in

[packages/@orbit/core/src/task-queue.ts:42](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/task-queue.ts#L42)

___

### autoProcess

• `Optional` **autoProcess**: `boolean`

A flag indicating whether tasks should be processed as soon as they are
pushed into a queue. Set to `false` to override the default `true`
behavior.

#### Defined in

[packages/@orbit/core/src/task-queue.ts:32](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/task-queue.ts#L32)

___

### bucket

• `Optional` **bucket**: [`Bucket`](../classes/Bucket.md)<[`Task`](Task.md)<`Type`, `Data`, `Options`\>[]\>

A bucket in which to persist queue state.

#### Defined in

[packages/@orbit/core/src/task-queue.ts:25](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/task-queue.ts#L25)

___

### name

• `Optional` **name**: `string`

Name used for tracking and debugging a task queue.

#### Defined in

[packages/@orbit/core/src/task-queue.ts:20](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/task-queue.ts#L20)
