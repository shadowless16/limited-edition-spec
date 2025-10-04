# Owner Tag System Flow

## Overview
Owner Tags are unique identifiers in format `FNL-M-LNL-F2-L2` (e.g., `AMG-7-30`) that provide public verification without exposing PII.

## Flow Diagram

```
User Registration → Owner Tag Generation → Database Storage → Public Verification
       ↓                    ↓                    ↓                    ↓
   Signup API         generateOwnerTag()    User.ownerTag      /verify endpoint
```

## Detailed Flow

### 1. User Registration
**Endpoint:** `POST /api/auth/signup`
```json
{
  "firstName": "Abayomi",
  "lastName": "Giwa", 
  "email": "user@example.com",
  "password": "password123",
  "phone": "07075167930"
}
```

**Process:**
- Extract consonants from names: `Abayomi` → `BM`, `Giwa` → `GW`
- Use first name length as middle: `7`
- Extract phone digits: `07075167930` → first 2: `07`, last 2: `30`
- Generate tag: `BMG-7-07-30`

### 2. Database Storage
- Owner tag stored in `User.ownerTag` field
- Unique constraint prevents duplicates
- Included in JWT token for authenticated requests

### 3. Order Processing
**When order is created:**
- Owner tag included in COA generation
- Displayed on receipts and certificates
- No other PII exposed publicly

### 4. Public Verification
**Endpoint:** `GET /api/verify?tag=BMG-7-07-30`

**Response:**
```json
{
  "ownerTag": "BMG-7-07-30",
  "ownerName": "Abayomi Giwa",
  "registeredDate": "2024-01-15T10:30:00Z",
  "verified": true
}
```

## Test Process

### Manual Testing
1. **Registration Test:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/signup \
     -H "Content-Type: application/json" \
     -d '{"firstName":"Abayomi","lastName":"Giwa","email":"test@example.com","password":"password123","phone":"07075167930"}'
   ```

2. **Verification Test:**
   ```bash
   curl "http://localhost:3000/api/verify?tag=BMG-7-07-30"
   ```

3. **UI Test:**
   - Visit `/verify` page
   - Enter owner tag: `BMG-7-07-30`
   - Verify authentication display

### Automated Testing
```bash
npm test -- owner-tag.test.js
```

## Security Features
- No PII in public verification
- Unique constraint prevents duplicates
- Format validation prevents injection
- Atomic generation during registration

## Error Handling
- Invalid format: `400 Bad Request`
- Tag not found: `404 Not Found`
- Missing tag: `400 Bad Request`
- Server error: `500 Internal Server Error`

## Integration Points
- **User Registration:** Auto-generates during signup
- **Authentication:** Included in JWT tokens
- **Orders:** Added to COA/receipts
- **Verification:** Public lookup endpoint
- **UI:** Verify page with search interface