# Purrward — Core Platform Requirements

## User Stories

### US-1: Cat Owner Authentication
As a cat owner, I want to sign in with Google so I can access my personalized care dashboard.

**Acceptance Criteria:**
- GIVEN I am on the landing page, WHEN I click "Sign in with Google", THEN I am redirected to Google consent
- GIVEN Google approves, WHEN callback fires, THEN a session is created with HttpOnly/Secure/SameSite=Strict cookie
- GIVEN I have a valid session, WHEN I visit a protected page, THEN I see my user data
- GIVEN my session expires, WHEN I visit a protected page, THEN I am redirected to sign in

### US-2: Daily Habit Tracking
As a cat owner, I want to log daily care habits (feeding, water, litter, play, grooming, medication) so I can track my cat's wellness.

**Acceptance Criteria:**
- GIVEN I am logged in, WHEN I open the home dashboard, THEN I see today's care checklist
- GIVEN a habit is unchecked, WHEN I tap it, THEN I can upload a photo for verification
- GIVEN a habit is verified, THEN it shows sage success state with points awarded

### US-3: Photo Verification
As a cat owner, I want to verify my care habits with photo proof so I earn Purrpoints honestly.

**Acceptance Criteria:**
- GIVEN I upload a photo, WHEN it reaches the server, THEN MIME is validated (jpeg/png/webp), size ≤5MB, EXIF stripped
- GIVEN the photo passes validation, WHEN sent to Gemini, THEN the system prompt is immutable and user input is sandboxed
- GIVEN Gemini returns a result, WHEN confidence is sufficient, THEN points are awarded server-side
- GIVEN daily cap is reached, THEN no more points are awarded for that task type

### US-4: Points Ledger
As a cat owner, I want to earn and see my Purrpoints balance so I know what rewards I can redeem.

**Acceptance Criteria:**
- GIVEN I verify a care habit, WHEN points are awarded, THEN my balance updates in Turso
- GIVEN I check my balance, THEN the displayed value matches the server-authoritative value
- GIVEN a client sends a modified point value, THEN the server rejects it

### US-5: AI Vet Triage
As a cat owner, I want to ask health questions so I get calm first-line feline triage.

**Acceptance Criteria:**
- GIVEN I open the vet chat, THEN I see scope (feline health/behavior/nutrition) and disclaimer
- GIVEN I type a symptom, WHEN sent to Gemini, THEN user input is sandboxed in template
- GIVEN a severe symptom, THEN an emergency banner is displayed
- GIVEN rate limit is hit (50/day), THEN further messages are blocked with explanation

### US-6: Basic Cat Avatar
As a cat owner, I want to see my cat avatar with dynamic states so I feel emotionally connected.

**Acceptance Criteria:**
- GIVEN I am on the dashboard, THEN I see my cat's current state (happy/hungry/sleeping)
- GIVEN final assets are missing, THEN wireframe placeholder silhouettes are used
