---
id: "Syncable"
title: "Interface: Syncable<O, TransformBuilder>"
sidebar_label: "Syncable"
sidebar_position: 0
custom_edit_url: null
---

A source decorated as `@syncable` must also implement the `Syncable`
interface.

## Type parameters

| Name | Type |
| :------ | :------ |
| `O` | extends [`Operation`](Operation.md) |
| `TransformBuilder` | `TransformBuilder` |

## Methods

### \_sync

▸ **_sync**(`transform`): `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `transform` | [`Transform`](Transform.md)<`O`\> |

#### Returns

`Promise`<`void`\>

#### Defined in

[packages/@orbit/data/src/source-interfaces/syncable.ts:34](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/source-interfaces/syncable.ts#L34)

___

### sync

▸ **sync**(`transformOrTransforms`): `Promise`<`void`\>

The `sync` method to a source. This method accepts a `Transform` or array
of `Transform`s as an argument and applies it to the source.

#### Parameters

| Name | Type |
| :------ | :------ |
| `transformOrTransforms` | [`Transform`](Transform.md)<`O`\> \| [`Transform`](Transform.md)<`O`\>[] \| [`TransformBuilderFunc`](../modules.md#transformbuilderfunc)<`O`, `TransformBuilder`\> |

#### Returns

`Promise`<`void`\>

#### Defined in

[packages/@orbit/data/src/source-interfaces/syncable.ts:27](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/source-interfaces/syncable.ts#L27)
