# Changelog

## v0.16.0-beta.5 (2019-04-16)

#### :bug: Bug Fix
* `@orbit/record-cache`
  * [#625](https://github.com/orbitjs/orbit/pull/625) Fix updating an empty record with an empty relationship ([@simonihmig](https://github.com/simonihmig))

#### Committers: 1
- Simon Ihmig ([@simonihmig](https://github.com/simonihmig))


## v0.16.0-beta.4 (2019-04-15)

#### :rocket: Enhancement
* `@orbit/jsonapi`
  * [#621](https://github.com/orbitjs/orbit/pull/621) Extract appendQueryParams in its own method ([@tchak](https://github.com/tchak))

#### :bug: Bug Fix
* `@orbit/record-cache`, `@orbit/store`
  * [#620](https://github.com/orbitjs/orbit/pull/620) Fix update record not populating inverse relationships ([@ggayowsky](https://github.com/ggayowsky))

#### :house: Internal
* `@orbit/indexeddb`
  * [#623](https://github.com/orbitjs/orbit/pull/623) Rationalize indexes ([@tchak](https://github.com/tchak))

#### Committers: 2
- Gerald Gayowsky ([@ggayowsky](https://github.com/ggayowsky))
- Paul Chavard ([@tchak](https://github.com/tchak))


## v0.16.0-beta.3 (2019-03-17)

#### :bug: Bug Fix
* `@orbit/indexeddb`, `@orbit/local-storage`, `@orbit/record-cache`
  * [#608](https://github.com/orbitjs/orbit/pull/608) RemoveRecord when part of has many relationship should not clobber the whole relationship in IndexedDB source ([@tchak](https://github.com/tchak))
* `@orbit/indexeddb`, `@orbit/local-storage`
  * [#606](https://github.com/orbitjs/orbit/pull/606) Do not reset persisting sources on initalize ([@tchak](https://github.com/tchak))

#### :house: Internal
* `@orbit/indexeddb`, `@orbit/local-storage`
  * [#610](https://github.com/orbitjs/orbit/pull/610) Add tests to verify local storage + indexeddb sources are not reset on initialization ([@dgeb](https://github.com/dgeb))
* `@orbit/integration-tests`
  * [#609](https://github.com/orbitjs/orbit/pull/609) Add integration-tests package ([@dgeb](https://github.com/dgeb))

#### Committers: 2
- Dan Gebhardt ([@dgeb](https://github.com/dgeb))
- Paul Chavard ([@tchak](https://github.com/tchak))


## v0.16.0-beta.2 (2019-03-14)

#### :rocket: Enhancement
* `@orbit/store`
  * [#596](https://github.com/orbitjs/orbit/pull/596) Add Store.rebase() ([@Bernhard---H](https://github.com/Bernhard---H))

#### :bug: Bug Fix
* `@orbit/record-cache`
  * [#603](https://github.com/orbitjs/orbit/pull/603) Return empty array when querying for non-existing relationships with findRelatedRecords ([@PieterJanVdb](https://github.com/PieterJanVdb))

* `@orbit/record-cache`
  * [#605](https://github.com/orbitjs/orbit/pull/605) Extends #603 to fix related errors ([@dgeb](https://github.com/dgeb))

#### :house: Internal
* `@orbit/store`
  * [#604](https://github.com/orbitjs/orbit/pull/604) Cleanup and extend store tests ([@dgeb](https://github.com/dgeb))

#### Committers: 3
- Bernhard Halbartschlager ([@Bernhard---H](https://github.com/Bernhard---H))
- Pieter-Jan Vandenbussche ([@PieterJanVdb](https://github.com/PieterJanVdb))
- Dan Gebhardt ([@dgeb](https://github.com/dgeb))


## v0.16.0-beta.1 (2019-02-10)

#### :boom: Breaking Change
* `@orbit/data`, `@orbit/indexeddb`, `@orbit/jsonapi`, `@orbit/local-storage`, `@orbit/record-cache`, `@orbit/store`
  * [#574](https://github.com/orbitjs/orbit/pull/574) Deprecate replaceRecord op in favor of updateRecord ([@dgeb](https://github.com/dgeb))
* `@orbit/coordinator`, `@orbit/core`, `@orbit/data`, `@orbit/indexeddb-bucket`, `@orbit/indexeddb`, `@orbit/jsonapi`, `@orbit/local-storage-bucket`, `@orbit/local-storage`, `@orbit/record-cache`, `@orbit/store`, `@orbit/utils`
  * [#573](https://github.com/orbitjs/orbit/pull/573) [BREAKING] Expose assert + deprecate only on OrbitGlobal ([@dgeb](https://github.com/dgeb))
* `@orbit/coordinator`, `@orbit/core`, `@orbit/data`, `@orbit/record-cache`, `@orbit/store`
  * [#567](https://github.com/orbitjs/orbit/pull/567) Define Listener interface and remove support for explicit binding object in listeners ([@dgeb](https://github.com/dgeb))

#### :rocket: Enhancement
* `@orbit/data`, `@orbit/jsonapi`
  * [#591](https://github.com/orbitjs/orbit/pull/591) [jsonapi] Use new serializers for serializing / deserializing attribute values ([@dgeb](https://github.com/dgeb))
  * [#587](https://github.com/orbitjs/orbit/pull/587) Expand areas in which meta data is allowed ([@dgeb](https://github.com/dgeb))
  * [#586](https://github.com/orbitjs/orbit/pull/586) Define Link interface and links objects (refactor of #509) ([@dgeb](https://github.com/dgeb))
* `@orbit/jsonapi`, `@orbit/serializers`
  * [#590](https://github.com/orbitjs/orbit/pull/590) JSONAPISerializer implements new Serializer interface ([@dgeb](https://github.com/dgeb))
* `@orbit/serializers`
  * [#589](https://github.com/orbitjs/orbit/pull/589) Introduce @orbit/serializers ([@dgeb](https://github.com/dgeb))
* `@orbit/store`
  * [#585](https://github.com/orbitjs/orbit/pull/585) [store] Support query hints ([@dgeb](https://github.com/dgeb))
* `@orbit/data`, `@orbit/indexeddb`, `@orbit/local-storage`, `@orbit/record-cache`, `@orbit/store`
  * [#584](https://github.com/orbitjs/orbit/pull/584) Support finding records by an array of identities  ([@dgeb](https://github.com/dgeb))
  * [#555](https://github.com/orbitjs/orbit/pull/555) Extract new @orbit/record-cache package ([@dgeb](https://github.com/dgeb))
* `@orbit/coordinator`, `@orbit/data`
  * [#581](https://github.com/orbitjs/orbit/pull/581) Introduce "hints" for requests ([@dgeb](https://github.com/dgeb))
* `@orbit/jsonapi`
  * [#572](https://github.com/orbitjs/orbit/pull/572) [jsonapi] allowedContentTypes can be customized ([@dgeb](https://github.com/dgeb))
  * [#571](https://github.com/orbitjs/orbit/pull/571) [jsonapi] Consider application/json to be valid content ([@dgeb](https://github.com/dgeb))
* `@orbit/immutable`
  * [#550](https://github.com/orbitjs/orbit/pull/550) Expand capabilities of ImmutableMap ([@dgeb](https://github.com/dgeb))

#### :bug: Bug Fix
* `@orbit/core`, `@orbit/local-storage`, `@orbit/store`
  * [#592](https://github.com/orbitjs/orbit/pull/592) Fix some minor typing issues ([@dgeb](https://github.com/dgeb))
* `@orbit/jsonapi`
  * [#588](https://github.com/orbitjs/orbit/pull/588) Always treat a 204 response as having no content ([@simonihmig](https://github.com/simonihmig))
  * [#562](https://github.com/orbitjs/orbit/pull/562) Let ResourceIdentity be null, Closes [#561](https://github.com/orbitjs/orbit/issues/561) ([@lolmaus](https://github.com/lolmaus))
* `@orbit/data`
  * [#578](https://github.com/orbitjs/orbit/pull/578) Coalesce addToRelatedRecords + removeRecord ([@jembezmamy](https://github.com/jembezmamy))
  * [#568](https://github.com/orbitjs/orbit/pull/568) Fix typings for QueryBuilderFunc and TransformBuilderFunc ([@dgeb](https://github.com/dgeb))
  * [#563](https://github.com/orbitjs/orbit/pull/563) Closes [#472](https://github.com/orbitjs/orbit/issues/472) ([@Raiondesu](https://github.com/Raiondesu))
* `@orbit/coordinator`, `@orbit/core`, `@orbit/data`, `@orbit/immutable`, `@orbit/indexeddb-bucket`, `@orbit/indexeddb`, `@orbit/jsonapi`, `@orbit/local-storage-bucket`, `@orbit/local-storage`, `@orbit/record-cache`, `@orbit/store`, `@orbit/utils`
  * [#566](https://github.com/orbitjs/orbit/pull/566) Fix typings ([@dgeb](https://github.com/dgeb))

#### :memo: Documentation
* [#593](https://github.com/orbitjs/orbit/pull/593) Clarify Orbit’s purpose and primary use cases ([@dgeb](https://github.com/dgeb))

#### :house: Internal
* `@orbit/data`, `@orbit/store`
  * [#582](https://github.com/orbitjs/orbit/pull/582) Remove unused exception classes + other minor cleanup  ([@dgeb](https://github.com/dgeb))
* `@orbit/coordinator`, `@orbit/core`, `@orbit/data`, `@orbit/immutable`, `@orbit/indexeddb-bucket`, `@orbit/indexeddb`, `@orbit/jsonapi`, `@orbit/local-storage-bucket`, `@orbit/local-storage`, `@orbit/record-cache`, `@orbit/store`, `@orbit/utils`
  * [#579](https://github.com/orbitjs/orbit/pull/579) Use prepare npm task instead of deprecated prepublish ([@dgeb](https://github.com/dgeb))
  * [#570](https://github.com/orbitjs/orbit/pull/570) Fix security alerts ([@dgeb](https://github.com/dgeb))
  * [#569](https://github.com/orbitjs/orbit/pull/569) Further typing improvements + test refactor ([@dgeb](https://github.com/dgeb))
* Other
  * [#576](https://github.com/orbitjs/orbit/pull/576) Bump build dependencies ([@dgeb](https://github.com/dgeb))

#### Committers: 5
- Alexey ([@Raiondesu](https://github.com/Raiondesu))
- Andrey Mikhaylov (lolmaus) ([@lolmaus](https://github.com/lolmaus))
- Dan Gebhardt ([@dgeb](https://github.com/dgeb))
- Paweł Bator ([@jembezmamy](https://github.com/jembezmamy))
- Simon Ihmig ([@simonihmig](https://github.com/simonihmig))