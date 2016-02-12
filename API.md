# HTTP API

## Login / Logout

| Method | Route | Action | Description |
| ------ | ----- | ------ | ----------- |
| GET | `/auth/login` | login home | Shows login options or redirects the user if he is already authenticated.<br>Optional parameter for redirect: `continue` |
| GET | `/auth/login/:method` | login | Creates a session.<br>Method can be `couch`, `github`, `google`, ... |
| GET | `/auth/logout` | logout |
| GET | `/auth/session` | get info on current session |

## Database

| Method | Route | Action | Description |
| ------ | ----- | ------ | ----------- |
| POST | `/db/:dbname/entry` | Insert / Update an entry | Based on _id or $id of the entry |
| GET | `/db/:dbname/entry/_all` | Get all entries | Returns an array of documents |
| GET | `/db/:dbname/entry/:uuid` | Get an entry by UUID |
| PUT | `/db/:dbname/entry/:uuid` | Update an entry by UUID |
| DELETE | `/db/:dbname/entry/:uuid` | Delete an an entry by UUID |
| GET | `/db/:dbname/entry/:uuid/_owner` | Get a list of owners |
| PUT | `/db/:dbname/entry/:uuid/_owner/:owner` | Add an owner |
| DELETE | `/db/:dbname/entry/:uuid/_owner/:owner` | Remove an owner |
| GET | `/db/:dbname/entry/:uuid/:attachment+` | Get an attachment |
| PUT | `/db/:dbname/entry/:uuid/:attachment+` | Save an attachment |
| GET | `/db/:dbname/user/_me` | Get user preferences | Returns logged user's preferences entry |
| POST | `/db/:dbname/user/_me` | Update user preferences | Creates a merge of current preferences with sent preferences |
| GET | `/db/:dbname/_view/:view` | Query a custom view | Returns an array of documents |
| POST | `/db/:dbname/_query/byKindAndId/:kind` | Search by kind and id | key, startkey and endkey can be set in the body of the request |
| POST | `/db/:dbname/_query/byOwnerAndId/:email` | Search by kind and owner | key, startkey and endkey can be set in the body of the request |
