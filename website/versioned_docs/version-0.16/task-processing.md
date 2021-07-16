---
title: Task processing
---

Tasks and queues are primitives contained in `@orbit/core` that are useful for
processing actions asynchronously and serially.

Although you'll typically work with tasks indirectly, understanding these
concepts can help you better troubleshoot and harden your Orbit applications.

## Tasks

Every action performed by sources, from updates to queries, is considered a
"task" to be performed asynchronously.

The `Task` interface is simply:

```typescript
interface Task {
  type: string;
  id?: string;
  data?: any;
}
```

A task's `type`, such as `"query"` or `"update"`, signals how that task should
be performed. An `id` is assigned to uniquely identify the task. And `data`
should contain the type-specific data needed to perform the task, such as an
object that conforms with the `Query` or `Transform` interfaces.

## Performers

Tasks are performed asynchronously by a `Performer`:

```typescript
export interface Performer {
  perform(task: Task): Promise<any>;
}
```

In `@orbit/data`, every `Source` implements the `Performer` interface.

## Task queues

Tasks can be added to queues, which act as FIFO stacks that perform each task
serially and asynchronously.

Task queues are associated with a single `performer`, such as a `Source`, that
will perform each task. A `performer` must be assigned when instantiating a
`TaskQueue`:

```javascript
const queue = new TaskQueue(source); // `source` implements `Performer`
```

By default, task queues automatically process any tasks that are added to them
and will continue until either all tasks have been performed or a problem has
been encountered. For finer control over processing, it's possible to
instantiate a queue that will only process tasks explicitly:

```javascript
const queue = new TaskQueue(source, { autoProcess: false });
```

Tasks are normally added to the end of a queue via the `push` method:

```javascript
queue.push({
  type: "query",
  data: { expression: { op: "findRecords", type: "planet" } }
});
```

### Task processing

Depending upon whether a queue is set to `autoProcess`, task processing will
start either immediately or after the `process` method has been called.

Queues emit the following events when processing tasks:

- `change` - whenever a task has been added or removed to a queue

- `beforeTask` - before processing of a task begins

- `task` - after a task has been processed successfully

- `fail` - when a task has failed to process

- `complete` - when all tasks have been processed

As each task is processed successfully, it will be removed from the queue.

If processing fails, the queue will emit the `fail` event and processing will
stop. At that point, you have several options:

- `retry()` will retry the task that failed.

- `skip()` will cancel and discard the current task and proceed to
  process the next task.

- `clear()` will cancel the current task and completely clear the queue.

- `shift()` will cancel the current task and remove it, but will not continue
  processing.

- `unshift(newTask)` will cancel the current task and insert a new task in front
  of it at the beginning of the queue.

These options provide fairly complete control over task processing, which can
prove useful when handling exceptions, debugging, and testing.

### Task queues for sources

Every `Source` in `@orbit/data` maintains two task queues:

- A `requestQueue` for processing requests, such as updates and queries.

- A `syncQueue` for synchronizing changes between sources.

These queues are discussed in more detail as part of the guide on "data flows".
