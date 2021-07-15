---
id: "SyncQueryable"
title: "Interface: SyncQueryable<Data, Details, O, QE, QueryBuilder, Options>"
sidebar_label: "SyncQueryable"
sidebar_position: 0
custom_edit_url: null
---

## Type parameters

| Name | Type |
| :------ | :------ |
| `Data` | `Data` |
| `Details` | `Details` |
| `O` | extends [`Operation`](Operation.md) |
| `QE` | extends [`QueryExpression`](QueryExpression.md) |
| `QueryBuilder` | `QueryBuilder` |
| `Options` | extends [`RequestOptions`](RequestOptions.md)[`RequestOptions`](RequestOptions.md) |

## Methods

### query

▸ **query**<`RequestData`\>(`queryOrExpressions`, `options?`, `id?`): `RequestData`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `RequestData` | `Data` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `queryOrExpressions` | [`QueryOrExpressions`](../modules.md#queryorexpressions)<`QE`, `QueryBuilder`\> |
| `options?` | [`DefaultRequestOptions`](../modules.md#defaultrequestoptions)<`Options`\> |
| `id?` | `string` |

#### Returns

`RequestData`

#### Defined in

[packages/@orbit/data/src/queryable.ts:43](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/queryable.ts#L43)

▸ **query**<`RequestData`, `RequestDetails`, `RequestOperation`\>(`queryOrExpressions`, `options`, `id?`): [`FullResponse`](FullResponse.md)<`RequestData`, `RequestDetails`, `RequestOperation`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `RequestData` | `Data` |
| `RequestDetails` | `Details` |
| `RequestOperation` | extends [`Operation`](Operation.md)`O` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `queryOrExpressions` | [`QueryOrExpressions`](../modules.md#queryorexpressions)<`QE`, `QueryBuilder`\> |
| `options` | [`FullRequestOptions`](../modules.md#fullrequestoptions)<`Options`\> |
| `id?` | `string` |

#### Returns

[`FullResponse`](FullResponse.md)<`RequestData`, `RequestDetails`, `RequestOperation`\>

#### Defined in

[packages/@orbit/data/src/queryable.ts:48](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/queryable.ts#L48)
