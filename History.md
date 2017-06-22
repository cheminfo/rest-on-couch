<a name="5.0.1"></a>
## [5.0.1](https://github.com/cheminfo/rest-on-couch/compare/v5.0.0...v5.0.1) (2017-06-22)



<a name="5.0.0"></a>
# [5.0.0](https://github.com/cheminfo/rest-on-couch/compare/v4.2.2...v5.0.0) (2017-06-22)


* put all custom CouchDB views in another design doc by default ([eb17185](https://github.com/cheminfo/rest-on-couch/commit/eb17185))


### BREAKING CHANGES

* * Custom CouchDB views are now put in a design doc called "customApp". This change should only affect scripts that work directly with CouchDB instead of ROC.
* In the administration UI, the URLs are now using a HashRouter instead of a BrowserRouter to avoid any issue with proxies.



<a name="4.2.2"></a>
## [4.2.2](https://github.com/cheminfo/rest-on-couch/compare/v4.2.1...v4.2.2) (2017-06-12)


### Bug Fixes

* do not wrap key in an array for queryEntriesByRight ([ffe6fd8](https://github.com/cheminfo/rest-on-couch/commit/ffe6fd8))



<a name="4.2.1"></a>
## [4.2.1](https://github.com/cheminfo/rest-on-couch/compare/v4.2.0...v4.2.1) (2017-05-30)


### Bug Fixes

* do not use setInterval for auth renewal ([e56c92c](https://github.com/cheminfo/rest-on-couch/commit/e56c92c))



<a name="4.2.0"></a>
# [4.2.0](https://github.com/cheminfo/rest-on-couch/compare/v4.1.0...v4.2.0) (2017-04-27)


### Bug Fixes

* debugrest typo ([7c8ade4](https://github.com/cheminfo/rest-on-couch/commit/7c8ade4))
* default error message should be an empty string ([e05c760](https://github.com/cheminfo/rest-on-couch/commit/e05c760))


### Features

* add group membership page ([847d57c](https://github.com/cheminfo/rest-on-couch/commit/847d57c))
* api to add and remove groups from defaultGroups ([639a707](https://github.com/cheminfo/rest-on-couch/commit/639a707))
* global right administration ([9214c4c](https://github.com/cheminfo/rest-on-couch/commit/9214c4c)), closes [#47](https://github.com/cheminfo/rest-on-couch/issues/47)
* route to get groups a user is member of ([4ce6fda](https://github.com/cheminfo/rest-on-couch/commit/4ce6fda)), closes [#69](https://github.com/cheminfo/rest-on-couch/issues/69)
* set selected database via query parameter ([7641069](https://github.com/cheminfo/rest-on-couch/commit/7641069)), closes [#48](https://github.com/cheminfo/rest-on-couch/issues/48)



<a name="4.1.0"></a>
# [4.1.0](https://github.com/cheminfo/rest-on-couch/compare/v4.0.2...v4.1.0) (2017-03-29)


### Bug Fixes

* **import:** error in update type constants ([fbece32](https://github.com/cheminfo/rest-on-couch/commit/fbece32))


### Features

* **import:** add new importation method ([0813df0](https://github.com/cheminfo/rest-on-couch/commit/0813df0))



<a name="4.0.2"></a>
## [4.0.2](https://github.com/cheminfo/rest-on-couch/compare/v4.0.1...v4.0.2) (2017-03-09)


### Bug Fixes

* more fixes to database config loader ([b203410](https://github.com/cheminfo/rest-on-couch/commit/b203410))



<a name="4.0.1"></a>
## [4.0.1](https://github.com/cheminfo/rest-on-couch/compare/v4.0.0...v4.0.1) (2017-03-01)


### Bug Fixes

* **init:** make sure to update nano and db instances on open ([54060a0](https://github.com/cheminfo/rest-on-couch/commit/54060a0))
* update react-router and fix webpack configuration ([c416082](https://github.com/cheminfo/rest-on-couch/commit/c416082))



<a name="4.0.0"></a>
# [4.0.0](https://github.com/cheminfo/rest-on-couch/compare/v3.5.0...v4.0.0) (2017-03-01)


* upgrade koa to 2.0.1 ([c1ae71b](https://github.com/cheminfo/rest-on-couch/commit/c1ae71b))


### Bug Fixes

* **import:** fix error in shouldIgnore step ([33b2a1c](https://github.com/cheminfo/rest-on-couch/commit/33b2a1c))
* **import:** fix import ([16e7239](https://github.com/cheminfo/rest-on-couch/commit/16e7239))
* **import:** fix import ([5245848](https://github.com/cheminfo/rest-on-couch/commit/5245848))
* terminate process if config loading generates an error ([1b36055](https://github.com/cheminfo/rest-on-couch/commit/1b36055))


### Code Refactoring

* move connection to CouchDB to a global state ([cdc4c60](https://github.com/cheminfo/rest-on-couch/commit/cdc4c60))


### Features

* **import:** add filedir to config callbacks ([ee4704b](https://github.com/cheminfo/rest-on-couch/commit/ee4704b))
* **import:** add noFileMove option ([26ce803](https://github.com/cheminfo/rest-on-couch/commit/26ce803))
* **import:** add shouldIgnore config callback ([ef25e39](https://github.com/cheminfo/rest-on-couch/commit/ef25e39))
* add entryUnicity option ([34ba61e](https://github.com/cheminfo/rest-on-couch/commit/34ba61e))
* add route to change CouchDB password ([e073e64](https://github.com/cheminfo/rest-on-couch/commit/e073e64))
* add sessionKey and sessionPath to server options ([4655fcd](https://github.com/cheminfo/rest-on-couch/commit/4655fcd))


### BREAKING CHANGES

* Before this change, the config would be silently skipped.
Now an Error is thrown and its stack trace printed.
* From now on, only one CouchDB connection per ROC instance will be supported.
It was possible to specify different CouchDB URLs or credentials in each database config but
this was never used.
* From now on, the project will only be compatible with Node.js >= 7.6.0
because of the use of async functions.



<a name="3.5.0"></a>
# [3.5.0](https://github.com/cheminfo/rest-on-couch/compare/v3.4.1...v3.5.0) (2017-01-30)



<a name="3.4.1"></a>
## [3.4.1](https://github.com/cheminfo/rest-on-couch/compare/v3.4.0...v3.4.1) (2017-01-26)


### Bug Fixes

* **import:** allow noUpload with and without jpath or without field ([7fbd4da](https://github.com/cheminfo/rest-on-couch/commit/7fbd4da))



<a name="3.4.0"></a>
# [3.4.0](https://github.com/cheminfo/rest-on-couch/compare/v3.3.0...v3.4.0) (2017-01-25)


### Bug Fixes

* **login:** return a response when couchDB login fails ([39f8b02](https://github.com/cheminfo/rest-on-couch/commit/39f8b02))


### Features

* **bin:** add rest-on-couch-import global script ([ae1ca45](https://github.com/cheminfo/rest-on-couch/commit/ae1ca45))
* **import:** add dryRun option and enable single file import ([6a28969](https://github.com/cheminfo/rest-on-couch/commit/6a28969))



<a name="3.3.0"></a>
# [3.3.0](https://github.com/cheminfo/rest-on-couch/compare/v3.2.0...v3.3.0) (2017-01-17)


### Features

* add custom title for CouchDB login ([6661378](https://github.com/cheminfo/rest-on-couch/commit/6661378))



<a name="3.2.0"></a>
# [3.2.0](https://github.com/cheminfo/rest-on-couch/compare/v3.1.3...v3.2.0) (2016-12-22)


### Features

* add getUserInfo ([b25c1e9](https://github.com/cheminfo/rest-on-couch/commit/b25c1e9))



<a name="3.1.3"></a>
## [3.1.3](https://github.com/cheminfo/rest-on-couch/compare/v3.1.2...v3.1.3) (2016-12-19)



<a name="3.1.2"></a>
## [3.1.2](https://github.com/cheminfo/rest-on-couch/compare/v3.1.1...v3.1.2) (2016-12-15)


### Bug Fixes

* do not use ES6 in design doc ([f7f3a95](https://github.com/cheminfo/rest-on-couch/commit/f7f3a95))
* **security:** give no default right when a database is created ([191c900](https://github.com/cheminfo/rest-on-couch/commit/191c900))



<a name="3.1.1"></a>
## [3.1.1](https://github.com/cheminfo/rest-on-couch/compare/v3.1.0...v3.1.1) (2016-12-09)


### Bug Fixes

* **client:** only first owner cannot be removed ([c3dd5a6](https://github.com/cheminfo/rest-on-couch/commit/c3dd5a6))



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



