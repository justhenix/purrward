# Requirements Document

## Introduction

This feature extends the Purrward core platform with two connected capabilities:

1. **Multiple cat support** — a single owner can register and manage more than one cat, select an active cat, and track care habits, photo proof, and Purrpoints attribution per cat.
2. **Free cat mode** — an onboarding path for users who do not own a cat. These users create a community cat profile (representing street or community cats they care for, such as street feeding) so they can participate in care habits and earn Purrpoints without owning a pet.

The feature builds on the existing core-platform MVP (Google OAuth + session model, habit tracker, Gemini photo verification, Purrpoints ledger, cat avatar) and the current Turso/LibSQL + Drizzle data model. Today habit completions and Purrpoints attach directly to a user row and there is no cat entity. This feature introduces a cat entity that owns habit completions while keeping the redeemable Purrpoints balance server-authoritative on the user, consistent with existing conventions.

## Glossary

- **Purrward_System**: The overall Purrward application, including its Cloudflare Worker backend and Turso database.
- **Cat_Manager**: The backend component responsible for creating, listing, updating, removing, and selecting cat profiles for a user.
- **Cat_Profile**: A record representing one cat cared for by a user, holding a name, care mode, and avatar selection.
- **Care_Mode**: The classification of a Cat_Profile as either `owned` (a cat the user owns) or `community` (a street or community cat the user cares for).
- **Active_Cat**: The single Cat_Profile currently selected by a user, used as the default context for habit tracking and the dashboard.
- **Onboarding_Service**: The backend and flow that guides a newly authenticated user through creating their first Cat_Profile, including the free cat mode path.
- **Habit_Tracker**: The existing component that records care habit completions, extended to associate each completion with a Cat_Profile.
- **Verification_Service**: The existing Gemini-backed photo verification pipeline that determines whether a habit photo is valid.
- **Points_Ledger**: The server-authoritative Purrpoints balance on the user, with per-cat attribution of earned points.
- **Habit_Completion**: A record of a single verified or unverified care habit attempt, associated with a Cat_Profile.
- **Cat_Cap**: The maximum number of Cat_Profiles a single user may hold at one time.
- **Community_Habit_Set**: The set of care habit types applicable to a Cat_Profile whose Care_Mode is `community`.

## Requirements

### Requirement 1: Register Multiple Cats

**User Story:** As a cat owner, I want to register more than one cat, so that I can track care for each of my cats separately.

#### Acceptance Criteria

1. WHEN an authenticated user submits a cat name of 1 to 40 characters after trimming leading and trailing whitespace and an avatar selection drawn from the set of available avatars, THE Cat_Manager SHALL create a Cat_Profile associated with that user and set its Care_Mode to `owned`.
2. WHERE a user already holds one or more Cat_Profiles and the count of that user's Cat_Profiles is less than the Cat_Cap, THE Cat_Manager SHALL allow the user to create additional Cat_Profiles.
3. IF a user attempts to create a Cat_Profile when the count of that user's Cat_Profiles equals the Cat_Cap, THEN THE Cat_Manager SHALL reject the request, leave the user's existing Cat_Profiles unchanged, and return a message indicating the maximum number of cats has been reached.
4. IF a cat creation request omits a cat name, contains a name that is empty or whitespace-only after trimming, or contains a name longer than 40 characters, THEN THE Cat_Manager SHALL reject the request, create no Cat_Profile, and return a validation error identifying the name field.
5. IF a cat creation request omits an avatar selection or specifies an avatar that is not in the set of available avatars, THEN THE Cat_Manager SHALL reject the request, create no Cat_Profile, and return a validation error identifying the avatar field.
6. THE Cat_Manager SHALL assign a server-generated unique identifier to each created Cat_Profile.

### Requirement 2: List and View Cats

**User Story:** As a cat owner, I want to see all of my registered cats, so that I can review and choose which cat to care for.

#### Acceptance Criteria

1. WHEN an authenticated user requests their cat list, THE Cat_Manager SHALL return all Cat_Profiles associated with that user within 2 seconds, where each returned Cat_Profile includes its name, Care_Mode, avatar selection, and attributed Purrpoints.
2. THE Cat_Manager SHALL return only Cat_Profiles owned by the requesting user, excluding all Cat_Profiles owned by any other user.
3. WHEN an authenticated user requests their cat list, THE Cat_Manager SHALL return the Cat_Profiles ordered by creation time from oldest to newest.
4. WHERE a user holds no Cat_Profiles, THE Cat_Manager SHALL return an empty list without an error indication.
5. IF an unauthenticated request for a cat list is received, THEN THE Cat_Manager SHALL reject the request, return no Cat_Profile data, and provide an error indication that authentication is required.
6. IF the Cat_Manager cannot retrieve the requested Cat_Profiles due to a data store failure, THEN THE Cat_Manager SHALL return no partial list and provide an error indication that the cat list could not be retrieved.

### Requirement 3: Select Active Cat

**User Story:** As a cat owner, I want to switch between my cats, so that I can log habits for the cat I am currently caring for.

#### Acceptance Criteria

1. WHEN an authenticated user selects one of their Cat_Profiles as active, THE Cat_Manager SHALL record that Cat_Profile as the user's Active_Cat within 2 seconds and return an observable confirmation that the active cat changed.
2. WHEN an authenticated user loads the dashboard, THE Purrward_System SHALL display habit tracking in the context of the user's Active_Cat within 2 seconds.
3. IF a user selects a Cat_Profile identifier that is not associated with that user, THEN THE Cat_Manager SHALL reject the request, leave the current Active_Cat unchanged, and return an error indicating the Cat_Profile is not available.
4. WHEN a user creates their first Cat_Profile, THE Cat_Manager SHALL set that Cat_Profile as the Active_Cat.
5. WHEN a user removes the Cat_Profile that is currently the Active_Cat and at least one other Cat_Profile remains, THE Cat_Manager SHALL set the most recently created remaining Cat_Profile as the Active_Cat.
6. WHEN a user removes the Cat_Profile that is currently the Active_Cat and no other Cat_Profile remains, THE Cat_Manager SHALL clear the Active_Cat and prompt the user to create a Cat_Profile.
7. WHEN an authenticated user begins a new session, THE Cat_Manager SHALL restore the previously recorded Active_Cat as the user's Active_Cat.
8. IF habit tracking fails to load for the Active_Cat, THEN THE Purrward_System SHALL still render the dashboard and display a message that habit tracking is temporarily unavailable.

### Requirement 4: Edit and Remove Cats

**User Story:** As a cat owner, I want to edit or remove a cat, so that my cat list stays accurate.

#### Acceptance Criteria

1. WHEN an authenticated user submits an updated name of 1 to 40 characters and/or an avatar selection from the set of available avatars for one of their Cat_Profiles, THE Cat_Manager SHALL update that Cat_Profile and return a confirmation indicating the update succeeded.
2. IF an authenticated user submits an updated name that is empty, exceeds 40 characters, or an avatar selection that is not in the set of available avatars, THEN THE Cat_Manager SHALL reject the request, leave the existing Cat_Profile unchanged, and return a validation error indicating which field is invalid.
3. WHEN an authenticated user requests removal of one of their Cat_Profiles, THE Cat_Manager SHALL remove that Cat_Profile and its associated Habit_Completions, and return a confirmation indicating the removal succeeded.
4. IF a user requests to edit or remove a Cat_Profile identifier that is not associated with that user, THEN THE Cat_Manager SHALL reject the request, leave the target Cat_Profile and its Habit_Completions unchanged, and return an authorization error.
5. WHEN a Cat_Profile is removed, THE Points_Ledger SHALL retain the user's total Purrpoints balance unchanged.

### Requirement 5: Per-Cat Habit Tracking

**User Story:** As a cat owner, I want each cat's habits and photo proof tracked separately, so that I can see the care history for each cat.

#### Acceptance Criteria

1. WHEN a user completes a habit while an Active_Cat is selected, THE Habit_Tracker SHALL associate the resulting Habit_Completion, including its submitted photo proof, with the Active_Cat and record the completion timestamp.
2. IF a user attempts to complete a habit while no Active_Cat is selected, THEN THE Habit_Tracker SHALL reject the request and return an error indicating that an Active_Cat must be selected, without recording any Habit_Completion.
3. WHEN a user views a Cat_Profile's care history, THE Habit_Tracker SHALL return only the Habit_Completions associated with that Cat_Profile, ordered from most recent to oldest completion timestamp.
4. IF a Cat_Profile has no associated Habit_Completions when its care history is viewed, THEN THE Habit_Tracker SHALL return an empty care history result without error.
5. THE Habit_Tracker SHALL apply the existing daily per-task points cap independently for each Cat_Profile, such that reaching the cap for one Cat_Profile does not reduce the points available for any other Cat_Profile.
6. IF a habit completion request references a Cat_Profile that is not associated with the requesting user, THEN THE Habit_Tracker SHALL reject the request, record no Habit_Completion, and return an authorization error indicating the Cat_Profile is not accessible to the requesting user.

### Requirement 6: Per-Cat Points Attribution

**User Story:** As a cat owner, I want to see how many Purrpoints each cat has earned, so that I understand each cat's contribution to my balance.

#### Acceptance Criteria

1. WHEN the Verification_Service confirms a habit for a Cat_Profile, THE Points_Ledger SHALL add the server-computed awarded Purrpoints (an integer from 1 to 1,000,000) to the user's server-authoritative balance and attribute that same amount to that Cat_Profile.
2. WHEN a user views a Cat_Profile, THE Points_Ledger SHALL display the total Purrpoints attributed to that Cat_Profile within 2 seconds.
3. WHEN a user views a Cat_Profile that has zero Purrpoints attributed, THE Points_Ledger SHALL display a total of 0.
4. THE Points_Ledger SHALL maintain the user's total balance equal to the sum of Purrpoints attributed across all of that user's Cat_Profiles.
5. IF a client submits a Purrpoints value or a per-cat attribution value, THEN THE Points_Ledger SHALL ignore the client-supplied value and compute Purrpoints server-side.
6. IF the Verification_Service confirms a habit referencing a Cat_Profile that does not exist or does not belong to the requesting user, THEN THE Points_Ledger SHALL reject the attribution, leave the user's balance unchanged, and return an error indicating the Cat_Profile is invalid.

### Requirement 7: Free Cat Mode Onboarding

**User Story:** As a user who does not own a cat, I want to join through a free cat mode, so that I can care for community cats and earn Purrpoints without owning a pet.

#### Acceptance Criteria

1. WHEN a newly authenticated user has no Cat_Profiles, THE Onboarding_Service SHALL present a choice between registering an owned cat and entering free cat mode.
2. WHEN a user chooses free cat mode, THE Onboarding_Service SHALL create a Cat_Profile with Care_Mode set to `community` and set that Cat_Profile as the Active_Cat.
3. WHEN a user chooses free cat mode without supplying a name, THE Onboarding_Service SHALL assign a system-generated default community cat name of 1 to 40 characters to the created Cat_Profile.
4. WHEN a user supplies a name of 1 to 40 characters while choosing free cat mode, THE Onboarding_Service SHALL create the Cat_Profile using that supplied name.
5. IF a user supplies a name that is empty or exceeds 40 characters while choosing free cat mode, THEN THE Onboarding_Service SHALL reject the name, retain the free cat mode selection without creating a Cat_Profile, and display an error indicating the name length is invalid.
6. IF Cat_Profile creation fails when a user chooses free cat mode, THEN THE Onboarding_Service SHALL not set any Active_Cat, retain the user's free cat mode selection, and display an error indicating that Cat_Profile creation failed.
7. WHERE a user holds only community Cat_Profiles, THE Onboarding_Service SHALL allow that user to add an owned Cat_Profile at a later time.

### Requirement 8: Community Cat Care Participation

**User Story:** As a community cat caretaker, I want to log community care activities such as street feeding, so that I earn Purrpoints for helping community cats.

#### Acceptance Criteria

1. WHERE a Cat_Profile's Care_Mode is `community`, THE Habit_Tracker SHALL offer the Community_Habit_Set for that Cat_Profile.
2. WHEN a user submits photo proof for a community habit, THE Verification_Service SHALL verify the photo using the existing immutable server prompt with user input sandboxed and SHALL return a verification result within 30 seconds of submission.
3. IF a submitted community-habit photo fails validation (not jpeg/png/webp, or larger than 5MB), THEN THE Verification_Service SHALL reject the submission without verifying it, SHALL NOT trigger any Purrpoints award, and SHALL return an error indication identifying the validation failure while preserving the unsubmitted habit state.
4. WHEN the Verification_Service confirms a community habit, THE Points_Ledger SHALL award Purrpoints on the same server-authoritative basis as owned-cat habits.
5. IF the Verification_Service does not confirm a community habit (rejection or verification failure), THEN THE Points_Ledger SHALL NOT award any Purrpoints for that submission and THE Habit_Tracker SHALL return an error indication that the habit was not confirmed.
6. THE Habit_Tracker SHALL apply the existing daily per-task points cap to community habits.
7. IF awarding Purrpoints fails after the Verification_Service has confirmed a habit, THEN THE Points_Ledger SHALL retry the award at intervals of at least 5 seconds for a maximum of 5 attempts until the confirmed habit's Purrpoints are recorded exactly once.
8. IF the Points_Ledger exhausts the maximum of 5 award attempts without recording the confirmed habit's Purrpoints, THEN THE Points_Ledger SHALL preserve the confirmed-but-unpaid habit state for later reconciliation and SHALL surface an error indication that the award is pending.

### Requirement 9: Mixed Ownership Support

**User Story:** As a user, I want to keep both owned cats and community cats in one account, so that I can track all of my care activity together.

#### Acceptance Criteria

1. WHERE a user holds both owned and community Cat_Profiles, THE Cat_Manager SHALL include every one of that user's Cat_Profiles in the user's cat list, each with its own Care_Mode value and attributed Purrpoints, regardless of the ratio of owned to community Cat_Profiles.
2. WHEN a user switches the Active_Cat to a Cat_Profile whose Care_Mode is `community`, THE Habit_Tracker SHALL present the Community_Habit_Set for that Active_Cat.
3. WHEN a user switches the Active_Cat to a Cat_Profile whose Care_Mode is `owned`, THE Habit_Tracker SHALL present the owned-cat habit set for that Active_Cat.
4. THE Cat_Cap SHALL apply to the combined count of a user's owned and community Cat_Profiles, with no Care_Mode excluded from that count.
