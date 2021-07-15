---
id: "QueryRequestProcessor"
title: "Interface: QueryRequestProcessor"
sidebar_label: "QueryRequestProcessor"
sidebar_position: 0
custom_edit_url: null
---

## Callable

### QueryRequestProcessor

▸ **QueryRequestProcessor**(`requestProcessor`, `request`): `Promise`<[`QueryRequestProcessorResponse`](../modules.md#queryrequestprocessorresponse)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestProcessor` | [`JSONAPIRequestProcessor`](../classes/JSONAPIRequestProcessor.md) |
| `request` | [`RecordQueryRequest`](../modules.md#recordqueryrequest) |

#### Returns

`Promise`<[`QueryRequestProcessorResponse`](../modules.md#queryrequestprocessorresponse)\>

#### Defined in

[packages/@orbit/jsonapi/src/lib/query-requests.ts:69](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/jsonapi/src/lib/query-requests.ts#L69)
