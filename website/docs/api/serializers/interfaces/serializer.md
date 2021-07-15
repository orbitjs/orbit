---
id: "Serializer"
title: "Interface: Serializer<From, To, SerializationOptions, DeserializationOptions>"
sidebar_label: "Serializer"
sidebar_position: 0
custom_edit_url: null
---

## Type parameters

| Name | Type |
| :------ | :------ |
| `From` | `unknown` |
| `To` | `unknown` |
| `SerializationOptions` | `unknown` |
| `DeserializationOptions` | `unknown` |

## Implemented by

- [`BaseSerializer`](../classes/BaseSerializer.md)
- [`NoopSerializer`](../classes/NoopSerializer.md)

## Methods

### deserialize

▸ **deserialize**(`arg`, `options?`): `From`

#### Parameters

| Name | Type |
| :------ | :------ |
| `arg` | `To` |
| `options?` | `DeserializationOptions` |

#### Returns

`From`

#### Defined in

[serializer.ts:8](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/serializers/src/serializer.ts#L8)

___

### serialize

▸ **serialize**(`arg`, `options?`): `To`

#### Parameters

| Name | Type |
| :------ | :------ |
| `arg` | `From` |
| `options?` | `SerializationOptions` |

#### Returns

`To`

#### Defined in

[serializer.ts:7](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/serializers/src/serializer.ts#L7)
