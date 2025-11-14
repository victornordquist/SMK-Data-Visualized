# Deployment Guide

This document explains how to deploy the SMK Data Visualized application to one.com hosting using GitHub Actions.

## Overview

The application uses GitHub Actions to automatically deploy the static website to one.com via FTP whenever changes are pushed to the main branch.

## Setup Instructions

### 1. Get Your one.com FTP Credentials

You'll need the following information from your one.com hosting account:

1. **FTP Server**: Usually in the format `ftp.yourdomain.com` or `ftp.one.com`
2. **FTP Username**: Your one.com FTP username
3. **FTP Password**: Your one.com FTP password
4. **Server Directory**: The directory path where your website files should be uploaded (e.g., `/public_html`, `/htdocs`, or just `/`)

To find these credentials:
- Log in to your one.com control panel
- Navigate to the "Web hosting" or "FTP" section
- Look for FTP access credentials

### 2. Configure GitHub Secrets

Add your FTP credentials as secrets in your GitHub repository:

1. Go to your GitHub repository
2. Click on **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add the following secrets:

| Secret Name | Description | Example |
|------------|-------------|---------|
| `FTP_SERVER` | Your FTP server address | `ftp.yourdomain.com` |
| `FTP_USERNAME` | Your FTP username | `your-username` |
| `FTP_PASSWORD` | Your FTP password | `your-password` |
| `FTP_SERVER_DIR` | Target directory on server | `/public_html/` or `/` |

**Important**: Make sure to include the trailing slash in `FTP_SERVER_DIR` if it's a directory path.

### 3. Verify Branch Name

The workflow is configured to deploy when changes are pushed to the `main` branch. If your main branch has a different name (e.g., `master`), update `.github/workflows/deploy.yml`:

```yaml
on:
  push:
    branches:
      - main  # Change this to your branch name
```

### 4. Test the Deployment

#### Automatic Deployment
Push any change to the main branch, and the deployment will trigger automatically.

#### Manual Deployment
You can also trigger a deployment manually:
1. Go to your GitHub repository
2. Click on **Actions** tab
3. Select **Deploy to one.com** workflow
4. Click **Run workflow** → **Run workflow**

### 5. Monitor Deployment

To check the deployment status:
1. Go to the **Actions** tab in your GitHub repository
2. Click on the latest workflow run
3. View the logs to see the deployment progress

## What Gets Deployed

The workflow deploys all files in your repository except:
- `.git/` directory and git-related files
- `node_modules/` (if present)
- `.DS_Store` files
- `README.md` and `CLAUDE.md`
- `.github/` directory

The following files are deployed:
- `index.html`
- `style.css`
- Any other assets in the repository

## Troubleshooting

### Deployment Fails with "Connection Error"
- Verify your FTP credentials are correct in GitHub Secrets
- Check that your FTP server address is correct
- Ensure your one.com hosting account is active

### Files Not Appearing on Website
- Verify the `FTP_SERVER_DIR` path is correct
- Check if one.com requires files to be in a specific directory (e.g., `/public_html`)
- Try connecting manually with an FTP client to verify the correct path

### Permission Errors
- Ensure your FTP user has write permissions to the target directory
- Contact one.com support if you're unsure about permissions

## Alternative: SFTP Deployment

If one.com provides SFTP access (more secure than FTP), you can modify the workflow to use SFTP instead. Update `.github/workflows/deploy.yml` to use an SFTP action like `wlixcc/SFTP-Deploy-Action`.

## Security Notes

- Never commit FTP credentials directly to your repository
- Always use GitHub Secrets for sensitive information
- Consider using SSH keys instead of passwords if one.com supports SFTP

## Support

For issues with:
- **GitHub Actions**: Check the Actions tab logs in your repository
- **one.com hosting**: Contact one.com support
- **This workflow**: Review the workflow file at `.github/workflows/deploy.yml`
