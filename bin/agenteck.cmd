@echo off
setlocal

:: Agenteck - Windows launcher script
:: Usage: agenteck [start|stop|restart|status|help]

set "SCRIPT_DIR=%~dp0"
set "PROJECT_DIR=%SCRIPT_DIR%.."

:: Change to project directory
cd /d "%PROJECT_DIR%"

:: Check if dist/cli/cli.js exists
if exist "%PROJECT_DIR%\dist\cli\cli.js" (
    node "%PROJECT_DIR%\dist\cli\cli.js" %*
) else (
    echo Agenteck is not built. Building now...
    call npm run build
    if errorlevel 1 (
        echo Build failed. Please run 'npm install' first.
        exit /b 1
    )
    node "%PROJECT_DIR%\dist\cli\cli.js" %*
)

endlocal
