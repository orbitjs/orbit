---
id: "IndexedDBBucketSettings"
title: "Interface: IndexedDBBucketSettings"
sidebar_label: "IndexedDBBucketSettings"
sidebar_position: 0
custom_edit_url: null
---

## Hierarchy

- `BucketSettings`

  ↳ **`IndexedDBBucketSettings`**

## Properties

### name

• `Optional` **name**: `string`

Name used for tracking and debugging a bucket instance.

#### Inherited from

BucketSettings.name

#### Defined in

core/dist/modules/bucket.d.ts:9

___

### namespace

• `Optional` **namespace**: `string`

The namespace used by the bucket when accessing any items.

This is used to distinguish one bucket's contents from another.

#### Inherited from

BucketSettings.namespace

#### Defined in

core/dist/modules/bucket.d.ts:15

___

### storeName

• `Optional` **storeName**: `string`

#### Defined in

[indexeddb-bucket/src/bucket.ts:9](https://github.com/orbitjs/orbit/blob/6e0cbd41/packages/@orbit/indexeddb-bucket/src/bucket.ts#L9)

___

### version

• `Optional` **version**: `number`

The current version of the bucket.

Used to identify the version of the bucket's schema and thus migrate it
as needed.

#### Inherited from

BucketSettings.version

#### Defined in

core/dist/modules/bucket.d.ts:22
