---
id: "modules"
title: "@orbit/core"
sidebar_label: "Exports"
sidebar_position: 0.5
custom_edit_url: null
---

## Classes

- [Assertion](classes/Assertion.md)
- [Bucket](classes/Bucket.md)
- [Exception](classes/Exception.md)
- [Log](classes/Log.md)
- [NotLoggedException](classes/NotLoggedException.md)
- [Notifier](classes/Notifier.md)
- [OutOfRangeException](classes/OutOfRangeException.md)
- [TaskProcessor](classes/TaskProcessor.md)
- [TaskQueue](classes/TaskQueue.md)

## Interfaces

- [BucketSettings](interfaces/BucketSettings.md)
- [Evented](interfaces/Evented.md)
- [LogOptions](interfaces/LogOptions.md)
- [OrbitGlobal](interfaces/OrbitGlobal.md)
- [Performer](interfaces/Performer.md)
- [Task](interfaces/Task.md)
- [TaskQueueSettings](interfaces/TaskQueueSettings.md)

## Type aliases

### Listener

Ƭ **Listener**: (...`args`: `any`[]) => `any`

#### Type declaration

▸ (...`args`): `any`

##### Parameters

| Name | Type |
| :------ | :------ |
| `...args` | `any`[] |

##### Returns

`any`

#### Defined in

[packages/@orbit/core/src/notifier.ts:1](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/notifier.ts#L1)

## Variables

### Orbit

• `Const` **Orbit**: [`OrbitGlobal`](interfaces/OrbitGlobal.md)

#### Defined in

[packages/@orbit/core/src/main.ts:30](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/main.ts#L30)

___

### default

• `Const` **default**: [`OrbitGlobal`](interfaces/OrbitGlobal.md)

#### Defined in

[packages/@orbit/core/src/main.ts:30](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/main.ts#L30)

## Functions

### evented

▸ **evented**(`Klass`): `void`

Marks a class as evented.

An evented class should also implement the `Evented` interface.

```ts
import { evented, Evented } from '@orbit/core';

@evented
class Source implements Evented {
  ...
}
```

Listeners can then register themselves for particular events with `on`:

```ts
let source = new Source();

function listener1(message: string) {
  console.log('listener1 heard ' + message);
};
function listener2(message: string) {
  console.log('listener2 heard ' + message);
};

source.on('greeting', listener1);
source.on('greeting', listener2);

evented.emit('greeting', 'hello'); // logs "listener1 heard hello" and
                                   //      "listener2 heard hello"
```

Listeners can be unregistered from events at any time with `off`:

```ts
source.off('greeting', listener2);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `Klass` | `Object` |
| `Klass.prototype` | `any` |

#### Returns

`void`

#### Defined in

[packages/@orbit/core/src/evented.ts:72](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/evented.ts#L72)

___

### fulfillAll

▸ **fulfillAll**(`obj`, `eventName`, ...`args`): `Promise`<`unknown`[]\>

Fulfills any promises returned by event listeners in parallel, using
`Promise.all`.

Returns an array of results (or `undefined`) returned by listeners.

On error, processing will stop and the returned promise will be rejected with
the error that was encountered.

#### Parameters

| Name | Type |
| :------ | :------ |
| `obj` | [`Evented`](interfaces/Evented.md) |
| `eventName` | `string` |
| `...args` | `unknown`[] |

#### Returns

`Promise`<`unknown`[]\>

#### Defined in

[packages/@orbit/core/src/evented.ts:180](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/evented.ts#L180)

___

### fulfillInSeries

▸ **fulfillInSeries**(`obj`, `eventName`, ...`args`): `Promise`<`unknown`[]\>

Fulfills any promises returned by event listeners in series.

Returns an array of results (or `undefined`) returned by listeners.

On error, processing will stop and the returned promise will be rejected with
the error that was encountered.

#### Parameters

| Name | Type |
| :------ | :------ |
| `obj` | [`Evented`](interfaces/Evented.md) |
| `eventName` | `string` |
| `...args` | `unknown`[] |

#### Returns

`Promise`<`unknown`[]\>

#### Defined in

[packages/@orbit/core/src/evented.ts:156](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/evented.ts#L156)

___

### isEvented

▸ **isEvented**(`obj`): `boolean`

Has a class been decorated as `@evented`?

#### Parameters

| Name | Type |
| :------ | :------ |
| `obj` | `unknown` |

#### Returns

`boolean`

#### Defined in

[packages/@orbit/core/src/evented.ts:8](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/evented.ts#L8)

___

### settleInSeries

▸ **settleInSeries**(`obj`, `eventName`, ...`args`): `Promise`<`unknown`[]\>

Settle any promises returned by event listeners in series.

Returns an array of results (or `undefined`) returned by listeners.

If any errors are encountered during processing, they will be caught and
returned with other results. Errors will not interrupt further processing.

#### Parameters

| Name | Type |
| :------ | :------ |
| `obj` | [`Evented`](interfaces/Evented.md) |
| `eventName` | `string` |
| `...args` | `unknown`[] |

#### Returns

`Promise`<`unknown`[]\>

#### Defined in

[packages/@orbit/core/src/evented.ts:130](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/evented.ts#L130)
