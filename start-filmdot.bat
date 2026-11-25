@echo off
title FilmDot — Filmmaker's AI Toolkit
cd /d "%~dp0"
echo ========================================================
echo               Starting FilmDot Web App...
echo ========================================================
echo.
echo Opening browser at http://localhost:5173
start "" "http://localhost:5173"
echo Running development server...
cmd /c npm run dev
pause
