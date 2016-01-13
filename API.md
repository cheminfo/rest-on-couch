# HTTP API

## Login / Logout

| Method | Route | Action | Description |
| ------ | ----- | ------ | ----------- |
| GET | `/auth/login/:method` | login | Creates a session.<br>Method can be `couch`, `github`, `google`, ... |
| GET | `/auth/logout` | logout |
| GET | `/auth/session` | get info on current session |

## Database

| Method | Route | Action | Description |
| ------ | ----- | ------ | ----------- |
| GET | `/db/:dbname/get/all/entries` | Get all entries | Returns an array of documents |
| GET | `/db/:dbname/:id` | Get an entry by UUID |
| GET | `/db/:dbname/:id/:attachment` | Get an attachment |
| GET | `/db/:dbname/_view/:view` | Query a custom view | Returns an array of documents |
| PUT | `/db/:dbname/:id` | Update an entry by UUID |
