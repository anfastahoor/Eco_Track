@echo off
title EcoTrack MERN Stack Launcher
echo ========================================================
echo   Starting EcoTrack - ESG Analytics Dashboard (MERN)
echo ========================================================
echo.

echo [1/2] Starting Express.js Backend Server on Port 5000...
start "EcoTrack Backend (Port 5000)" cmd /k "cd /d ""%~dp0server"" && node index.js"

echo [2/2] Starting React Frontend Client on Port 5173...
start "EcoTrack Frontend (Port 5173)" cmd /k "cd /d ""%~dp0client"" && npm run dev"

echo.
echo ========================================================
echo   Backend URL:  http://localhost:5000/api/health
echo   Frontend URL: http://localhost:5173
echo ========================================================
echo.
