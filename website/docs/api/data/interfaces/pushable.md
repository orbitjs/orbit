---
id: "Pushable"
title: "Interface: Pushable<Data, Details, O, TransformBuilder, Options>"
sidebar_label: "Pushable"
sidebar_position: 0
custom_edit_url: null
---

A source decorated as `@pushable` must also implement the `Pushable`
interface.

**`deprecated`** since v0.17, use `Updatable` instead

## Type parameters

| Name | Type |
| :------ | :------ |
| `Data` | `Data` |
| `Details` | `Details` |
| `O` | extends [`Operation`](Operation.md) |
| `TransformBuilder` | `TransformBuilder` |
| `Options` | extends [`RequestOptions`](RequestOptions.md)[`RequestOptions`](RequestOptions.md) |

## Methods

### \_push

▸ **_push**(`transform`, `hints?`): `Promise`<[`FullResponse`](FullResponse.md)<`Data`, `Details`, `O`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `transform` | [`Transform`](Transform.md)<`O`\> |
| `hints?` | [`ResponseHints`](ResponseHints.md)<`Data`, `Details`\> |

#### Returns

`Promise`<[`FullResponse`](FullResponse.md)<`Data`, `Details`, `O`\>\>

#### Defined in

[packages/@orbit/data/src/source-interfaces/pushable.ts:62](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/source-interfaces/pushable.ts#L62)

___

### push

▸ **push**<`RequestOperation`\>(`transformOrOperations`, `options?`, `id?`): `Promise`<[`Transform`](Transform.md)<`RequestOperation`\>[]\>

The `push` method accepts a `Transform` instance as an argument and returns
a promise that resolves to an array of `Transform` instances that are
applied as a result. In other words, `push` captures the direct results
_and_ side effects of applying a `Transform` to a source.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `RequestOperation` | extends [`Operation`](Operation.md)`O` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `transformOrOperations` | [`TransformOrOperations`](../modules.md#transformoroperations)<`O`, `TransformBuilder`\> |
| `options?` | [`DefaultRequestOptions`](../modules.md#defaultrequestoptions)<`Options`\> |
| `id?` | `string` |

#### Returns

`Promise`<[`Transform`](Transform.md)<`RequestOperation`\>[]\>

#### Defined in

[packages/@orbit/data/src/source-interfaces/pushable.ts:47](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/source-interfaces/pushable.ts#L47)

▸ **push**<`RequestData`, `RequestDetails`, `RequestOperation`\>(`transformOrOperations`, `options`, `id?`): `Promise`<[`FullResponse`](FullResponse.md)<`RequestData`, `RequestDetails`, `RequestOperation`\>\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `RequestData` | `Data` |
| `RequestDetails` | `Details` |
| `RequestOperation` | extends [`Operation`](Operation.md)`O` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `transformOrOperations` | [`TransformOrOperations`](../modules.md#transformoroperations)<`O`, `TransformBuilder`\> |
| `options` | [`FullRequestOptions`](../modules.md#fullrequestoptions)<`Options`\> |
| `id?` | `string` |

#### Returns

`Promise`<[`FullResponse`](FullResponse.md)<`RequestData`, `RequestDetails`, `RequestOperation`\>\>

#### Defined in

[packages/@orbit/data/src/source-interfaces/pushable.ts:52](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/source-interfaces/pushable.ts#L52)
