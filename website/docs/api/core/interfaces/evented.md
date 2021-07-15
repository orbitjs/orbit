---
id: "Evented"
title: "Interface: Evented<Event>"
sidebar_label: "Evented"
sidebar_position: 0
custom_edit_url: null
---

A class decorated as `@evented` should also implement the `Evented`
interface.

```ts
import { evented, Evented } from '@orbit/core';

@evented
class Source implements Evented {
  // ... Evented implementation
}
```

## Type parameters

| Name | Type |
| :------ | :------ |
| `Event` | extends `string``string` |

## Hierarchy

- **`Evented`**

  ↳ [`TaskQueue`](../classes/TaskQueue.md)

  ↳ [`Bucket`](../classes/Bucket.md)

  ↳ [`Log`](../classes/Log.md)

## Methods

### emit

▸ **emit**(`event`, ...`args`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `Event` |
| `...args` | `unknown`[] |

#### Returns

`void`

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

#### Defined in

[packages/@orbit/core/src/evented.ts:28](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/evented.ts#L28)
