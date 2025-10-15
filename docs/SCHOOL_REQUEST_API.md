# School Request API - Final Implementation

## ✅ Correct API Endpoints

Based on your Laravel backend routes and controller:

### 1. School Search
**Endpoint:** `GET /schools?code={schoolCode}`
- **Method:** GET
- **Query Parameter:** `code` (the school code to search for)
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Accept: application/json`

**Response Handling:**
The app now handles multiple possible response formats:
- Direct school object: `{ id, name, code, logo, address }`
- Array of schools: `[{ id, name, ... }]`
- Nested: `{ schools: [...] }` or `{ school: {...} }`

### 2. Create Teacher Request
**Endpoint:** `POST /teacher-create-request`
- **Method:** POST
- **Headers:**
  - `Authorization: Bearer {token}`
  - `Accept: application/json`
  - `Content-Type: application/json`
- **Body:**
```json
{
  "school_id": 1,
  "teacher_id": 123
}
```

**Response Codes:**
- **201 Created:** Request successfully created
```json
{
  "success": "Teacher school request created successfully.",
  "data": {
    "teacherId": 123,
    "schoolId": 1,
    ...
  }
}
```

- **409 Conflict:** Request already exists
```json
{
  "message": "Request already sent for this school."
}
```

- **404 Not Found:** Teacher not found
```json
{
  "message": "Teacher profile not found or not authorized."
}
```

- **422 Validation Error:** Invalid data
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "school_id": ["The school id field is required."],
    "teacher_id": ["The teacher id field is required."]
  }
}
```

## Implementation Details

### School Search Function
```typescript
const handleVerifyCode = async () => {
  // Validate code length
  if (schoolCode.length < 4) {
    setError("School code must be at least 4 characters");
    return;
  }

  setIsLoading(true);
  setError(null);
  setSchoolInfo(null);
  
  try {
    const token = await AsyncStorage.getItem('auth_token');
    if (!token) {
      setError("Please login again");
      return;
    }

    // GET request with query parameter
    const response = await axios.get(
      `${Config.apiBaseUrl}/schools?code=${schoolCode}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        }
      }
    );

    // Flexible response parsing
    let school = null;
    if (Array.isArray(response.data)) {
      school = response.data[0];
    } else if (response.data.schools) {
      school = response.data.schools[0];
    } else if (response.data.school) {
      school = response.data.school;
    } else if (response.data.id) {
      school = response.data;
    }

    if (school) {
      setSchoolInfo(school);
      // Show success toast
    } else {
      setError("School not found with this code");
    }
  } catch (error) {
    // Handle errors
  } finally {
    setIsLoading(false);
  }
};
```

### Request Submission Function
```typescript
const handleSubmitRequest = async () => {
  if (!schoolInfo) return;

  setIsSubmitting(true);
  try {
    const token = await AsyncStorage.getItem('auth_token');
    const teacher = JSON.parse(await AsyncStorage.getItem('teacher'));
    
    // Validation checks
    if (!token || !teacher?.id) {
      // Handle error
      return;
    }

    // POST to correct endpoint
    const response = await axios.post(
      `${Config.apiBaseUrl}/teacher-create-request`,
      {
        school_id: schoolInfo.id,
        teacher_id: teacher.id,
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );

    // Check status 201 or success field
    if (response.status === 201 || response.data.success) {
      // Show success and redirect
      Toast.show({
        type: 'success',
        text1: 'Request Sent',
        text2: `Request to ${schoolInfo.name} submitted`,
      });
      
      setTimeout(() => router.push('/'), 1000);
    }
  } catch (error) {
    // Handle 409 duplicate
    if (axios.isAxiosError(error) && error.response?.status === 409) {
      Toast.show({
        type: 'info',
        text1: 'Already Requested',
        text2: error.response.data.message,
      });
    }
  } finally {
    setIsSubmitting(false);
  }
};
```

## Database Structure (TeacherSchool Model)

Based on your controller:
```php
TeacherSchool::create([
    'teacherId' => $validated['teacher_id'],
    'schoolId' => $validated['school_id'],
    // 'status' => 'pending', // Optional
]);
```

**Table Fields:**
- `teacherId` - Foreign key to teachers table
- `schoolId` - Foreign key to schools table  
- `status` - Optional (defaults to pending)

**Validation:**
- `school_id` must exist in schools table
- `teacher_id` must exist in teachers table
- Duplicate check: same teacher + school combination

## Testing Scenarios

### ✅ Successful Flow
1. Enter valid school code (4+ characters)
2. Click search → School found and displayed
3. Click "Send Request" → Request created (201)
4. Success message shown
5. Redirected to home screen

### ✅ Duplicate Request
1. Send request to a school
2. Try to send request to same school again
3. Receive 409 error with message
4. Info toast shown (not error)

### ✅ Invalid School Code
1. Enter non-existent code
2. Click search
3. "School not found" error shown

### ✅ Missing Teacher Profile
1. Try to send request without completed profile
2. Redirected to /setup screen

### ✅ Network Error
1. No internet connection
2. Click search or send request
3. "Network error occurred" shown

## Error Messages

| Scenario | Message |
|----------|---------|
| Code too short | "School code must be at least 4 characters" |
| School not found | "School not found with this code" |
| No auth token | "Please login again" |
| No teacher profile | "Teacher information not found. Please complete your profile setup." |
| Duplicate request | "Request already sent for this school." |
| Network error | "Network error occurred" |
| Server error | Backend error message or generic message |

## Console Logging

For debugging, the app logs:
- Search response data
- Submission request payload
- Submission response
- Error details (status, data, URL, method)

## UI States

1. **Initial State**
   - Empty input field
   - Verify button disabled if code < 4 chars
   - No school card visible

2. **Loading State**
   - Spinner in verify button
   - Input disabled
   - Button disabled

3. **School Found State**
   - School card displayed
   - School logo, name, address, code shown
   - "Send Request" button enabled

4. **Submitting State**
   - Spinner in submit button
   - Button disabled

5. **Success State**
   - Toast/Alert shown
   - Form cleared
   - Redirect to home

6. **Error State**
   - Error message shown below input
   - Red alert icon
   - Form remains filled

## Production Checklist

- [x] Correct API endpoint used
- [x] Proper error handling
- [x] Duplicate request detection
- [x] Token validation
- [x] Teacher profile validation
- [x] Platform-specific alerts
- [x] Loading states
- [x] Success/error messages
- [x] Form clearing on success
- [x] Redirect after success
- [x] Console logging for debugging
- [x] Responsive design
- [x] Dark mode support

## Notes

- The school search endpoint may need to be created on your backend if it doesn't exist yet
- Currently using `GET /schools?code={code}` which assumes a schools list endpoint with filtering
- Alternative: Create a dedicated `POST /schools/search` endpoint that accepts `{ code: "..." }` in body
- The teacher-create-request endpoint matches your Laravel route exactly
- Duplicate detection is handled by your backend with 409 response
