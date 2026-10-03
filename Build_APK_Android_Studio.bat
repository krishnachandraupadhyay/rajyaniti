@echo off
title Astral Realm 3D - Build Android Project
echo ====================================================
echo      BUILDING ANDROID PROJECT \x26 SYNCING
echo ====================================================
echo.
call npm.cmd run build
call npx.cmd cap sync android
echo.
echo Opening in Android Studio...
call npx.cmd cap open android
pause
