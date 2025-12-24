# Testing Guide - Website & Admin Panel

## 1. Check Git Status

### See what files have changed:
```bash
git status
```

### See the actual code changes:
```bash
# See all modified files
git diff

# See specific file changes
git diff api/src/index.ts
```

### Check if changes are staged:
```bash
git status --short
```

### If you want to commit the CORS changes:
```bash
git add api/src/index.ts
git commit -m "feat: update CORS to support production and development origins"
```

**Note:** The `.env.production` files are typically in `.gitignore` and won't be committed (this is intentional for security).

---

## 2. Test the Application Locally

### Step 1: Start the Development Servers

Open **two terminal windows**:

**Terminal 1 - Start API (Backend):**
```bash
cd api
npm run dev
```
This will start the API on `http://localhost:6060`

**Terminal 2 - Start Web (Frontend):**
```bash
cd web
npm run dev
```
This will start the website on `http://localhost:4000`

### Step 2: Test the Website

1. Open your browser and go to: `http://localhost:4000`
2. You should see the Tender Touch Pediatrics website
3. Test features:
   - View homepage
   - Fill out appointment booking form
   - Check contact information displays correctly

### Step 3: Test the Admin Panel

1. Go to: `http://localhost:4000/admin/login`
2. Login with admin credentials (check your `api/.env` for `ADMIN_DEFAULT_EMAIL` and `ADMIN_DEFAULT_PASSWORD`)
3. After login, you'll be redirected to: `http://localhost:4000/admin`
4. Test admin features:
   - **Availability Tab**: Manage time slots and availability
   - **Bookings Tab**: View and manage appointments
   - Logout functionality

### Step 4: Verify CORS is Working

The CORS changes should work automatically:
- **Development**: Uses `CORS_ORIGINS=http://localhost:4000` from `api/.env`
- **Production**: Will use `CORS_ORIGINS=https://tendertouchpeds.com` from `api/.env.production`

To test CORS:
1. Open browser DevTools (F12)
2. Go to Network tab
3. Make a booking or admin action
4. Check API requests - they should succeed without CORS errors

---

## 3. Verify Code Changes

### Files Modified:
- ✅ `api/src/index.ts` - CORS configuration updated

### Files Created (not in git - by design):
- `web/.env.production` - Production frontend env vars
- `api/.env.production` - Production backend env vars

### To see what branch you're on:
```bash
git branch
```

### To see recent commits:
```bash
git log --oneline -10
```

---

## 4. Troubleshooting

### If API won't start:
- Check if port 6060 is already in use
- Verify `api/.env` file exists with required variables
- Check `npm install` was run in `api/` folder

### If Web won't start:
- Check if port 4000 is already in use
- Verify `web/.env.local` file exists
- Check `npm install` was run in `web/` folder

### If CORS errors appear:
- Verify `api/.env` has `CORS_ORIGINS=http://localhost:4000`
- Check browser console for specific CORS error messages
- Ensure API is running on port 6060

### If admin login fails:
- Check `api/.env` has correct `ADMIN_DEFAULT_EMAIL` and `ADMIN_DEFAULT_PASSWORD`
- Verify database is set up and seeded (run `npm run prisma:seed` in `api/` folder)

---

## 5. Quick Test Checklist

- [ ] API starts on http://localhost:6060
- [ ] Website loads on http://localhost:4000
- [ ] Homepage displays correctly
- [ ] Appointment form works
- [ ] Admin login page loads at /admin/login
- [ ] Admin can login successfully
- [ ] Admin dashboard loads at /admin
- [ ] Availability tab works
- [ ] Bookings tab works
- [ ] No CORS errors in browser console
- [ ] API requests succeed

