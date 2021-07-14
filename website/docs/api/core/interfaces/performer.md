---
id: "Performer"
title: "Interface: Performer<Type, Data, Options, Result>"
sidebar_label: "Performer"
sidebar_position: 0
custom_edit_url: null
---

Classes that can perform tasks should implement the Performer interface.

## Type parameters

| Name | Type |
| :------ | :------ |
| `Type` | `string` |
| `Data` | `unknown` |
| `Options` | `unknown` |
| `Result` | `unknown` |

## Methods

### perform

▸ **perform**(`task`): `Promise`<`Result`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `task` | [`Task`](Task.md)<`Type`, `Data`, `Options`\> |

#### Returns

`Promise`<`Result`\>

#### Defined in

[packages/@orbit/core/src/task.ts:26](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/core/src/task.ts#L26)
