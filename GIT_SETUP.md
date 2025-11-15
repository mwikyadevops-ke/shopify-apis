# Git Repository Setup Guide

## Repository URL
https://github.com/mwikyadevops-ke/shopify-apis.git

## Prerequisites

1. **Install Git** (if not already installed):
   - Download from: https://git-scm.com/download/win
   - Or use: `winget install Git.Git` (if winget is available)

2. **Verify Git installation**:
   ```bash
   git --version
   ```

## Setup Instructions

### Option 1: If Git is NOT installed

1. **Install Git**:
   - Download: https://git-scm.com/download/win
   - Run the installer with default settings
   - Restart your terminal/PowerShell after installation

2. **Configure Git** (first time only):
   ```bash
   git config --global user.name "Your Name"
   git config --global user.email "your.email@example.com"
   ```

3. **Then follow Option 2 below**

### Option 2: If Git IS installed (or after installing)

#### Step 1: Initialize Git Repository (if not already initialized)

```bash
# Navigate to your project directory
cd D:\projects\shopifya-app-apis

# Initialize git repository
git init

# Add remote repository
git remote add origin https://github.com/mwikyadevops-ke/shopify-apis.git
```

#### Step 2: Add All Files

```bash
# Add all files to staging
git add .

# Check what will be committed
git status
```

#### Step 3: Create Initial Commit

```bash
# Create first commit
git commit -m "Initial commit: Shopify App APIs backend"
```

#### Step 4: Push to GitHub

```bash
# Push to main branch (or master if that's your default)
git branch -M main
git push -u origin main
```

**Note**: You may be prompted for GitHub credentials:
- **Username**: Your GitHub username
- **Password**: Use a Personal Access Token (not your GitHub password)
  - Create one at: https://github.com/settings/tokens
  - Select scope: `repo`

## Alternative: Using GitHub CLI (gh)

If you have GitHub CLI installed:

```bash
# Authenticate
gh auth login

# Initialize and push
git init
git add .
git commit -m "Initial commit: Shopify App APIs backend"
git branch -M main
git push -u origin main
```

## Files That Will Be Ignored

The following files/folders are in `.gitignore` and won't be pushed:
- `node_modules/`
- `.env` (your environment variables - keep this private!)
- `logs/`
- IDE files (`.vscode/`, `.idea/`)
- OS files (`.DS_Store`, `Thumbs.db`)

## Important Notes

⚠️ **Never commit `.env` file** - it contains sensitive information (passwords, API keys)

✅ **Safe to commit**:
- Source code (`src/`)
- Configuration files (`package.json`, `.gitignore`)
- Documentation (`.md` files)
- Database setup scripts

## Troubleshooting

### "Repository not found" error
- Check the repository URL is correct
- Verify you have access to the repository
- Make sure the repository exists on GitHub

### "Authentication failed" error
- Use Personal Access Token instead of password
- Create token at: https://github.com/settings/tokens
- Select `repo` scope

### "Branch 'main' does not exist" error
- Try: `git push -u origin master` instead
- Or create branch: `git checkout -b main`

## Quick Commands Reference

```bash
# Check status
git status

# Add files
git add .

# Commit changes
git commit -m "Your commit message"

# Push to GitHub
git push origin main

# Pull latest changes
git pull origin main

# Check remote
git remote -v
```

