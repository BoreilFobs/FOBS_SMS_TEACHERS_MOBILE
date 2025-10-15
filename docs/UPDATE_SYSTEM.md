# App Update System

## Overview
The app includes an automatic update checker that ensures users are always running the latest version. When an update is required, a modal dialog blocks all app navigation until the user downloads and installs the update.

## How It Works

### 1. Update Check Endpoint
The app calls the API endpoint on startup:
```
GET https://fobssms.com/api/app/check-update
```

**Expected Response:**
```json
{
  "success": true,
  "update_available": false,
  "version": "1.0.1",
  "message": "No updates available at this time.",
  "download_url": null,
  "checked_at": "2025-10-15 07:57:16"
}
```

### 2. When Update is Required
When `update_available: true`, the response should include:
```json
{
  "success": true,
  "update_available": true,
  "version": "1.0.2",
  "message": "A new version is available with bug fixes and improvements.",
  "download_url": "https://fobssms.com/downloads/app-v1.0.2.apk",
  "checked_at": "2025-10-15 08:00:00"
}
```

### 3. Modal Behavior
- **Non-dismissible**: Users cannot close the modal or navigate elsewhere
- **Blocks navigation**: All app screens are blocked until update is installed
- **Download button**: Opens the download URL in the device's browser
- **Version comparison**: Shows current version vs. new version
- **Animated entrance**: Smooth fade and scale animation

## Implementation Details

### Files Modified
1. **`components/UpdateModal.tsx`** - The update modal component
2. **`app/_layout.tsx`** - Integrated modal at root level
3. **`constants/Config.ts`** - Added app version to config

### How to Test

#### Test Update Available
To test the update flow, modify your API response to return:
```json
{
  "success": true,
  "update_available": true,
  "version": "2.0.0",
  "message": "A major update is available!",
  "download_url": "https://example.com/app.apk",
  "checked_at": "2025-10-15 08:00:00"
}
```

#### Test No Update
For normal operation:
```json
{
  "success": true,
  "update_available": false,
  "version": "1.0.1",
  "message": "You're up to date!",
  "download_url": null,
  "checked_at": "2025-10-15 08:00:00"
}
```

## Backend Implementation Guide

### Sample PHP Endpoint
```php
<?php
// api/app/check-update.php

header('Content-Type: application/json');

// Current production version
$current_version = '1.0.1';

// Get the minimum required version from database or config
$minimum_required_version = '1.0.1';

// Check if update is available
$update_available = version_compare($current_version, $minimum_required_version, '<');

$response = [
    'success' => true,
    'update_available' => $update_available,
    'version' => $current_version,
    'message' => $update_available 
        ? 'A new version is available. Please update to continue.' 
        : 'No updates available at this time.',
    'download_url' => $update_available 
        ? 'https://fobssms.com/downloads/FobsSMS-Teacher-v' . $current_version . '.apk'
        : null,
    'checked_at' => date('Y-m-d H:i:s')
];

echo json_encode($response);
```

### Database Schema (Optional)
```sql
CREATE TABLE app_versions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    version VARCHAR(20) NOT NULL,
    minimum_version VARCHAR(20) NOT NULL,
    download_url VARCHAR(255) NOT NULL,
    release_notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Version Management

### Current App Version
The app version is defined in `app.json`:
```json
{
  "expo": {
    "version": "1.0.1"
  }
}
```

### Updating App Version
1. Update version in `app.json`
2. Build new APK/AAB with EAS Build
3. Upload to your server
4. Update backend API to reflect new version
5. Users will be prompted to update on next app launch

## Features
✅ Automatic update checking on app startup  
✅ Non-dismissible modal when update required  
✅ Blocks all navigation until updated  
✅ Beautiful UI with blur effects and animations  
✅ Version comparison display  
✅ Direct download link  
✅ Error handling for network issues  
✅ Dark mode support  

## Error Handling
If the update check fails (network error, API down, etc.):
- The modal will not show
- Users can continue using the app
- Error is logged to console
- This prevents the app from being blocked due to API issues

## Security Considerations
1. Use HTTPS for the download URL
2. Implement APK signature verification
3. Consider using Google Play Store updates for production
4. Add checksums/hashes to verify download integrity

## Future Enhancements
- [ ] Optional updates (non-blocking)
- [ ] Update release notes display
- [ ] Progress indicator during download
- [ ] Auto-install after download (requires additional permissions)
- [ ] Update schedule (check every X hours)
- [ ] Silent background checks
