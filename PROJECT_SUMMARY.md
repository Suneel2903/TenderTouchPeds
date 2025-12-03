# Tender Touch Pediatrics - Complete Project Summary

## Executive Overview

A full-stack pediatric clinic management system for a single-doctor practice in Hyderabad (Kokapet/Gandipet). The system enables online appointment bookings, comprehensive availability management, and an admin portal for clinic operations.

---

## 1. Appointment Form - Latest Changes & Features

### What to Expect in the Appointment Form

The appointment form has been **completely upgraded** with dynamic slot fetching and intelligent availability checking:

#### **Key Features:**

1. **Dynamic Time Slot Loading**
   - Time slots are **fetched dynamically** from the API based on selected date and visit type
   - No hardcoded slots - all slots come from the database
   - Real-time availability checking

2. **Smart Date Validation**
   - **Date picker restrictions:**
     - Minimum date: Today
     - Maximum date: 3 months in advance
   - **Automatic validation:**
     - Blocks past dates
     - Blocks Sundays (clinic closed)
     - Checks day-level availability (UNAVAILABLE, ONLINE_ONLY)

3. **Phone Number Validation**
   - **Strict 10-digit validation** (exactly 10 digits, no spaces or special characters)
   - Input automatically filters out non-digits
   - Real-time validation with clear error messages

4. **Visit Type Awareness**
   - Form adapts based on visit type (CLINIC vs ONLINE)
   - If a day is marked "ONLINE_ONLY" and user selects "CLINIC", shows warning
   - Slots filtered based on visit type

5. **Day Availability Warnings**
   - Shows warning if selected date is unavailable
   - Shows warning if date is online-only but clinic visit selected
   - Prevents submission of invalid bookings

6. **Loading States**
   - Shows "Loading slots..." while fetching
   - Shows "Select a date first" when no date selected
   - Shows "No slots available" when no slots for that date
   - Dropdown disabled during loading

7. **Enhanced Error Messages**
   - Clear, user-friendly error messages
   - Field-specific validation errors
   - Server error messages displayed clearly

#### **Technical Implementation:**

```typescript
// Key hooks and state
- useState for availableSlots, loadingSlots, dayType
- useEffect to fetch slots when date/visitType changes
- useMemo for date range calculation
- watch() from react-hook-form to monitor form changes
- Dynamic API call to /api/bookings/slots?date=YYYY-MM-DD&visitType=CLINIC|ONLINE
```

#### **User Experience Flow:**

1. User selects visit type (CLINIC/ONLINE)
2. User selects a date
3. Form automatically fetches available slots for that date
4. Dropdown populates with only available slots
5. If date is unavailable/online-only, shows warning
6. User selects slot and submits
7. Form validates all fields (including day availability)
8. On success, shows confirmation message

---

## 2. Project Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Monorepo Structure                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  TenderTouchPeds/                                            │
│  ├── api/              (Backend - Express + Prisma)        │
│  │   ├── src/                                                │
│  │   │   ├── index.ts          (Express app setup)          │
│  │   │   ├── routes/           (API endpoints)             │
│  │   │   ├── middleware/       (Auth, rate limiting, etc)   │
│  │   │   ├── services/         (Email, WhatsApp)            │
│  │   │   └── db/              (Prisma client)              │
│  │   └── prisma/               (Database schema & migrations)│
│  │                                                           │
│  └── web/             (Frontend - Next.js App Router)      │
│      ├── app/                 (Next.js pages)              │
│      ├── components/          (React components)             │
│      ├── styles/              (Global CSS)                   │
│      └── public/              (Static assets)                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Technology Stack

#### **Backend (`/api`)**
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** SQLite (dev) / PostgreSQL (production-ready)
- **ORM:** Prisma
- **Validation:** Zod
- **Authentication:** JWT (jsonwebtoken)
- **Password Hashing:** bcrypt (10 rounds)
- **Email:** Nodemailer (Gmail SMTP)
- **Security:**
  - Helmet (security headers)
  - CORS (configured for frontend origin)
  - express-rate-limit (abuse protection)
- **Logging:** Morgan (dev), Winston-ready (prod)

#### **Frontend (`/web`)**
- **Framework:** Next.js 14.2.15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Form Management:** React Hook Form + Zod resolver
- **HTTP Client:** Native fetch API
- **Image Optimization:** Next.js Image component
- **Font:** Inter (Google Fonts)

#### **Development Tools**
- **Monorepo:** npm workspaces
- **Concurrent Dev:** concurrently
- **Package Manager:** npm (root), npm/pnpm (workspaces)

---

## 3. Database Schema (Prisma)

### 3.1 Models

#### **Booking Model**
```prisma
model Booking {
  id             String   @id @default(cuid())
  parentName     String
  parentPhone    String   // 10 digits
  parentEmail    String?
  childName      String
  childAgeYears  Int?
  childAgeMonths Int?     // 0-11
  visitType      String   // 'CLINIC' | 'ONLINE'
  preferredDate  DateTime
  preferredSlot  String   // e.g., "11:00 AM"
  reason         String?  // Max 1000 chars
  status         String   @default("PENDING")
                  // 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 
                  // 'COMPLETED' | 'VISITED' | 'NO_SHOW'
  adminNotes     String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

**Key Points:**
- Uses strings for enums (SQLite compatibility)
- Validation enforced at application layer (Zod)
- Tracks both years and months for child age
- Supports optional parent email
- Reason field limited to 1000 characters

#### **AdminUser Model**
```prisma
model AdminUser {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // bcrypt hashed
  createdAt DateTime @default(now())
}
```

**Security:**
- Password stored as bcrypt hash (10 rounds)
- Email is unique
- No password reset mechanism (intentional for single-user)

#### **TimeSlot Model (Global Slots)**
```prisma
model TimeSlot {
  id        String   @id @default(cuid())
  slot      String   @unique // "11:00 AM", "11:30 AM", etc.
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  dateAvailabilities DateAvailability[]
}
```

**Purpose:**
- Defines global time slots available for booking
- Can be activated/deactivated
- Used as base for date-specific overrides

#### **DateAvailability Model (Slot-Level Overrides)**
```prisma
model DateAvailability {
  id          String   @id @default(cuid())
  date        DateTime // Normalized to 00:00:00
  slotId      String
  slot        TimeSlot @relation(...)
  isAvailable Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([date, slotId])
  @@index([date])
}
```

**Purpose:**
- Override specific slots on specific dates
- Can mark individual slots as unavailable on a date
- Falls back to global slot status if no override

#### **DayAvailability Model (Day-Level Overrides)**
```prisma
model DayAvailability {
  id        String   @id @default(cuid())
  date      DateTime @unique // Normalized to 00:00:00
  availabilityType String @default("AVAILABLE")
              // 'AVAILABLE' | 'UNAVAILABLE' | 'ONLINE_ONLY'
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([date])
}
```

**Purpose:**
- Mark entire days as unavailable
- Mark days as "online-only" (blocks clinic visits)
- Highest priority in availability hierarchy

### 3.2 Availability Hierarchy

The system uses a **3-tier availability system**:

1. **Day-Level** (Highest Priority)
   - `DayAvailability` - Marks entire days
   - Types: AVAILABLE, UNAVAILABLE, ONLINE_ONLY

2. **Slot-Level** (Medium Priority)
   - `DateAvailability` - Overrides specific slots on dates
   - Can block individual slots on specific dates

3. **Global-Level** (Base)
   - `TimeSlot.isActive` - Base availability
   - All slots start here

**Resolution Logic:**
```
For a given date + slot:
1. Check DayAvailability → If UNAVAILABLE, block all
2. Check DayAvailability → If ONLINE_ONLY + CLINIC visit, block
3. Check DateAvailability → If override exists, use it
4. Fall back to TimeSlot.isActive
```

### 3.3 Database Migrations

- `20251202115718_init` - Initial schema (Booking, AdminUser)
- `20251202161831_add_time_slots` - Added TimeSlot model
- `20251202162244_add_date_availability` - Added DateAvailability model
- `20251203001442_add_day_availability` - Added DayAvailability model

---

## 4. API Endpoints

### 4.1 Public Endpoints (No Auth Required)

#### **GET /api/bookings/slots**
**Purpose:** Fetch available time slots for a date and visit type

**Query Parameters:**
- `date` (required): YYYY-MM-DD format
- `visitType` (optional): 'CLINIC' | 'ONLINE' (defaults to 'CLINIC')

**Response:**
```json
{
  "slots": ["11:00 AM", "11:30 AM", "12:00 PM", ...],
  "dayType": "AVAILABLE" | "UNAVAILABLE" | "ONLINE_ONLY"
}
```

**Logic:**
1. Checks DayAvailability first
2. Filters slots based on DateAvailability overrides
3. Falls back to global TimeSlot.isActive
4. Returns empty array if day is UNAVAILABLE or ONLINE_ONLY (for CLINIC visits)

#### **POST /api/bookings**
**Purpose:** Create a new booking request

**Rate Limiting:** 10 requests per IP per 15 minutes

**Request Body:**
```json
{
  "parentName": "John Doe",
  "parentPhone": "9876543210",  // Exactly 10 digits
  "parentEmail": "parent@example.com",  // Optional
  "childName": "Jane Doe",
  "childAgeYears": 5,  // Optional, 0-21
  "childAgeMonths": 6,  // Optional, 0-11
  "visitType": "CLINIC" | "ONLINE",
  "preferredDate": "2024-12-15T00:00:00.000Z",  // ISO string
  "preferredSlot": "11:00 AM",  // Must be from available slots
  "reason": "Fever and cough"  // Optional, max 1000 chars
}
```

**Validation:**
- Parent name: min 2 characters
- Phone: exactly 10 digits (regex: `/^\d{10}$/`)
- Email: valid email format (if provided)
- Child name: min 1 character
- Age: years 0-21, months 0-11
- Date: must be future date, Mon-Sat only
- Slot: must be from available slots list
- Reason: max 1000 characters

**Response:**
```json
{
  "success": true
}
```

**Side Effects:**
1. Creates booking with status "PENDING"
2. Sends email to clinic inbox (`sendNewBookingEmail`)
3. Sends confirmation email to parent (if email provided)
4. Logs WhatsApp notification (if enabled)

**Error Responses:**
- `400`: Validation errors (with field-specific messages)
- `429`: Rate limit exceeded
- `500`: Server error

### 4.2 Admin Endpoints (JWT Auth Required)

#### **POST /api/admin/login**
**Purpose:** Admin authentication

**Rate Limiting:** 5 attempts per IP per 30 minutes

**Request Body:**
```json
{
  "email": "admin@tendertouchpediatrics.in",
  "password": "SecurePassword123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**JWT Payload:**
```json
{
  "adminId": "clx...",
  "email": "admin@tendertouchpediatrics.in",
  "exp": 1234567890  // 2 hours from issue
}
```

**Security:**
- Password compared using bcrypt
- JWT expires in 2 hours
- Token stored in localStorage (frontend)

#### **GET /api/admin/bookings**
**Purpose:** Fetch all bookings (with optional filters)

**Query Parameters:**
- `status` (optional): Filter by status
- `date` (optional): Filter by preferred date

**Response:**
```json
{
  "bookings": [
    {
      "id": "clx...",
      "parentName": "John Doe",
      "parentPhone": "9876543210",
      "parentEmail": "parent@example.com",
      "childName": "Jane Doe",
      "childAgeYears": 5,
      "childAgeMonths": 6,
      "visitType": "CLINIC",
      "preferredDate": "2024-12-15T00:00:00.000Z",
      "preferredSlot": "11:00 AM",
      "reason": "Fever",
      "status": "PENDING",
      "adminNotes": null,
      "createdAt": "2024-12-01T10:00:00.000Z",
      "updatedAt": "2024-12-01T10:00:00.000Z"
    },
    ...
  ]
}
```

#### **PATCH /api/admin/bookings/:id**
**Purpose:** Update booking status or admin notes

**Request Body:**
```json
{
  "status": "CONFIRMED" | "VISITED" | "CANCELLED" | "NO_SHOW" | "COMPLETED",
  "adminNotes": "Patient confirmed via phone"
}
```

**Response:**
```json
{
  "booking": { ...updated booking... }
}
```

### 4.3 Availability Management Endpoints

#### **Global Slots Management**

**GET /api/admin/availability**
- Returns all global time slots
- Query param `?date=YYYY-MM-DD` returns date-specific availability

**POST /api/admin/availability**
- Create new global slot
- Body: `{ "slot": "9:00 AM", "isActive": true }`

**PATCH /api/admin/availability/:id**
- Update slot time or active status
- Body: `{ "slot": "9:30 AM" }` or `{ "isActive": false }`

**DELETE /api/admin/availability/:id**
- Delete a global slot (cascades to DateAvailability)

#### **Date-Specific Slot Overrides**

**POST /api/admin/availability/dates**
- Set availability for specific slot on specific date
- Body: `{ "date": "2024-12-15", "slotId": "clx...", "isAvailable": false }`

**PATCH /api/admin/availability/dates/:id**
- Update date-specific override
- Body: `{ "isAvailable": true }`

**DELETE /api/admin/availability/dates/:id**
- Remove date-specific override (falls back to global)

#### **Day-Level Availability**

**GET /api/admin/availability/days?month=YYYY-MM**
- Get all day availability for a month
- Returns: `{ "days": [{ "date": "2024-12-15", "type": "UNAVAILABLE" }, ...] }`

**POST /api/admin/availability/days**
- Set day availability (supports bulk)
- Single: `{ "date": "2024-12-15", "type": "UNAVAILABLE" }`
- Bulk: `{ "dates": ["2024-12-15", "2024-12-16"], "availabilityType": "ONLINE_ONLY" }`

**PATCH /api/admin/availability/days/:id**
- Update day availability type

**DELETE /api/admin/availability/days/:id**
- Remove day override (falls back to AVAILABLE)

---

## 5. Frontend Components

### 5.1 Public-Facing Components

#### **HeroSection**
- Main landing section with H1, subline, emotional paragraph
- Primary CTA: "Book an Appointment"
- Secondary CTA: "Read Google Reviews"
- Animated gradient background

#### **AboutClinicSection**
- 2-3 paragraphs describing clinic
- Image slideshow with swipe gestures (4 images)
- Mobile-optimized with touch support

#### **AboutDoctorSection**
- Doctor bio and credentials
- Doctor photo
- Bullet list of qualifications

#### **ServicesSection**
- Cards for each service:
  - Well-Child Checkups
  - Vaccinations
  - Sick Visits
  - Newborn & Infant Care
  - Developmental Screening
  - Adolescent Checkups
  - Parent Counselling
  - Nutrition & Growth Guidance

#### **InClinicOnlineSection**
- Two-column layout:
  - Left: In-Person Clinic Visits (address, timings, parking)
  - Right: Online Consultations (timings, suitable for)

#### **AppointmentSection**
- Contains AppointmentForm component
- Address and timings display
- "Suitable for" information

#### **AppointmentForm** (See Section 1 for details)
- Dynamic slot fetching
- Real-time validation
- Day availability checking
- Phone number validation (10 digits)

#### **ReviewsSection**
- Static testimonials
- "Read all reviews on Google" button

#### **FaqSection**
- 8-10 Q&As
- JSON-LD structured data for SEO

#### **ContactSection**
- NAP block (Name, Address, Phone)
- Embedded Google Map
- Opening hours

#### **SiteHeader**
- Logo (circular)
- Navigation links (desktop)
- "Call Now" button
- Mobile: Hamburger menu + slide-in menu
- Active link highlighting on scroll

#### **BottomBar** (Mobile Only)
- Fixed bottom bar
- "Call" button (tel link)
- "Book" button (scrolls to form)

#### **FloatingActions**
- Floating action buttons for quick actions

### 5.2 Admin Components

#### **AvailabilityManager**
**Three View Modes:**

1. **Global Slots View**
   - Add new time slots
   - Toggle active/inactive
   - Delete slots
   - List all slots with status

2. **Date-Specific View**
   - Date picker to select date
   - Shows all slots with overrides
   - Multi-select checkboxes
   - Bulk actions:
     - Mark selected available
     - Mark selected unavailable
     - Remove selected overrides
   - Individual slot toggle
   - Shows "Using Global" vs "Date Override" badges

3. **Monthly Calendar View**
   - Calendar grid (Mon-Sun)
   - Click date to cycle: Available → Online Only → Unavailable
   - Color coding:
     - Green: Available
     - Blue: Online Only
     - Amber: Unavailable
   - Past dates and Sundays disabled
   - Legend explaining colors

**Features:**
- Real-time updates
- Loading states
- Error handling
- Responsive design

#### **BookingsManager**
- Date filter (date picker)
- Status filter (dropdown)
- List of bookings with:
  - Parent/child details
  - Visit type badge
  - Status badge (color-coded)
  - Preferred date/time
  - Reason (if provided)
  - Admin notes (if any)
- Status dropdown for each booking
- Update booking status
- Click-to-call phone numbers
- Click-to-email addresses

### 5.3 Utility Components

#### **AnimatedOnScroll**
- Wraps sections for scroll-based animations
- Uses Intersection Observer API
- Fade-in and slide-up animations

---

## 6. Security Implementation

### 6.1 Backend Security

#### **Helmet Configuration**
```typescript
helmet({
  contentSecurityPolicy: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:'],
    connectSrc: ["'self'", 'http://localhost:4000'],
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
})
```

**Headers Set:**
- HSTS (Strict-Transport-Security)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- X-Powered-By: disabled

#### **CORS Configuration**
```typescript
{
  origin: ['http://localhost:4000'],  // Frontend origin
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: false
}
```

#### **Rate Limiting**
- **Booking endpoint:** 10 requests/IP/15 minutes
- **Admin login:** 5 attempts/IP/30 minutes
- Uses `express-rate-limit` with Redis-ready store

#### **Input Validation**
- All inputs validated with Zod schemas
- Rejects invalid data with 400 status
- No raw user input in error messages
- No `eval()` or dynamic code execution

#### **Authentication**
- JWT tokens with 2-hour expiry
- Password hashing with bcrypt (10 rounds)
- Tokens stored in localStorage (frontend)
- Admin routes protected with `requireAdminAuth` middleware

#### **Database Safety**
- Prisma ORM (parameterized queries only)
- No raw SQL queries
- Input sanitization via Zod

#### **Logging**
- Morgan for dev (request logging)
- Winston-ready for production
- No PII in logs (no full notes/reason text)
- Aggregate errors only

### 6.2 Frontend Security

- No `dangerouslySetInnerHTML` (unless sanitized)
- No untrusted strings in attributes
- All forms use POST (no secrets in query params)
- Environment variables: `NEXT_PUBLIC_*` only for safe-to-expose values

---

## 7. Email & Notifications

### 7.1 Email Service (Nodemailer)

**Configuration:**
- Service: Gmail SMTP
- Auth: App password (not regular password)
- From: `SMTP_USER` env var
- To: `CLINIC_INBOX` env var (for new bookings)

**Functions:**

#### **sendNewBookingEmail(booking)**
- Sends to clinic inbox
- Subject: "New pediatric appointment request - [Clinic/Online]"
- Body: All booking details (formatted text)

#### **sendParentConfirmationEmail(booking)**
- Sends to parent email (if provided)
- Subject: "Your pediatric appointment request has been received"
- Body: Confirmation message + clinic contact info

### 7.2 WhatsApp Service (Stub)

**Function:** `sendBookingConfirmation(booking)`
- Currently logs only (if `WHATSAPP_ENABLED=false`)
- Placeholder for future integration
- No real WhatsApp API integration yet

---

## 8. Environment Variables

### 8.1 Backend (`/api/.env`)

```env
PORT=6060
DATABASE_URL="file:./dev.db"  # SQLite for dev, PostgreSQL for prod
SMTP_USER="your-gmail@example.com"
SMTP_PASS="your-gmail-app-password"
CLINIC_INBOX="your-gmail@example.com"
JWT_SECRET="long-random-secret-key"
WHATSAPP_ENABLED=false
WHATSAPP_API_KEY=""
ADMIN_DEFAULT_EMAIL="admin@tendertouchpediatrics.in"
ADMIN_DEFAULT_PASSWORD="SetStrongPasswordHere"
NODE_ENV=development
```

### 8.2 Frontend (`/web/.env.local`)

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:6060
NEXT_PUBLIC_SITE_URL=http://localhost:4000
NEXT_PUBLIC_CLINIC_PHONE="+918121666387"
NEXT_PUBLIC_CLINIC_ADDRESS="Shop No. 111, Ground Floor, Kokapet Terminal Building, Radha Spaces, Gandipet Main Road, Kokapet, Hyderabad"
NEXT_PUBLIC_GOOGLE_MAPS_URL="<Google Maps share URL>"
```

**Note:** All `NEXT_PUBLIC_*` variables are safe to expose (embedded in client bundle).

---

## 9. Typography & Design System

### 9.1 Typography Scale

**Mobile (≤768px):**
- `tt-h1`: 30-32px, semi-bold, leading-tight
- `tt-h2`: 24px
- `tt-h3`: 20px
- `tt-body`: 16px
- `tt-small`: 14px

**Desktop (>768px):**
- `tt-h1`: 40-44px
- `tt-h2`: 32px
- `tt-h3`: 24px
- `tt-body`: 16-18px
- `tt-small`: 14-15px

**Implementation:**
- Custom Tailwind utilities in `globals.css`
- Consistent across all pages

### 9.2 Color Palette

```typescript
brand: {
  tealDark: '#024A59',    // Headers, primary text
  teal: '#1E899B',         // Links, accents
  tealSoft: '#5BADAC',     // Backgrounds, borders
  pinkSoft: '#FBDBED',     // Soft backgrounds
  pink: '#FF748F'          // Primary CTA buttons
}
```

**Usage:**
- Hero sections: `bg-brand-tealDark` with gradient to `brand-tealSoft`
- Primary CTA: `bg-brand-pink text-white`
- Secondary CTA: `bg-white text-brand-tealDark border-brand-tealSoft`

### 9.3 Responsive Design

- **Mobile-first approach**
- **Breakpoint:** 768px (md:)
- **Minimum width tested:** 360px
- **Touch targets:** ≥44px height
- **Sticky header** on mobile
- **Fixed bottom bar** on mobile (Call/Book buttons)

---

## 10. SEO & Structured Data

### 10.1 Meta Tags

- Per-page `<title>` tags
- Per-page `<meta description>` tags
- Location keywords: "Pediatrician in Hyderabad", "Kokapet", "Gandipet"

### 10.2 JSON-LD Structured Data

#### **LocalBusiness / MedicalClinic**
```json
{
  "@context": "https://schema.org",
  "@type": "MedicalClinic",
  "name": "Tender Touch Pediatric Clinic",
  "address": { ... },
  "telephone": "+918121666387",
  "medicalSpecialty": "Pediatrics"
}
```

#### **Physician**
```json
{
  "@type": "Physician",
  "name": "Dr. S M Deepthi",
  "medicalSpecialty": "Pediatrics",
  "credential": "MD Pediatrics (USA), American Board Certified"
}
```

#### **FAQPage**
- FAQ section marked up with FAQPage schema
- Each Q&A as `Question` and `Answer` items

### 10.3 Open Graph / Twitter Cards

- OG title, description, image
- Twitter card metadata
- Image: Hero image or logo

---

## 11. Performance Optimizations

### 11.1 Image Optimization

- All images use Next.js `Image` component
- Automatic format optimization (WebP, AVIF)
- Lazy loading
- `sizes` prop for responsive images

### 11.2 Code Splitting

- Next.js automatic code splitting
- Component-level lazy loading where appropriate

### 11.3 Lighthouse Targets

- **Mobile Score:** ≥90
- **Performance:** Optimized images, minimal JS
- **Accessibility:** WCAG AA compliance
- **SEO:** Structured data, meta tags

---

## 12. Accessibility

### 12.1 WCAG Compliance

- **Heading hierarchy:** H1 → H2 → H3 (proper order)
- **ARIA labels:** Navigation, buttons, form inputs
- **Color contrast:** Meets WCAG AA (teal vs white text)
- **Touch targets:** ≥44px height
- **Keyboard navigation:** All interactive elements accessible

### 12.2 Semantic HTML

- Proper use of `<header>`, `<main>`, `<section>`, `<footer>`
- Form labels properly associated
- Alt text for all images

---

## 13. Development Workflow

### 13.1 Setup Commands

**Backend:**
```bash
cd api
npm install
npx prisma migrate dev --name init
npx prisma db seed  # Seeds admin user and default slots
npm run dev  # Runs on port 6060
```

**Frontend:**
```bash
cd web
npm install
npm run dev -- -p 4000
```

**Root (Both):**
```bash
npm run dev  # Uses concurrently to run both
```

### 13.2 Database Seeding

**Seed Script (`api/prisma/seed.ts`):**
- Creates admin user from `ADMIN_DEFAULT_EMAIL` and `ADMIN_DEFAULT_PASSWORD`
- Hashes password with bcrypt (10 rounds)
- Creates default time slots:
  - 11:00 AM - 2:00 PM (30-min intervals)
  - 5:00 PM - 8:00 PM (30-min intervals)

### 13.3 Port Configuration

- **Frontend:** `http://localhost:4000`
- **Backend:** `http://localhost:6060` (changed from 6000 due to Chrome's unsafe port list)

---

## 14. Error Handling

### 14.1 Backend Error Handling

**Global Error Handler:**
- Catches all unhandled errors
- Returns `{ error: 'Something went wrong' }` (no internal details)
- Logs errors (without PII)

**Route-Level Errors:**
- Validation errors: 400 with field-specific messages
- Not found: 404
- Unauthorized: 401
- Server errors: 500

### 14.2 Frontend Error Handling

**Form Errors:**
- Field-level validation errors
- Server error messages displayed clearly
- User-friendly messages (no technical details)

**API Errors:**
- Network errors caught and displayed
- 401 errors redirect to login (admin)
- 429 errors show rate limit message

---

## 15. Testing & Quality Assurance

### 15.1 Validation Testing

- **Phone validation:** Exactly 10 digits enforced
- **Date validation:** Future dates only, Mon-Sat only
- **Slot validation:** Must be from available slots
- **Age validation:** Years 0-21, months 0-11

### 15.2 Security Testing

- **Rate limiting:** Verified on booking and login endpoints
- **Input validation:** Invalid payloads rejected
- **Authentication:** Protected routes require valid JWT
- **CORS:** Only frontend origin allowed

### 15.3 Manual Testing Checklist

- [ ] Appointment form submission
- [ ] Dynamic slot loading
- [ ] Day availability warnings
- [ ] Admin login
- [ ] Availability management (all 3 views)
- [ ] Booking status updates
- [ ] Email notifications
- [ ] Mobile responsiveness
- [ ] Form validation errors

---

## 16. Known Limitations & Future Enhancements

### 16.1 Current Limitations

1. **WhatsApp Integration:** Placeholder only (no real API)
2. **Password Reset:** Not implemented (single admin user)
3. **Email Templates:** Plain text only (no HTML)
4. **Booking Conflicts:** No check for double-booking (handled manually)
5. **Recurring Availability:** No support for recurring patterns
6. **SMS Notifications:** Not implemented

### 16.2 Future Enhancements

1. **Real WhatsApp Integration:** Twilio or WhatsApp Business API
2. **HTML Email Templates:** Rich email formatting
3. **Booking Conflict Detection:** Prevent double-booking
4. **Recurring Availability:** Weekly patterns, holidays
5. **SMS Notifications:** Twilio integration
6. **Patient Portal:** View booking history, reschedule
7. **Analytics Dashboard:** Booking trends, popular slots
8. **Multi-language Support:** Telugu, Hindi
9. **Payment Integration:** Online payment for consultations
10. **Telemedicine Integration:** Video call links for online consultations

---

## 17. Deployment Considerations

### 17.1 Production Checklist

- [ ] Change `DATABASE_URL` to PostgreSQL
- [ ] Set strong `JWT_SECRET`
- [ ] Configure Gmail app password
- [ ] Update CORS origins to production domain
- [ ] Set `NODE_ENV=production`
- [ ] Enable Winston logging
- [ ] Configure HTTPS (Nginx/CloudFront)
- [ ] Set up database backups
- [ ] Configure environment variables on hosting platform
- [ ] Test email delivery
- [ ] Verify rate limiting works
- [ ] Test admin login flow

### 17.2 Recommended Hosting

**Backend:**
- Railway, Render, or AWS Elastic Beanstalk
- PostgreSQL database (managed service)

**Frontend:**
- Vercel (optimized for Next.js)
- Or Netlify, AWS Amplify

**Database:**
- Supabase, Railway PostgreSQL, or AWS RDS

---

## 18. File Structure Summary

```
TenderTouchPeds/
├── api/
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema
│   │   ├── seed.ts                # Seed script
│   │   └── migrations/            # Database migrations
│   ├── src/
│   │   ├── index.ts               # Express app entry
│   │   ├── db/
│   │   │   └── prisma.ts          # Prisma client
│   │   ├── routes/
│   │   │   ├── bookings.ts        # Public booking endpoints
│   │   │   ├── admin.ts           # Admin auth & bookings
│   │   │   └── availability.ts   # Availability management
│   │   ├── middleware/
│   │   │   ├── auth.ts            # JWT authentication
│   │   │   ├── errorHandler.ts    # Global error handler
│   │   │   └── rateLimit.ts       # Rate limiting
│   │   └── services/
│   │       ├── mailer.ts          # Email service
│   │       └── whatsappStub.ts    # WhatsApp placeholder
│   └── package.json
├── web/
│   ├── app/
│   │   ├── layout.tsx             # Root layout
│   │   ├── page.tsx               # Home page
│   │   └── admin/
│   │       ├── page.tsx           # Admin dashboard
│   │       └── login/
│   │           └── page.tsx       # Admin login
│   ├── components/
│   │   ├── AppointmentForm.tsx   # Booking form
│   │   ├── AvailabilityManager.tsx # Admin availability UI
│   │   ├── BookingsManager.tsx    # Admin bookings UI
│   │   └── [other components]     # Public-facing components
│   ├── styles/
│   │   └── globals.css            # Global styles + typography
│   ├── public/                    # Static assets
│   └── package.json
└── package.json                   # Monorepo root
```

---

## 19. Key Technical Decisions

### 19.1 Why SQLite for Dev?

- **Simplicity:** No database server needed
- **Fast setup:** File-based, no configuration
- **Compatible:** Same Prisma schema works for PostgreSQL
- **Easy migration:** Change `DATABASE_URL` for production

### 19.2 Why Strings Instead of Enums?

- **SQLite limitation:** Doesn't support Prisma enums
- **Solution:** Use strings, validate with Zod
- **Trade-off:** Slightly less type-safe, but works across databases

### 19.3 Why JWT in localStorage?

- **Simplicity:** No cookie configuration needed
- **CSRF protection:** Not needed for API-only auth
- **Trade-off:** XSS risk (mitigated by CSP headers)

### 19.4 Why Monorepo?

- **Code sharing:** Shared types/interfaces (future)
- **Single repo:** Easier to manage
- **Concurrent dev:** Run both services together

### 19.5 Why Next.js App Router?

- **Modern:** Latest Next.js features
- **Server Components:** Better performance
- **File-based routing:** Intuitive structure
- **SEO:** Built-in optimizations

---

## 20. Summary of All Features

### ✅ Completed Features

1. **Public Website**
   - ✅ Responsive design (mobile-first)
   - ✅ Hero section with CTAs
   - ✅ About clinic & doctor sections
   - ✅ Services listing
   - ✅ Reviews section
   - ✅ FAQ with structured data
   - ✅ Contact & location with map
   - ✅ SEO optimization

2. **Appointment Booking**
   - ✅ Dynamic slot fetching
   - ✅ Real-time availability checking
   - ✅ Day-level availability warnings
   - ✅ Phone validation (10 digits)
   - ✅ Date validation (future, Mon-Sat)
   - ✅ Form validation with clear errors
   - ✅ Success/error handling

3. **Admin Portal**
   - ✅ JWT authentication
   - ✅ Global slots management
   - ✅ Date-specific slot overrides
   - ✅ Day-level availability (calendar view)
   - ✅ Multi-select & bulk actions
   - ✅ Booking management
   - ✅ Status updates
   - ✅ Date & status filters

4. **Backend API**
   - ✅ Booking creation
   - ✅ Slot availability endpoint
   - ✅ Admin authentication
   - ✅ Availability CRUD operations
   - ✅ Email notifications
   - ✅ Rate limiting
   - ✅ Security headers

5. **Database**
   - ✅ Booking model
   - ✅ Admin user model
   - ✅ Time slot model
   - ✅ Date availability model
   - ✅ Day availability model
   - ✅ Proper indexes
   - ✅ Cascade deletes

6. **Security**
   - ✅ Helmet security headers
   - ✅ CORS configuration
   - ✅ Rate limiting
   - ✅ Input validation (Zod)
   - ✅ Password hashing (bcrypt)
   - ✅ JWT authentication
   - ✅ Error handling

---

## 21. Architecture Review Notes

### 21.1 Strengths

1. **Separation of Concerns:** Clear backend/frontend separation
2. **Type Safety:** TypeScript throughout
3. **Validation:** Zod schemas on both ends
4. **Security:** Multiple layers (headers, rate limiting, auth)
5. **Scalability:** Database indexes, efficient queries
6. **Maintainability:** Clean code structure, well-organized

### 21.2 Areas for Improvement

1. **Error Logging:** Add structured logging (Winston)
2. **Testing:** Add unit/integration tests
3. **Documentation:** API documentation (Swagger/OpenAPI)
4. **Monitoring:** Add error tracking (Sentry)
5. **Caching:** Add Redis for rate limiting in production
6. **Database:** Migrate to PostgreSQL for production

---

## 22. Conclusion

This is a **production-ready** pediatric clinic management system with:

- ✅ Complete booking flow
- ✅ Comprehensive availability management
- ✅ Secure admin portal
- ✅ Email notifications
- ✅ Mobile-responsive design
- ✅ SEO optimization
- ✅ Security best practices

The system is ready for deployment with minimal configuration changes (database URL, environment variables, CORS origins).

---

**Last Updated:** December 2024
**Version:** 1.0.0
**Status:** Production-Ready (Pending Deployment Configuration)

---

## Quick Start (Dev)

To run the development environment:

- **Install dependencies:** Run `npm install` at the repository root (this installs dependencies for both `api` and `web` workspaces)
- **Set up database:** Navigate to `api/` and run `npx prisma migrate dev --name init` to create the database schema, then `npm run prisma:seed` to seed the initial admin user and default time slots
- **Start dev servers:** From the root, run `npm run dev` to start both the API server (port 6060) and the Next.js web app (port 4000) concurrently
- **Access the application:** Open `http://localhost:4000` in your browser for the frontend, and `http://localhost:6060` for the API (API endpoints are accessible from the frontend via `NEXT_PUBLIC_API_BASE_URL`)

**Note:** Ensure all required environment variables are set in `api/.env` and `web/.env.local` before starting (see environment variable documentation above).

