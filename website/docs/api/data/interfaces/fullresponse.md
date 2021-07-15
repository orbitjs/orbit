---
id: "FullResponse"
title: "Interface: FullResponse<Data, Details, O>"
sidebar_label: "FullResponse"
sidebar_position: 0
custom_edit_url: null
---

## Type parameters

| Name | Type |
| :------ | :------ |
| `Data` | `Data` |
| `Details` | `unknown` |
| `O` | extends [`Operation`](Operation.md)[`Operation`](Operation.md) |

## Properties

### data

• `Optional` **data**: `Data`

Primary data for this response.

#### Defined in

[packages/@orbit/data/src/response.ts:26](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/response.ts#L26)

___

### details

• `Optional` **details**: `Details`

Source-specific response details. For example, a request that uses `fetch`
might include the raw response document in `details`.

#### Defined in

[packages/@orbit/data/src/response.ts:32](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/response.ts#L32)

___

### sources

• `Optional` **sources**: [`NamedFullResponseMap`](NamedFullResponseMap.md)<`unknown`, `unknown`, `O`\>

If fulfilling this request triggers downstream requests in other sources,
those full responses may be returned in the `sources` map.

Note: Response `data` and `details` from other sources do not necessarily
match the types of the primary response

#### Defined in

[packages/@orbit/data/src/response.ts:47](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/response.ts#L47)

___

### transforms

• `Optional` **transforms**: [`Transform`](Transform.md)<`O`\>[]

Transforms should be returned if fulfilling a request results in mutations
to a source.

#### Defined in

[packages/@orbit/data/src/response.ts:38](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/data/src/response.ts#L38)
