# School Request System - Bug Fixes & Improvements

## Issues Fixed

### 1. **Missing WEB_URL Constant**
**Problem:** The code referenced `WEB_URL` which was not imported or defined, causing the school logo to fail loading.

**Solution:** Updated to use `Config.webBaseUrl` from the centralized config:
```typescript
// Before
source={{ uri: schoolInfo.logo ? `${WEB_URL}/storage/${schoolInfo.logo}` : 'https://via.placeholder.com/150' }}

// After
source={{ 
  uri: schoolInfo.logo 
    ? `${Config.webBaseUrl}/storage/${schoolInfo.logo}` 
    : 'https://via.placeholder.com/150' 
}}
```

### 2. **Incorrect API Endpoints**
**Problem:** Using wrong endpoints for school verification and request submission.

**Solution:** 
- School search: Changed to GET `/schools?code={code}` with query parameter
- Request submission: Corrected to `/teacher-create-request` matching backend route

```typescript
// School Verification (Correct)
await axios.get(`${Config.apiBaseUrl}/schools?code=${schoolCode}`)

// Request Submission (Correct)
await axios.post(`${Config.apiBaseUrl}/teacher-create-request`, {
  school_id: schoolInfo.id,
  teacher_id: teacher.id,
})
```

### 3. **Response Format Handling**
**Problem:** Backend may return different response formats for school search.

**Solution:** Added flexible response parsing:
```typescript
let school = null;

// Handle array response
if (Array.isArray(response.data)) {
  school = response.data[0];
} 
// Handle nested schools array
else if (response.data.schools && Array.isArray(response.data.schools)) {
  school = response.data.schools[0];
}
// Handle school object
else if (response.data.school) {
  school = response.data.school;
}
// Handle direct school object
else if (response.data.id && response.data.code) {
  school = response.data;
}
```

### 4. **Poor Error Handling**
**Problem:** Errors were throwing and not properly caught, causing crashes. Also not handling duplicate requests (409 status).

**Solution:** Improved error handling with proper fallbacks and duplicate request handling:
```typescript
// Added error checks
if (!token) {
  setError("Please login again");
  setIsLoading(false);
  return;
}

if (!teacherStr) {
  setError("Teacher information not found. Please complete your profile setup.");
  setIsSubmitting(false);
  router.push('/setup');
  return;
}

// Handle duplicate requests (409)
if (axios.isAxiosError(error) && error.response?.status === 409) {
  const message = error.response?.data?.message || "You have already sent a request to this school";
  // Show info toast instead of error
  Toast.show({
    type: 'info',
    text1: 'Already Requested',
    text2: message,
  });
}

// Better error messages
const message = axios.isAxiosError(error)
  ? error.response?.data?.message || error.response?.data?.error || "Failed to verify school code"
  : "Network error occurred";
```

### 5. **Missing Platform Support**
**Problem:** Web platform alerts were not working properly.

**Solution:** Added platform-specific alert handling:
```typescript
const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};
```

### 6. **State Management Issues**
**Problem:** Previous school info wasn't cleared when verifying new code.

**Solution:** Clear state before new verification:
```typescript
setSchoolInfo(null); // Clear previous school info
```

### 7. **Inconsistent UI Styling**
**Problem:** Blur effects and colors didn't match the app's modern design.

**Solution:** Updated to use platform-specific blur intensities and proper color schemes:
```typescript
// Background blur
<BlurView 
  intensity={Platform.OS === 'ios' ? 330 : 100} 
  tint={colorScheme === 'dark' ? 'dark' : 'light'} 
/>

// Card blur
<BlurView 
  intensity={Platform.OS === 'ios' ? 12 : 6} 
  tint={colorScheme === 'dark' ? 'dark' : 'light'} 
/>
```

## Improvements Made

### 1. **Better User Feedback**
- Clear error messages for each failure scenario
- Success messages with school name confirmation
- Platform-specific notifications (Toast for mobile, Alert for web)

### 2. **Validation Enhancements**
- Check for teacher profile completion
- Verify authentication token exists
- Validate teacher data structure
- Minimum school code length validation

### 3. **Form State Management**
- Clear form after successful submission
- Reset errors when user types
- Proper loading states for async operations
- Disabled buttons during loading

### 4. **Modern UI Design**
- Platform-optimized blur effects
- Dynamic color schemes (light/dark mode)
- Proper gradient overlays
- Better spacing and visual hierarchy

### 5. **Code Quality**
- Added TypeScript types for alerts
- Better error logging
- Cleaner code structure
- Comprehensive error messages

## API Integration

### School Search Endpoint
```
GET /schools?code={code}

Headers:
- Authorization: Bearer {token}
- Accept: application/json

Response (may vary):
// Option 1: Direct school object
{
  "id": 1,
  "name": "School Name",
  "code": "SCHOOL-CODE",
  "logo": "path/to/logo.png",
  "address": "School Address"
}

// Option 2: Array of schools
[
  {
    "id": 1,
    "name": "School Name",
    "code": "SCHOOL-CODE",
    ...
  }
]

// Option 3: Nested structure
{
  "schools": [...]
}
```

### Teacher Request Endpoint
```
POST /teacher-create-request

Headers:
- Authorization: Bearer {token}
- Accept: application/json
- Content-Type: application/json

Body:
{
  "school_id": 1,
  "teacher_id": 123
}

Response Success (201):
{
  "success": "Teacher school request created successfully.",
  "data": {
    "teacherId": 123,
    "schoolId": 1,
    ...
  }
}

Response Error (409 - Duplicate):
{
  "message": "Request already sent for this school."
}

Response Error (404 - Teacher not found):
{
  "message": "Teacher profile not found or not authorized."
}
```

## Testing Checklist

- [x] School code validation (minimum 4 characters)
- [x] School search with valid code
- [x] School search with invalid code
- [x] Display school information correctly
- [x] School logo loading
- [x] Submit request successfully
- [x] Handle duplicate requests
- [x] Handle network errors
- [x] Handle authentication errors
- [x] Handle missing teacher profile
- [x] Web platform compatibility
- [x] Mobile platform compatibility
- [x] Light/dark mode support
- [x] Form state clearing after submission
- [x] Proper loading indicators
- [x] Error message display

## Known Limitations

1. **School Logo**: Falls back to placeholder if logo URL is invalid
2. **Network Dependency**: Requires stable internet connection
3. **Token Expiry**: User needs to re-login if token expires

## Future Enhancements

- [ ] Add school search by name (in addition to code)
- [ ] Show list of suggested schools
- [ ] Add request status tracking
- [ ] Implement request cancellation
- [ ] Add school details preview before sending request
- [ ] Cache recent school searches
- [ ] Add offline support with queue
- [ ] Implement retry mechanism for failed requests

## Usage Flow

1. User enters school code (minimum 4 characters)
2. Clicks verify/search button
3. System searches for school with that code
4. If found, displays school card with details
5. User reviews school information
6. User clicks "Send Request"
7. System validates teacher profile and authentication
8. Submits request to backend
9. Shows success/error message
10. Redirects to home screen on success

## Error Handling Matrix

| Error Type | User Message | Action |
|------------|-------------|--------|
| Invalid code length | "School code must be at least 4 characters" | Show inline error |
| School not found | "School not found with this code" | Show inline error |
| No auth token | "Please login again" | Show error, require re-login |
| No teacher profile | "Please complete your profile setup" | Redirect to /setup |
| Network error | "Network error occurred" | Show error message |
| Duplicate request | Backend message | Show error message |
| Server error | Backend message or generic error | Show error message |

## Support

For issues or questions about school requests:
- Check network connection
- Verify school code is correct
- Ensure teacher profile is completed
- Contact support: 671820738
