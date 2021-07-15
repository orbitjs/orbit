---
id: "AsyncQueryable"
title: "Interface: AsyncQueryable<Data, Details, O, QE, QueryBuilder, Options>"
sidebar_label: "AsyncQueryable"
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

## Hierarchy

- **`AsyncQueryable`**

  ↳ [`Queryable`](Queryable.md)

## Methods

### query

▸ **query**<`RequestData`\>(`queryOrExpressions`, `options?`, `id?`): `Promise`<`RequestData`\>

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

`Promise`<`RequestData`\>

#### Defined in

[packages/@orbit/data/src/queryable.ts:19](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/queryable.ts#L19)

▸ **query**<`RequestData`, `RequestDetails`, `RequestOperation`\>(`queryOrExpressions`, `options`, `id?`): `Promise`<[`FullResponse`](FullResponse.md)<`RequestData`, `RequestDetails`, `RequestOperation`\>\>

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

`Promise`<[`FullResponse`](FullResponse.md)<`RequestData`, `RequestDetails`, `RequestOperation`\>\>

#### Defined in

[packages/@orbit/data/src/queryable.ts:24](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/queryable.ts#L24)
