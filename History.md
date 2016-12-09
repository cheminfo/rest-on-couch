<a name="3.1.0"></a>
# [3.1.0](https://github.com/cheminfo/rest-on-couch/compare/v3.0.1...v3.1.0) (2016-12-09)


### Bug Fixes

* allow any email address and allow a dot in group names ([c7a1ed6](https://github.com/cheminfo/rest-on-couch/commit/c7a1ed6))
* don't throw if default group does not exist ([9e3aa62](https://github.com/cheminfo/rest-on-couch/commit/9e3aa62))


### Features

* add API to manage default groups doc ([321e951](https://github.com/cheminfo/rest-on-couch/commit/321e951))
* **client:** add group owners edition ([2021a36](https://github.com/cheminfo/rest-on-couch/commit/2021a36))
* **core:** move administrators to superAdministrators ([de79db2](https://github.com/cheminfo/rest-on-couch/commit/de79db2))
* **server:** add API to manage global rights doc ([badfc64](https://github.com/cheminfo/rest-on-couch/commit/badfc64))



<a name="3.0.1"></a>
## [3.0.1](https://github.com/cheminfo/rest-on-couch/compare/v3.0.0...v3.0.1) (2016-12-07)


### Bug Fixes

* normalize use of the proxy prefix ([f902010](https://github.com/cheminfo/rest-on-couch/commit/f902010))
* **client:** google auth popup URL ([0ce760a](https://github.com/cheminfo/rest-on-couch/commit/0ce760a))
* **server:** fix wrong routing in the presence of bundle.js ([adce947](https://github.com/cheminfo/rest-on-couch/commit/adce947))



<a name="3.0.0"></a>
# [3.0.0](https://github.com/cheminfo/rest-on-couch/compare/v2.1.2...v3.0.0) (2016-12-07)


### Features

* **import:** allow to disable upload of main file and add more attachments ([a130482](https://github.com/cheminfo/rest-on-couch/commit/a130482))
* **import:** allow to do everything in the same callback (fullProcess) ([0199155](https://github.com/cheminfo/rest-on-couch/commit/0199155))


* remove support for Node.js v4 ([7acbddf](https://github.com/cheminfo/rest-on-couch/commit/7acbddf))


### BREAKING CHANGES

* Support for Node.js v4 has been dropped.



<a name="2.1.2"></a>
## [2.1.2](https://github.com/cheminfo/rest-on-couch/compare/v2.1.1...v2.1.2) (2016-11-28)



<a name="2.1.1"></a>
## [2.1.1](https://github.com/cheminfo/rest-on-couch/compare/v2.1.0...v2.1.1) (2016-11-28)


### Bug Fixes

* **import:** correct wrong condition ([fe0fb54](https://github.com/cheminfo/rest-on-couch/commit/fe0fb54))



<a name="2.1.0"></a>
# [2.1.0](https://github.com/cheminfo/rest-on-couch/compare/v2.0.2...v2.1.0) (2016-11-28)


### Features

* **import:** add sort option and improve walking structure when limit is set ([7f28c26](https://github.com/cheminfo/rest-on-couch/commit/7f28c26))



<a name="2.0.2"></a>
## [2.0.2](https://github.com/cheminfo/rest-on-couch/compare/v2.0.1...v2.0.2) (2016-11-22)



<a name="2.0.1"></a>
## [2.0.1](https://github.com/cheminfo/rest-on-couch/compare/v2.0.0...v2.0.1) (2016-11-22)



<a name="2.0.0"></a>
# [2.0.0](https://github.com/cheminfo/rest-on-couch/compare/v1.2.0...v2.0.0) (2016-11-21)


### Bug Fixes

* **core:** use more common interpreter ([653ac29](https://github.com/cheminfo/rest-on-couch/commit/653ac29))
* add array-includes for v4 compatibility ([29e11ab](https://github.com/cheminfo/rest-on-couch/commit/29e11ab))
* **login:** recover existing session ([d52fd87](https://github.com/cheminfo/rest-on-couch/commit/d52fd87))
* **server:** only serve bundle if it exists ([5460303](https://github.com/cheminfo/rest-on-couch/commit/5460303))


### Code Refactoring

* remove addGroupToEntry ([cee70f8](https://github.com/cheminfo/rest-on-couch/commit/cee70f8))
* remove all methods that accept a $id ([a141dec](https://github.com/cheminfo/rest-on-couch/commit/a141dec))
* remove removeGroupFromEntry ([e156587](https://github.com/cheminfo/rest-on-couch/commit/e156587))


### Features

* **api:** add getDocsAsOwner ([ba6fe67](https://github.com/cheminfo/rest-on-couch/commit/ba6fe67))
* **api:** add owner management routes for groups ([6fa2aa8](https://github.com/cheminfo/rest-on-couch/commit/6fa2aa8))
* **api:** add routes to add and remove users from groups ([9fcd324](https://github.com/cheminfo/rest-on-couch/commit/9fcd324))
* **views:** allow reduce ([1c203d4](https://github.com/cheminfo/rest-on-couch/commit/1c203d4))


### BREAKING CHANGES

* it is now replaced by removeOwnersFromDoc
* it is now replaced by addOwnersToDoc
* All methods ending with "ById" are removed but one.
getEntryById remains but only returns something if the user requesting the document is its original owner ($owners[0])



<a name="1.2.0"></a>
# [1.2.0](https://github.com/cheminfo/rest-on-couch/compare/v1.1.0...v1.2.0) (2016-10-21)


### Bug Fixes

* renew the session on each request ([f812862](https://github.com/cheminfo/rest-on-couch/commit/f812862))


### Features

* add hasRightForEntry (couch api + rest api) ([2b1856a](https://github.com/cheminfo/rest-on-couch/commit/2b1856a))



<a name="1.1.0"></a>
# [1.1.0](https://github.com/cheminfo/rest-on-couch/compare/v1.0.0...v1.1.0) (2016-09-28)


### Features

* **design docs:** query a view of the design doc when it changes ([0110a03](https://github.com/cheminfo/rest-on-couch/commit/0110a03))



<a name="1.0.0"></a>
# [1.0.0](https://github.com/cheminfo/rest-on-couch/compare/v0.2.0...v1.0.0) (2016-09-26)


### Bug Fixes

* automatically create structure in addFileToJpath ([f056e4b](https://github.com/cheminfo/rest-on-couch/commit/f056e4b))
* do not let unicode characters in the filename ([b1438a5](https://github.com/cheminfo/rest-on-couch/commit/b1438a5))
* don't update design doc if custom is absent ([21ac98a](https://github.com/cheminfo/rest-on-couch/commit/21ac98a))
* make queryViewByUser more efficient ([d228f44](https://github.com/cheminfo/rest-on-couch/commit/d228f44)), closes [#30](https://github.com/cheminfo/rest-on-couch/issues/30)
* rename default config file ([d0c4b23](https://github.com/cheminfo/rest-on-couch/commit/d0c4b23))
* **custom views:** add lib to all design docs ([b8284a8](https://github.com/cheminfo/rest-on-couch/commit/b8284a8))
* **custom views:** fix case where no custom views are defined ([97e82bf](https://github.com/cheminfo/rest-on-couch/commit/97e82bf))
* **import:** don't treat hidden files ([3e21473](https://github.com/cheminfo/rest-on-couch/commit/3e21473))
* **login:** use relative url for google login in login page ([f0dd746](https://github.com/cheminfo/rest-on-couch/commit/f0dd746))
* **nanoPromise:** cached hasOwnProperty ([7f3d370](https://github.com/cheminfo/rest-on-couch/commit/7f3d370))
* **nanoPromise:** reduce param for views should be false by default ([c0089a8](https://github.com/cheminfo/rest-on-couch/commit/c0089a8))
* **server:** fix response when token is not found ([1e24810](https://github.com/cheminfo/rest-on-couch/commit/1e24810))
* **tests:** use node v4 compatible syntax ([7714438](https://github.com/cheminfo/rest-on-couch/commit/7714438))
* **tests:** use node v4 compatible syntax ([47830f7](https://github.com/cheminfo/rest-on-couch/commit/47830f7))


### Features

* add cli tool to batch add groups ([9385fe5](https://github.com/cheminfo/rest-on-couch/commit/9385fe5))
* add close method to Couch object, rename _init to open ([589f52e](https://github.com/cheminfo/rest-on-couch/commit/589f52e))
* add support for custom libraries in views ([f9a8c86](https://github.com/cheminfo/rest-on-couch/commit/f9a8c86))
* add token methods ([b0678f2](https://github.com/cheminfo/rest-on-couch/commit/b0678f2))
* **server:** allow the use of tokens to get a document ([c1bf0f1](https://github.com/cheminfo/rest-on-couch/commit/c1bf0f1))
* allow addGroup and removeGroup to receive an array of groups ([f9e7915](https://github.com/cheminfo/rest-on-couch/commit/f9e7915))
* **design docs:** split views in several design documents ([c4f822d](https://github.com/cheminfo/rest-on-couch/commit/c4f822d))
* **query:** add "mine" option ([9b861ee](https://github.com/cheminfo/rest-on-couch/commit/9b861ee))
* **query:** filter query results by groups ([5c69bf0](https://github.com/cheminfo/rest-on-couch/commit/5c69bf0))
* allow to extend content from file import ([f54cba6](https://github.com/cheminfo/rest-on-couch/commit/f54cba6))
* load from source if REST_ON_COUCH_ASYNC_AWAIT variable is set ([a9ffad7](https://github.com/cheminfo/rest-on-couch/commit/a9ffad7))
* **rest-api:** add getGroups to rest api ([0dff073](https://github.com/cheminfo/rest-on-couch/commit/0dff073))
* **server:** add token routes ([cefb2d9](https://github.com/cheminfo/rest-on-couch/commit/cefb2d9))



<a name="0.2.0"></a>
# 0.2.0 (2016-01-05)



