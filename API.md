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
| GET | `/db/:dbname/_all/entries` | Get all entries | Returns an array of documents |
| GET | `/db/:dbname/:uuid` | Get an entry by UUID |
| GET | `/db/:dbname/:uuid/:attachment` | Get an attachment |
| PUT | `/db/:dbname/:uuid/:attachment` | Save an attachment |
| GET | `/db/:dbname/_view/:view` | Query a custom view | Returns an array of documents |
| PUT | `/db/:dbname/:uuid` | Update an entry by UUID |
| POST | `/db/:dbname` | Insert / Update an entry | Based on _id or $id of the entry |
| DELETE | `/db/:dbname/:uuid` | Delete an an entry by uuid |
| GET | `/db/:dbname/_user` | Get user preferences | Returns logged user's preferences entry |
| POST | `/db/:dbname/_user` | Update user preferences | Creates a merge of current preferences with sent preferences |
