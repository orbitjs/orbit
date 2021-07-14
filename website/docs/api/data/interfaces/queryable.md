---
id: "Queryable"
title: "Interface: Queryable<Data, Details, O, QE, QueryBuilder, Options>"
sidebar_label: "Queryable"
sidebar_position: 0
custom_edit_url: null
---

A source decorated as `@queryable` must also implement the `Queryable`
interface.

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

- [`AsyncQueryable`](AsyncQueryable.md)<`Data`, `Details`, `O`, `QE`, `QueryBuilder`, `Options`\>

  ↳ **`Queryable`**

## Methods

### \_query

▸ **_query**(`query`, `hints?`): `Promise`<[`FullResponse`](FullResponse.md)<`Data`, `Details`, `O`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `query` | [`Query`](Query.md)<`QE`\> |
| `hints?` | [`ResponseHints`](ResponseHints.md)<`Data`, `Details`\> |

#### Returns

`Promise`<[`FullResponse`](FullResponse.md)<`Data`, `Details`, `O`\>\>

#### Defined in

[packages/@orbit/data/src/source-interfaces/queryable.ts:38](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/source-interfaces/queryable.ts#L38)

___

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

#### Inherited from

[AsyncQueryable](AsyncQueryable.md).[query](AsyncQueryable.md#query)

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

#### Inherited from

[AsyncQueryable](AsyncQueryable.md).[query](AsyncQueryable.md#query)

#### Defined in

[packages/@orbit/data/src/queryable.ts:24](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/queryable.ts#L24)
