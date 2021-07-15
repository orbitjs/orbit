---
id: "Notifier"
title: "Class: Notifier"
sidebar_label: "Notifier"
sidebar_position: 0
custom_edit_url: null
---

The `Notifier` class can emit messages to an array of subscribed listeners.
Here's a simple example:

```ts
import { Notifier } from '@orbit/core';

let notifier = new Notifier();
notifier.addListener((message: string) => {
  console.log("I heard " + message);
});
notifier.addListener((message: string) => {
  console.log("I also heard " + message);
});

notifier.emit('hello'); // logs "I heard hello" and "I also heard hello"
```

Calls to `emit` will send along all of their arguments.

## Constructors

### constructor

• **new Notifier**()

#### Defined in

[packages/@orbit/core/src/notifier.ts:26](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/notifier.ts#L26)

## Properties

### listeners

• **listeners**: [`Listener`](../modules.md#listener)[]

#### Defined in

[packages/@orbit/core/src/notifier.ts:24](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/notifier.ts#L24)

## Methods

### addListener

▸ **addListener**(`listener`): () => `void`

Add a callback as a listener, which will be triggered when sending
notifications.

#### Parameters

| Name | Type |
| :------ | :------ |
| `listener` | [`Listener`](../modules.md#listener) |

#### Returns

`fn`

▸ (): `void`

Add a callback as a listener, which will be triggered when sending
notifications.

##### Returns

`void`

#### Defined in

[packages/@orbit/core/src/notifier.ts:34](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/notifier.ts#L34)

___

### emit

▸ **emit**(...`args`): `void`

Notify registered listeners.

#### Parameters

| Name | Type |
| :------ | :------ |
| `...args` | `unknown`[] |

#### Returns

`void`

#### Defined in

[packages/@orbit/core/src/notifier.ts:57](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/notifier.ts#L57)

___

### removeListener

▸ **removeListener**(`listener`): `void`

Remove a listener so that it will no longer receive notifications.

#### Parameters

| Name | Type |
| :------ | :------ |
| `listener` | [`Listener`](../modules.md#listener) |

#### Returns

`void`

#### Defined in

[packages/@orbit/core/src/notifier.ts:43](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/notifier.ts#L43)
