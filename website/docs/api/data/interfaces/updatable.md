---
id: "Updatable"
title: "Interface: Updatable<Data, Details, O, TransformBuilder, Options>"
sidebar_label: "Updatable"
sidebar_position: 0
custom_edit_url: null
---

A source decorated as `@updatable` must also implement the `Updatable`
interface.

## Type parameters

| Name | Type |
| :------ | :------ |
| `Data` | `Data` |
| `Details` | `Details` |
| `O` | extends [`Operation`](Operation.md) |
| `TransformBuilder` | `TransformBuilder` |
| `Options` | extends [`RequestOptions`](RequestOptions.md)[`RequestOptions`](RequestOptions.md) |

## Hierarchy

- [`AsyncUpdatable`](AsyncUpdatable.md)<`Data`, `Details`, `O`, `TransformBuilder`, `Options`\>

  ↳ **`Updatable`**

## Methods

### \_update

▸ **_update**(`transform`, `hints?`): `Promise`<[`FullResponse`](FullResponse.md)<`Data`, `Details`, `O`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `transform` | [`Transform`](Transform.md)<`O`\> |
| `hints?` | [`ResponseHints`](ResponseHints.md)<`Data`, `Details`\> |

#### Returns

`Promise`<[`FullResponse`](FullResponse.md)<`Data`, `Details`, `O`\>\>

#### Defined in

[packages/@orbit/data/src/source-interfaces/updatable.ts:36](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/source-interfaces/updatable.ts#L36)

___

### update

▸ **update**<`RequestData`\>(`transformOrOperations`, `options?`, `id?`): `Promise`<`RequestData`\>

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

`Promise`<`RequestData`\>

#### Inherited from

[AsyncUpdatable](AsyncUpdatable.md).[update](AsyncUpdatable.md#update)

#### Defined in

[packages/@orbit/data/src/updatable.ts:17](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/updatable.ts#L17)

▸ **update**<`RequestData`, `RequestDetails`, `RequestOperation`\>(`transformOrOperations`, `options`, `id?`): `Promise`<[`FullResponse`](FullResponse.md)<`RequestData`, `RequestDetails`, `RequestOperation`\>\>

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

#### Inherited from

[AsyncUpdatable](AsyncUpdatable.md).[update](AsyncUpdatable.md#update)

#### Defined in

[packages/@orbit/data/src/updatable.ts:22](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/updatable.ts#L22)
