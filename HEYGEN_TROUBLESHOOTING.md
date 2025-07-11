# HeyGen API Troubleshooting Guide

## Current Issue: API Key Unauthorized

Both the old and new API keys are returning "Unauthorized" errors for both v1 and v2 APIs.

## Possible Causes & Solutions

### 1. **Account Subscription Issue**
- **Check:** Go to https://app.heygen.com/settings/billing
- **Issue:** API access might require a paid subscription
- **Solution:** Upgrade to a plan that includes API access

### 2. **API Key Permissions**
- **Check:** Go to https://app.heygen.com/settings/api
- **Issue:** API key might not have the right permissions
- **Solution:** Generate a new key with full permissions

### 3. **Account Verification**
- **Check:** Account might need email verification
- **Solution:** Verify your email address

### 4. **Rate Limiting**
- **Issue:** Too many requests
- **Solution:** Wait a few minutes and try again

## Alternative Solutions

### Option 1: Use HeyGen Web Interface
If API continues to fail, we can:
1. Generate videos manually through the web interface
2. Download them locally
3. Upload to R2 using our existing pipeline

### Option 2: Test R2 Upload Independently
We can test the R2 upload functionality with sample videos:

```bash
# Test R2 upload with a sample video
node scripts/test_r2_upload.js
```

### Option 3: Use Different AI Video Service
Consider alternatives like:
- RunwayML
- Synthesia
- D-ID
- Descript

## Next Steps

1. **Check HeyGen account status and subscription**
2. **Try generating a new API key with different permissions**
3. **Test R2 upload functionality independently**
4. **Consider manual video generation as backup**

## Current Pipeline Status

✅ **R2 Configuration** - Ready
✅ **Pipeline Framework** - Ready  
✅ **Voice & Avatar IDs** - Ready
❌ **HeyGen API Access** - Blocked

The pipeline is 95% complete - we just need to resolve the HeyGen API access issue. 