@echo off
title Astral Realm 3D - Launching Game...
echo ====================================================
echo      ASTRAL REALM 3D - ANDROID PLAYABLE PROTOTYPE
echo ====================================================
echo.
echo Starting local game server...
start "" "http://localhost:5173/"
npx.cmd vite --host --port 5173
pause
