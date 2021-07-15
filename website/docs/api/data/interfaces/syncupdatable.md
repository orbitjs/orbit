---
id: "SyncUpdatable"
title: "Interface: SyncUpdatable<Data, Details, O, TransformBuilder, Options>"
sidebar_label: "SyncUpdatable"
sidebar_position: 0
custom_edit_url: null
---

## Type parameters

| Name | Type |
| :------ | :------ |
| `Data` | `Data` |
| `Details` | `Details` |
| `O` | extends [`Operation`](Operation.md) |
| `TransformBuilder` | `TransformBuilder` |
| `Options` | extends [`RequestOptions`](RequestOptions.md)[`RequestOptions`](RequestOptions.md) |

## Methods

### update

▸ **update**<`RequestData`\>(`transformOrOperations`, `options?`, `id?`): `RequestData`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `RequestData` | `Data` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `transformOrOperations` | [`TransformOrOperations`](../modules.md#transformoroperations)<`O`, `TransformBuilder`\> |
| `options?` | [`DefaultRequestOptions`](../modules.md#defaultrequestoptions)<`Options`\> |
| `id?` | `string` |

#### Returns

`RequestData`

#### Defined in

[packages/@orbit/data/src/updatable.ts:40](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/updatable.ts#L40)

▸ **update**<`RequestData`, `RequestDetails`, `RequestOperation`\>(`transformOrOperations`, `options`, `id?`): [`FullResponse`](FullResponse.md)<`RequestData`, `RequestDetails`, `RequestOperation`\>

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

[`FullResponse`](FullResponse.md)<`RequestData`, `RequestDetails`, `RequestOperation`\>

#### Defined in

[packages/@orbit/data/src/updatable.ts:45](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/updatable.ts#L45)
