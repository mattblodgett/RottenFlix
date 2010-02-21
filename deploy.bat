@ECHO OFF

SET SCRIPT_FILE=rottenflix.user.js
SET DEPLOYMENT_DIR=C:\Users\matt.blodgett\AppData\Roaming\Mozilla\Firefox\Profiles\7wz0wb8k.default\gm_scripts\rottenflix

ROBOCOPY . %DEPLOYMENT_DIR% %SCRIPT_FILE%