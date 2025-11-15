# Git Repository Setup Script
# Run this script after installing Git

Write-Host "`n🚀 Setting up Git repository...`n" -ForegroundColor Cyan

# Check if Git is installed
try {
    $gitVersion = git --version
    Write-Host "✅ Git is installed: $gitVersion`n" -ForegroundColor Green
} catch {
    Write-Host "❌ Git is not installed!" -ForegroundColor Red
    Write-Host "Please install Git from: https://git-scm.com/download/win`n" -ForegroundColor Yellow
    exit 1
}

# Initialize git repository
if (Test-Path .git) {
    Write-Host "⚠️  Git repository already initialized`n" -ForegroundColor Yellow
} else {
    Write-Host "📦 Initializing git repository..." -ForegroundColor Cyan
    git init
    Write-Host "✅ Repository initialized`n" -ForegroundColor Green
}

# Add remote (remove if exists, then add)
Write-Host "🔗 Setting up remote repository..." -ForegroundColor Cyan
git remote remove origin 2>$null
git remote add origin https://github.com/mwikyadevops-ke/shopify-apis.git
Write-Host "✅ Remote added: https://github.com/mwikyadevops-ke/shopify-apis.git`n" -ForegroundColor Green

# Check if .gitignore exists
if (Test-Path .gitignore) {
    Write-Host "✅ .gitignore found`n" -ForegroundColor Green
} else {
    Write-Host "⚠️  .gitignore not found - creating one..." -ForegroundColor Yellow
    # Create basic .gitignore
    @"
node_modules/
.env
.env.local
.env.production
logs/
*.log
.DS_Store
Thumbs.db
.vscode/
.idea/
"@ | Out-File -FilePath .gitignore -Encoding UTF8
    Write-Host "✅ .gitignore created`n" -ForegroundColor Green
}

# Add all files
Write-Host "📝 Adding files to staging..." -ForegroundColor Cyan
git add .
Write-Host "✅ Files added`n" -ForegroundColor Green

# Show status
Write-Host "📊 Current status:" -ForegroundColor Cyan
git status --short
Write-Host ""

# Check if there are changes to commit
$status = git status --porcelain
if ($status) {
    Write-Host "💾 Ready to commit! Run the following commands:" -ForegroundColor Yellow
    Write-Host "`n   git commit -m `"Initial commit: Shopify App APIs backend`"" -ForegroundColor White
    Write-Host "   git branch -M main" -ForegroundColor White
    Write-Host "   git push -u origin main`n" -ForegroundColor White
    
    Write-Host "⚠️  Note: You may need to authenticate with GitHub" -ForegroundColor Yellow
    Write-Host "   Use a Personal Access Token instead of password" -ForegroundColor Yellow
    Write-Host "   Create token at: https://github.com/settings/tokens`n" -ForegroundColor Cyan
} else {
    Write-Host "✅ All files are already committed`n" -ForegroundColor Green
}

Write-Host "✨ Setup complete!`n" -ForegroundColor Green

