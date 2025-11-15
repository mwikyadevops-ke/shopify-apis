# Fix Git PATH Issue
# This script helps fix Git not being recognized in PowerShell

Write-Host "`n🔍 Checking Git installation...`n" -ForegroundColor Cyan

# Common Git installation paths
$gitPaths = @(
    'C:\Program Files\Git\bin\git.exe',
    'C:\Program Files (x86)\Git\bin\git.exe',
    'C:\Program Files\Git\cmd\git.exe',
    'C:\Program Files (x86)\Git\cmd\git.exe'
)

$gitFound = $null
foreach ($path in $gitPaths) {
    if (Test-Path $path) {
        $gitFound = $path
        Write-Host "✅ Found Git at: $path" -ForegroundColor Green
        break
    }
}

if (-not $gitFound) {
    Write-Host "❌ Git not found in common locations" -ForegroundColor Red
    Write-Host "`nPlease check if Git is installed correctly" -ForegroundColor Yellow
    Write-Host "Download from: https://git-scm.com/download/win`n" -ForegroundColor Cyan
    exit 1
}

# Get the directory containing git.exe
$gitDir = Split-Path $gitFound -Parent

# Check if it's in PATH
$currentPath = $env:Path
if ($currentPath -notlike "*$gitDir*") {
    Write-Host "`n⚠️  Git directory not in PATH" -ForegroundColor Yellow
    Write-Host "Adding to PATH for this session...`n" -ForegroundColor Cyan
    
    # Add to PATH for current session
    $env:Path += ";$gitDir"
    
    Write-Host "✅ Git added to PATH (temporary - for this session only)" -ForegroundColor Green
    Write-Host "`nTesting Git..." -ForegroundColor Cyan
    $version = & "$gitFound" --version
    Write-Host "✅ $version`n" -ForegroundColor Green
    
    Write-Host "📝 To make this permanent:" -ForegroundColor Yellow
    Write-Host "1. Open System Properties → Environment Variables" -ForegroundColor White
    Write-Host "2. Edit 'Path' variable" -ForegroundColor White
    Write-Host "3. Add: $gitDir" -ForegroundColor White
    Write-Host "4. Restart PowerShell`n" -ForegroundColor White
    
    Write-Host "💡 Or restart PowerShell - it should work after restart`n" -ForegroundColor Cyan
} else {
    Write-Host "✅ Git is already in PATH" -ForegroundColor Green
    Write-Host "Testing Git..." -ForegroundColor Cyan
    try {
        $version = git --version
        Write-Host "✅ $version`n" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Git in PATH but not working. Try restarting PowerShell`n" -ForegroundColor Yellow
    }
}

Write-Host "✨ Done!`n" -ForegroundColor Green

