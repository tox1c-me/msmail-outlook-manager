@echo off
setlocal
cd /d "%~dp0"
start "" "http://localhost:3000"
set DATABASE_URL=file:./dev.db
set APP_API_KEY=ua8uG581ZaiHqWNolwapOKNRrQXNnFZ6B0LLRFNKPpI
set MS_TOKEN_ENDPOINT=https://login.microsoftonline.com/common/oauth2/v2.0/token
set MS_GRAPH_SCOPE=offline_access Mail.Read
set MS_IMAP_SCOPE=https://outlook.office.com/IMAP.AccessAsUser.All offline_access
set MS_IMAP_HOST=outlook.office365.com
set MS_IMAP_PORT=993
node .output/server/index.mjs
