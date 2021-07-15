---
id: "Pullable"
title: "Interface: Pullable<Data, Details, O, QE, QueryBuilder, Options>"
sidebar_label: "Pullable"
sidebar_position: 0
custom_edit_url: null
---

A source decorated as `@pullable` must also implement the `Pullable`
interface.

**`deprecated`** since v0.17, use `Queryable` instead

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

### \_pull

▸ **_pull**(`query`): `Promise`<[`FullResponse`](FullResponse.md)<`Data`, `Details`, `O`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `query` | [`Query`](Query.md)<`QE`\> |

#### Returns

`Promise`<[`FullResponse`](FullResponse.md)<`Data`, `Details`, `O`\>\>

#### Defined in

[packages/@orbit/data/src/source-interfaces/pullable.ts:65](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/source-interfaces/pullable.ts#L65)

___

### pull

▸ **pull**<`RequestOperation`\>(`queryOrExpressions`, `options?`, `id?`): `Promise`<[`Transform`](Transform.md)<`RequestOperation`\>[]\>

The `pull` method accepts a query or expression(s) and returns a promise
that resolves to an array of `Transform` instances that represent the
changeset that resulted from applying the query. In other words, a `pull`
request retrieves the results of a query in `Transform` form.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `RequestOperation` | extends [`Operation`](Operation.md)`O` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `queryOrExpressions` | [`QueryOrExpressions`](../modules.md#queryorexpressions)<`QE`, `QueryBuilder`\> |
| `options?` | [`DefaultRequestOptions`](../modules.md#defaultrequestoptions)<`Options`\> |
| `id?` | `string` |

#### Returns

`Promise`<[`Transform`](Transform.md)<`RequestOperation`\>[]\>

#### Defined in

[packages/@orbit/data/src/source-interfaces/pullable.ts:50](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/source-interfaces/pullable.ts#L50)

▸ **pull**<`RequestData`, `RequestDetails`, `RequestOperation`\>(`queryOrExpressions`, `options?`, `id?`): `Promise`<[`FullResponse`](FullResponse.md)<`RequestData`, `RequestDetails`, `RequestOperation`\>\>

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
| `options?` | [`FullRequestOptions`](../modules.md#fullrequestoptions)<`Options`\> |
| `id?` | `string` |

#### Returns

`Promise`<[`FullResponse`](FullResponse.md)<`RequestData`, `RequestDetails`, `RequestOperation`\>\>

#### Defined in

[packages/@orbit/data/src/source-interfaces/pullable.ts:55](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/source-interfaces/pullable.ts#L55)
