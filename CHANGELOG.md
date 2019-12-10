# Changelog

## v0.17.0-beta.1 (2019-09-22)

#### :rocket: Enhancement

- `@orbit/core`, `@orbit/data`, `@orbit/record-cache`
  - [#695](https://github.com/orbitjs/orbit/pull/695) Return off function from evented subscribers ([@tchak](https://github.com/tchak))
- `@orbit/indexeddb`, `@orbit/local-storage`
  - [#689](https://github.com/orbitjs/orbit/pull/689) Various small improvements to indexeddb and local-storage sources ([@tchak](https://github.com/tchak))
- `@orbit/indexeddb`
  - [#694](https://github.com/orbitjs/orbit/pull/694) Move indexeddb database opening code to source activate hook ([@tchak](https://github.com/tchak))
- `@orbit/data`, `@orbit/indexeddb`, `@orbit/jsonapi`, `@orbit/local-storage`, `@orbit/memory`, `@orbit/record-cache`
  - [#688](https://github.com/orbitjs/orbit/pull/688) Query with multiple expressions ([@tchak](https://github.com/tchak))

#### Committers: 1

- Paul Chavard ([@tchak](https://github.com/tchak))

## v0.16.4 (2019-12-10)

#### :bug: Bug Fix
* `@orbit/data`
  * [#710](https://github.com/orbitjs/orbit/pull/710) Allow mergeOperations to set null for hasOne relationship ([@jembezmamy](https://github.com/jembezmamy))
* `@orbit/jsonapi`
  * [#712](https://github.com/orbitjs/orbit/pull/712) [BUGFIX] Always allow serialization of null attributes ([@makepanic](https://github.com/makepanic))

#### Committers: 2
- Christian ([@makepanic](https://github.com/makepanic))
- Paweł Bator ([@jembezmamy](https://github.com/jembezmamy))

## v0.16.3 (2019-09-22)

#### :bug: Bug Fix

- `@orbit/memory`, `@orbit/record-cache`
  - [#702](https://github.com/orbitjs/orbit/pull/702) Always ignore undefined values when filtering ([@dgeb](https://github.com/dgeb))
- `@orbit/record-cache`
  - [#701](https://github.com/orbitjs/orbit/pull/701) fix: added null case to relatedRecord filter processing ([@Michiel87](https://github.com/Michiel87))

#### :house: Internal

- `@orbit/coordinator`
  - [#697](https://github.com/orbitjs/orbit/pull/697) Bump mixin-deep from 1.3.1 to 1.3.2 in /packages/@orbit/coordinator ([@dependabot[bot]](https://github.com/apps/dependabot))
- `@orbit/utils`
  - [#698](https://github.com/orbitjs/orbit/pull/698) Bump mixin-deep from 1.3.1 to 1.3.2 in /packages/@orbit/utils ([@dependabot[bot]](https://github.com/apps/dependabot))
- `@orbit/coordinator`, `@orbit/core`, `@orbit/data`, `@orbit/identity-map`, `@orbit/immutable`, `@orbit/indexeddb-bucket`, `@orbit/indexeddb`, `@orbit/integration-tests`, `@orbit/jsonapi`, `@orbit/local-storage-bucket`, `@orbit/local-storage`, `@orbit/memory`, `@orbit/record-cache`, `@orbit/serializers`, `@orbit/store`, `@orbit/utils`
  - [#693](https://github.com/orbitjs/orbit/pull/693) Update dependencies ([@tchak](https://github.com/tchak))
- Other
  - [#691](https://github.com/orbitjs/orbit/pull/691) Use yarn workspaces ([@tchak](https://github.com/tchak))

#### Committers: 3

- Dan Gebhardt ([@dgeb](https://github.com/dgeb))
- Michiel de Vos ([@Michiel87](https://github.com/Michiel87))
- Paul Chavard ([@tchak](https://github.com/tchak))

## v0.16.2 (2019-09-05)

#### :bug: Bug Fix

- `@orbit/coordinator`
  - [#687](https://github.com/orbitjs/orbit/pull/687) Ensure that RequestStrategy handler functions receive all args ([@dgeb](https://github.com/dgeb))

#### Committers: 1

- Dan Gebhardt ([@dgeb](https://github.com/dgeb))

## v0.16.1 (2019-08-20)

#### :rocket: Enhancement

- `@orbit/jsonapi`
  - [#683](https://github.com/orbitjs/orbit/pull/683) fix(jsonapi): don't deserialize null attributes ([@makepanic](https://github.com/makepanic))

#### :bug: Bug Fix

- `@orbit/core`
  - [#686](https://github.com/orbitjs/orbit/pull/686) Add guards to check that `TaskQueue`s have at least one processor ([@cibernox](https://github.com/cibernox))
- `@orbit/coordinator`, `@orbit/core`, `@orbit/data`, `@orbit/identity-map`, `@orbit/immutable`, `@orbit/indexeddb-bucket`, `@orbit/indexeddb`, `@orbit/integration-tests`, `@orbit/jsonapi`, `@orbit/local-storage-bucket`, `@orbit/local-storage`, `@orbit/memory`, `@orbit/record-cache`, `@orbit/serializers`, `@orbit/store`, `@orbit/utils`
  - [#684](https://github.com/orbitjs/orbit/pull/684) Target ES-latest by default + Fix ES5 builds ([@dgeb](https://github.com/dgeb))

#### :memo: Documentation

- `@orbit/store`
  - [#681](https://github.com/orbitjs/orbit/pull/681) fix: fix typo in deprecation message ([@makepanic](https://github.com/makepanic))

#### Committers: 3

- Christian ([@makepanic](https://github.com/makepanic))
- Dan Gebhardt ([@dgeb](https://github.com/dgeb))
- Miguel Camba ([@cibernox](https://github.com/cibernox))

## v0.16.0 (2019-07-30)

No changes.

## v0.16.0-beta.11 (2019-07-18)

#### :boom: Breaking Change

- `@orbit/data`, `@orbit/indexeddb`, `@orbit/jsonapi`, `@orbit/local-storage`, `@orbit/memory`
  - [#678](https://github.com/orbitjs/orbit/pull/678) [BREAKING] Shift some responsibilities for transform-related interfaces to source implementations ([@dgeb](https://github.com/dgeb))

#### :rocket: Enhancement

- `@orbit/coordinator`, `@orbit/data`, `@orbit/indexeddb`, `@orbit/jsonapi`, `@orbit/local-storage`, `@orbit/memory`
  - [#680](https://github.com/orbitjs/orbit/pull/680) [DEPRECATION] Deprecate `_transformed` in favor of `transformed` ([@dgeb](https://github.com/dgeb))

#### :house: Internal

- `@orbit/jsonapi`, `@orbit/memory`
  - [#679](https://github.com/orbitjs/orbit/pull/679) Standardize update responses ([@dgeb](https://github.com/dgeb))
- `@orbit/data`
  - [#677](https://github.com/orbitjs/orbit/pull/677) Convert source interface implementations to use async/await ([@dgeb](https://github.com/dgeb))

#### Committers: 2

- Dan Gebhardt ([@dgeb](https://github.com/dgeb))
- Paul Chavard ([@tchak](https://github.com/tchak))

## v0.16.0-beta.10 (2019-07-10)

#### :rocket: Enhancement

- `@orbit/memory`
  - [#676](https://github.com/orbitjs/orbit/pull/676) [memory] Support hints for `update` ([@dgeb](https://github.com/dgeb))
- `@orbit/indexeddb`, `@orbit/memory`
  - [#675](https://github.com/orbitjs/orbit/pull/675) Add more deprecations ([@tchak](https://github.com/tchak))

#### :bug: Bug Fix

- `@orbit/data`
  - [#674](https://github.com/orbitjs/orbit/pull/674) Remove queues processing from deactivate ([@tchak](https://github.com/tchak))

#### Committers: 2

- Dan Gebhardt ([@dgeb](https://github.com/dgeb))
- Paul Chavard ([@tchak](https://github.com/tchak))

## v0.16.0-beta.9 (2019-07-09)

#### :rocket: Enhancement

- `@orbit/core`
  - [#673](https://github.com/orbitjs/orbit/pull/673) Ensure that cancelled tasks in queues have promises rejected ([@dgeb](https://github.com/dgeb))
- `@orbit/jsonapi`
  - [#668](https://github.com/orbitjs/orbit/pull/668) Expose meta and links from processors to source ([@tchak](https://github.com/tchak))
  - [#667](https://github.com/orbitjs/orbit/pull/667) Add Updatable interface to jsonapi source ([@tchak](https://github.com/tchak))
- `@orbit/coordinator`, `@orbit/data`, `@orbit/integration-tests`
  - [#671](https://github.com/orbitjs/orbit/pull/671) Introduce explicit source activation + deactivation ([@tchak](https://github.com/tchak))
- `@orbit/data`, `@orbit/jsonapi`, `@orbit/record-cache`
  - [#669](https://github.com/orbitjs/orbit/pull/669) Add filter|sort|page support to findRelatedRecords queries ([@tchak](https://github.com/tchak))
- `@orbit/data`
  - [#662](https://github.com/orbitjs/orbit/pull/662) Warn if naive singularize method receives a word that doesn't end in "s" ([@lukemelia](https://github.com/lukemelia))

#### :bug: Bug Fix

- `@orbit/core`
  - [#673](https://github.com/orbitjs/orbit/pull/673) Ensure that cancelled tasks in queues have promises rejected ([@dgeb](https://github.com/dgeb))
- `@orbit/coordinator`, `@orbit/data`, `@orbit/integration-tests`
  - [#671](https://github.com/orbitjs/orbit/pull/671) Introduce explicit source activation + deactivation ([@tchak](https://github.com/tchak))

#### :house: Internal

- `@orbit/coordinator`, `@orbit/core`, `@orbit/data`, `@orbit/identity-map`, `@orbit/indexeddb-bucket`, `@orbit/indexeddb`, `@orbit/integration-tests`, `@orbit/jsonapi`, `@orbit/local-storage-bucket`, `@orbit/local-storage`, `@orbit/memory`, `@orbit/record-cache`, `@orbit/store`
  - [#672](https://github.com/orbitjs/orbit/pull/672) Clean up yarn.lock interdependencies ([@dgeb](https://github.com/dgeb))
- `@orbit/data`, `@orbit/jsonapi`, `@orbit/record-cache`, `@orbit/utils`
  - [#670](https://github.com/orbitjs/orbit/pull/670) Use native isArray ([@tchak](https://github.com/tchak))
- `@orbit/indexeddb`, `@orbit/local-storage`, `@orbit/memory`, `@orbit/record-cache`
  - [#666](https://github.com/orbitjs/orbit/pull/666) Refactor @orbit/record-cache with a stricter TS config ([@tchak](https://github.com/tchak))
- `@orbit/coordinator`, `@orbit/core`, `@orbit/data`, `@orbit/identity-map`, `@orbit/immutable`, `@orbit/indexeddb-bucket`, `@orbit/indexeddb`, `@orbit/integration-tests`, `@orbit/jsonapi`, `@orbit/local-storage-bucket`, `@orbit/local-storage`, `@orbit/memory`, `@orbit/record-cache`, `@orbit/serializers`, `@orbit/store`, `@orbit/utils`
  - [#664](https://github.com/orbitjs/orbit/pull/664) Upgrade npm dependencies (mostly prettier) ([@tchak](https://github.com/tchak))

#### Committers: 3

- Dan Gebhardt ([@dgeb](https://github.com/dgeb))
- Luke Melia ([@lukemelia](https://github.com/lukemelia))
- Paul Chavard ([@tchak](https://github.com/tchak))

## v0.16.0-beta.8 (2019-06-09)

#### :rocket: Enhancement

- `@orbit/jsonapi`
  - [#658](https://github.com/orbitjs/orbit/pull/658) Add serializeOperation to @orbit/jsonapi ([@tchak](https://github.com/tchak))
  - [#639](https://github.com/orbitjs/orbit/pull/639) @orbit/jsonapi-serializer operations (deserialize) ([@tchak](https://github.com/tchak))
- `@orbit/data`
  - [#642](https://github.com/orbitjs/orbit/pull/642) Add {get|each}Attribute and {get|each}Relationship methods ([@tchak](https://github.com/tchak))

#### :bug: Bug Fix

- `@orbit/data`
  - [#659](https://github.com/orbitjs/orbit/pull/659) Throw when invalid filter expression. ([@lukemelia](https://github.com/lukemelia))
- `@orbit/integration-tests`, `@orbit/jsonapi`
  - [#654](https://github.com/orbitjs/orbit/pull/654) Fix generation of empty responses on tests ([@cibernox](https://github.com/cibernox))
- `@orbit/jsonapi`
  - [#648](https://github.com/orbitjs/orbit/pull/648) When serializing, exclude attributes & relationships not in the schema ([@lukemelia](https://github.com/lukemelia))

#### :house: Internal

- `@orbit/indexeddb-bucket`, `@orbit/indexeddb`, `@orbit/integration-tests`, `@orbit/jsonapi`, `@orbit/local-storage-bucket`, `@orbit/local-storage`, `@orbit/memory`, `@orbit/serializers`, `@orbit/store`
  - [#657](https://github.com/orbitjs/orbit/pull/657) And the last packages with prettier ([@tchak](https://github.com/tchak))
- `@orbit/data`, `@orbit/record-cache`, `@orbit/utils`
  - [#656](https://github.com/orbitjs/orbit/pull/656) Apply prettier to even more packages ([@tchak](https://github.com/tchak))
- `@orbit/coordinator`, `@orbit/identity-map`, `@orbit/immutable`
  - [#655](https://github.com/orbitjs/orbit/pull/655) Add prettier to more packages ([@tchak](https://github.com/tchak))
- `@orbit/core`
  - [#649](https://github.com/orbitjs/orbit/pull/649) Prettier ([@tchak](https://github.com/tchak))

#### Committers: 3

- Luke Melia ([@lukemelia](https://github.com/lukemelia))
- Miguel Camba ([@cibernox](https://github.com/cibernox))
- Paul Chavard ([@tchak](https://github.com/tchak))

## v0.16.0-beta.7 (2019-05-24)

#### :boom: Breaking Change

- `@orbit/coordinator`, `@orbit/core`, `@orbit/data`, `@orbit/identity-map`, `@orbit/immutable`, `@orbit/indexeddb-bucket`, `@orbit/indexeddb`, `@orbit/jsonapi`, `@orbit/local-storage-bucket`, `@orbit/local-storage`, `@orbit/memory`, `@orbit/record-cache`, `@orbit/serializers`, `@orbit/store`, `@orbit/utils`
  - [#647](https://github.com/orbitjs/orbit/pull/647) Revert "Update language level of module target to es2017" ([@dgeb](https://github.com/dgeb))

#### Committers: 1

- Dan Gebhardt ([@dgeb](https://github.com/dgeb))

## v0.16.0-beta.6 (2019-05-23)

#### :boom: Breaking Change

- `@orbit/coordinator`, `@orbit/core`, `@orbit/data`, `@orbit/identity-map`, `@orbit/immutable`, `@orbit/indexeddb-bucket`, `@orbit/indexeddb`, `@orbit/jsonapi`, `@orbit/local-storage-bucket`, `@orbit/local-storage`, `@orbit/memory`, `@orbit/record-cache`, `@orbit/serializers`, `@orbit/store`, `@orbit/utils`
  - [#644](https://github.com/orbitjs/orbit/pull/644) Update language level of module target to es2017 ([@dgeb](https://github.com/dgeb))
- `@orbit/integration-tests`, `@orbit/memory`, `@orbit/store`
  - [#634](https://github.com/orbitjs/orbit/pull/634) Rename @orbit/store to @orbit/memory ([@tchak](https://github.com/tchak))

#### :rocket: Enhancement

- `@orbit/integration-tests`, `@orbit/jsonapi`
  - [#630](https://github.com/orbitjs/orbit/pull/630) Introduce JSONAPIRequestProcessor ([@lukemelia](https://github.com/lukemelia))
- `@orbit/identity-map`
  - [#636](https://github.com/orbitjs/orbit/pull/636) Implement @orbit/identity-map ([@tchak](https://github.com/tchak))
- `@orbit/data`, `@orbit/record-cache`
  - [#627](https://github.com/orbitjs/orbit/pull/627) Polymorphic Relationships ([@ggayowsky](https://github.com/ggayowsky))

#### :bug: Bug Fix

- `@orbit/memory`, `@orbit/record-cache`
  - [#637](https://github.com/orbitjs/orbit/pull/637) Dependent record deletion not updating ([@ggayowsky](https://github.com/ggayowsky))

#### :memo: Documentation

- `@orbit/data`
  - [#633](https://github.com/orbitjs/orbit/pull/633) replaceRelatedRecord should accept null ([@tchak](https://github.com/tchak))
- `@orbit/core`
  - [#629](https://github.com/orbitjs/orbit/pull/629) Fixed typo in comment ([@lukemelia](https://github.com/lukemelia))

#### :house: Internal

- `@orbit/coordinator`, `@orbit/core`, `@orbit/data`, `@orbit/identity-map`, `@orbit/immutable`, `@orbit/indexeddb-bucket`, `@orbit/indexeddb`, `@orbit/integration-tests`, `@orbit/jsonapi`, `@orbit/local-storage-bucket`, `@orbit/local-storage`, `@orbit/memory`, `@orbit/record-cache`, `@orbit/serializers`, `@orbit/store`, `@orbit/utils`
  - [#645](https://github.com/orbitjs/orbit/pull/645) Update lerna and build scripts ([@dgeb](https://github.com/dgeb))
  - [#643](https://github.com/orbitjs/orbit/pull/643) git clean prior to publishing packages ([@dgeb](https://github.com/dgeb))
- `@orbit/coordinator`, `@orbit/core`, `@orbit/data`, `@orbit/immutable`, `@orbit/indexeddb-bucket`, `@orbit/indexeddb`, `@orbit/integration-tests`, `@orbit/jsonapi`, `@orbit/local-storage-bucket`, `@orbit/local-storage`, `@orbit/record-cache`, `@orbit/serializers`, `@orbit/store`, `@orbit/utils`
  - [#632](https://github.com/orbitjs/orbit/pull/632) Remove unnecessary dependencies from builds ([@dgeb](https://github.com/dgeb))
  - [#631](https://github.com/orbitjs/orbit/pull/631) Switch to yarn ([@dgeb](https://github.com/dgeb))

#### Committers: 4

- Dan Gebhardt ([@dgeb](https://github.com/dgeb))
- Gerald Gayowsky ([@ggayowsky](https://github.com/ggayowsky))
- Luke Melia ([@lukemelia](https://github.com/lukemelia))
- Paul Chavard ([@tchak](https://github.com/tchak))

## v0.16.0-beta.5 (2019-04-16)

#### :bug: Bug Fix

- `@orbit/record-cache`
  - [#625](https://github.com/orbitjs/orbit/pull/625) Fix updating an empty record with an empty relationship ([@simonihmig](https://github.com/simonihmig))

#### Committers: 1

- Simon Ihmig ([@simonihmig](https://github.com/simonihmig))

## v0.16.0-beta.4 (2019-04-15)

#### :rocket: Enhancement

- `@orbit/jsonapi`
  - [#621](https://github.com/orbitjs/orbit/pull/621) Extract appendQueryParams in its own method ([@tchak](https://github.com/tchak))

#### :bug: Bug Fix

- `@orbit/record-cache`, `@orbit/store`
  - [#620](https://github.com/orbitjs/orbit/pull/620) Fix update record not populating inverse relationships ([@ggayowsky](https://github.com/ggayowsky))

#### :house: Internal

- `@orbit/indexeddb`
  - [#623](https://github.com/orbitjs/orbit/pull/623) Rationalize indexes ([@tchak](https://github.com/tchak))

#### Committers: 2

- Gerald Gayowsky ([@ggayowsky](https://github.com/ggayowsky))
- Paul Chavard ([@tchak](https://github.com/tchak))

## v0.16.0-beta.3 (2019-03-17)

#### :bug: Bug Fix

- `@orbit/indexeddb`, `@orbit/local-storage`, `@orbit/record-cache`
  - [#608](https://github.com/orbitjs/orbit/pull/608) RemoveRecord when part of has many relationship should not clobber the whole relationship in IndexedDB source ([@tchak](https://github.com/tchak))
- `@orbit/indexeddb`, `@orbit/local-storage`
  - [#606](https://github.com/orbitjs/orbit/pull/606) Do not reset persisting sources on initalize ([@tchak](https://github.com/tchak))

#### :house: Internal

- `@orbit/indexeddb`, `@orbit/local-storage`
  - [#610](https://github.com/orbitjs/orbit/pull/610) Add tests to verify local storage + indexeddb sources are not reset on initialization ([@dgeb](https://github.com/dgeb))
- `@orbit/integration-tests`
  - [#609](https://github.com/orbitjs/orbit/pull/609) Add integration-tests package ([@dgeb](https://github.com/dgeb))

#### Committers: 2

- Dan Gebhardt ([@dgeb](https://github.com/dgeb))
- Paul Chavard ([@tchak](https://github.com/tchak))

## v0.16.0-beta.2 (2019-03-14)

#### :rocket: Enhancement

- `@orbit/store`
  - [#596](https://github.com/orbitjs/orbit/pull/596) Add Store.rebase() ([@Bernhard---H](https://github.com/Bernhard---H))

#### :bug: Bug Fix

- `@orbit/record-cache`

  - [#603](https://github.com/orbitjs/orbit/pull/603) Return empty array when querying for non-existing relationships with findRelatedRecords ([@PieterJanVdb](https://github.com/PieterJanVdb))

- `@orbit/record-cache`
  - [#605](https://github.com/orbitjs/orbit/pull/605) Extends #603 to fix related errors ([@dgeb](https://github.com/dgeb))

#### :house: Internal

- `@orbit/store`
  - [#604](https://github.com/orbitjs/orbit/pull/604) Cleanup and extend store tests ([@dgeb](https://github.com/dgeb))

#### Committers: 3

- Bernhard Halbartschlager ([@Bernhard---H](https://github.com/Bernhard---H))
- Pieter-Jan Vandenbussche ([@PieterJanVdb](https://github.com/PieterJanVdb))
- Dan Gebhardt ([@dgeb](https://github.com/dgeb))

## v0.16.0-beta.1 (2019-02-10)

#### :boom: Breaking Change

- `@orbit/data`, `@orbit/indexeddb`, `@orbit/jsonapi`, `@orbit/local-storage`, `@orbit/record-cache`, `@orbit/store`
  - [#574](https://github.com/orbitjs/orbit/pull/574) Deprecate replaceRecord op in favor of updateRecord ([@dgeb](https://github.com/dgeb))
- `@orbit/coordinator`, `@orbit/core`, `@orbit/data`, `@orbit/indexeddb-bucket`, `@orbit/indexeddb`, `@orbit/jsonapi`, `@orbit/local-storage-bucket`, `@orbit/local-storage`, `@orbit/record-cache`, `@orbit/store`, `@orbit/utils`
  - [#573](https://github.com/orbitjs/orbit/pull/573) [BREAKING] Expose assert + deprecate only on OrbitGlobal ([@dgeb](https://github.com/dgeb))
- `@orbit/coordinator`, `@orbit/core`, `@orbit/data`, `@orbit/record-cache`, `@orbit/store`
  - [#567](https://github.com/orbitjs/orbit/pull/567) Define Listener interface and remove support for explicit binding object in listeners ([@dgeb](https://github.com/dgeb))

#### :rocket: Enhancement

- `@orbit/data`, `@orbit/jsonapi`
  - [#591](https://github.com/orbitjs/orbit/pull/591) [jsonapi] Use new serializers for serializing / deserializing attribute values ([@dgeb](https://github.com/dgeb))
  - [#587](https://github.com/orbitjs/orbit/pull/587) Expand areas in which meta data is allowed ([@dgeb](https://github.com/dgeb))
  - [#586](https://github.com/orbitjs/orbit/pull/586) Define Link interface and links objects (refactor of #509) ([@dgeb](https://github.com/dgeb))
- `@orbit/jsonapi`, `@orbit/serializers`
  - [#590](https://github.com/orbitjs/orbit/pull/590) JSONAPISerializer implements new Serializer interface ([@dgeb](https://github.com/dgeb))
- `@orbit/serializers`
  - [#589](https://github.com/orbitjs/orbit/pull/589) Introduce @orbit/serializers ([@dgeb](https://github.com/dgeb))
- `@orbit/store`
  - [#585](https://github.com/orbitjs/orbit/pull/585) [store] Support query hints ([@dgeb](https://github.com/dgeb))
- `@orbit/data`, `@orbit/indexeddb`, `@orbit/local-storage`, `@orbit/record-cache`, `@orbit/store`
  - [#584](https://github.com/orbitjs/orbit/pull/584) Support finding records by an array of identities ([@dgeb](https://github.com/dgeb))
  - [#555](https://github.com/orbitjs/orbit/pull/555) Extract new @orbit/record-cache package ([@dgeb](https://github.com/dgeb))
- `@orbit/coordinator`, `@orbit/data`
  - [#581](https://github.com/orbitjs/orbit/pull/581) Introduce "hints" for requests ([@dgeb](https://github.com/dgeb))
- `@orbit/jsonapi`
  - [#572](https://github.com/orbitjs/orbit/pull/572) [jsonapi] allowedContentTypes can be customized ([@dgeb](https://github.com/dgeb))
  - [#571](https://github.com/orbitjs/orbit/pull/571) [jsonapi] Consider application/json to be valid content ([@dgeb](https://github.com/dgeb))
- `@orbit/immutable`
  - [#550](https://github.com/orbitjs/orbit/pull/550) Expand capabilities of ImmutableMap ([@dgeb](https://github.com/dgeb))

#### :bug: Bug Fix

- `@orbit/core`, `@orbit/local-storage`, `@orbit/store`
  - [#592](https://github.com/orbitjs/orbit/pull/592) Fix some minor typing issues ([@dgeb](https://github.com/dgeb))
- `@orbit/jsonapi`
  - [#588](https://github.com/orbitjs/orbit/pull/588) Always treat a 204 response as having no content ([@simonihmig](https://github.com/simonihmig))
  - [#562](https://github.com/orbitjs/orbit/pull/562) Let ResourceIdentity be null, Closes [#561](https://github.com/orbitjs/orbit/issues/561) ([@lolmaus](https://github.com/lolmaus))
- `@orbit/data`
  - [#578](https://github.com/orbitjs/orbit/pull/578) Coalesce addToRelatedRecords + removeRecord ([@jembezmamy](https://github.com/jembezmamy))
  - [#568](https://github.com/orbitjs/orbit/pull/568) Fix typings for QueryBuilderFunc and TransformBuilderFunc ([@dgeb](https://github.com/dgeb))
  - [#563](https://github.com/orbitjs/orbit/pull/563) Closes [#472](https://github.com/orbitjs/orbit/issues/472) ([@Raiondesu](https://github.com/Raiondesu))
- `@orbit/coordinator`, `@orbit/core`, `@orbit/data`, `@orbit/immutable`, `@orbit/indexeddb-bucket`, `@orbit/indexeddb`, `@orbit/jsonapi`, `@orbit/local-storage-bucket`, `@orbit/local-storage`, `@orbit/record-cache`, `@orbit/store`, `@orbit/utils`
  - [#566](https://github.com/orbitjs/orbit/pull/566) Fix typings ([@dgeb](https://github.com/dgeb))

#### :memo: Documentation

- [#593](https://github.com/orbitjs/orbit/pull/593) Clarify Orbit’s purpose and primary use cases ([@dgeb](https://github.com/dgeb))

#### :house: Internal

- `@orbit/data`, `@orbit/store`
  - [#582](https://github.com/orbitjs/orbit/pull/582) Remove unused exception classes + other minor cleanup ([@dgeb](https://github.com/dgeb))
- `@orbit/coordinator`, `@orbit/core`, `@orbit/data`, `@orbit/immutable`, `@orbit/indexeddb-bucket`, `@orbit/indexeddb`, `@orbit/jsonapi`, `@orbit/local-storage-bucket`, `@orbit/local-storage`, `@orbit/record-cache`, `@orbit/store`, `@orbit/utils`
  - [#579](https://github.com/orbitjs/orbit/pull/579) Use prepare npm task instead of deprecated prepublish ([@dgeb](https://github.com/dgeb))
  - [#570](https://github.com/orbitjs/orbit/pull/570) Fix security alerts ([@dgeb](https://github.com/dgeb))
  - [#569](https://github.com/orbitjs/orbit/pull/569) Further typing improvements + test refactor ([@dgeb](https://github.com/dgeb))
- Other
  - [#576](https://github.com/orbitjs/orbit/pull/576) Bump build dependencies ([@dgeb](https://github.com/dgeb))

#### Committers: 5

- Alexey ([@Raiondesu](https://github.com/Raiondesu))
- Andrey Mikhaylov (lolmaus) ([@lolmaus](https://github.com/lolmaus))
- Dan Gebhardt ([@dgeb](https://github.com/dgeb))
- Paweł Bator ([@jembezmamy](https://github.com/jembezmamy))
- Simon Ihmig ([@simonihmig](https://github.com/simonihmig))
