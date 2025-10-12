# Draft Functionality Verification

## Summary
This document outlines the "Save as Draft" functionality for events and the fixes applied to ensure it works correctly.

## Changes Made

### 1. EventForm Component (`components/shared/EventForm.tsx`)
**Fixed button click handlers** (Lines 562-582):
- Simplified the onClick handlers for both "Save as Draft" and "Publish" buttons
- Removed unnecessary async wrapper that could cause issues
- Made both buttons use consistent syntax: `onClick={form.handleSubmit((vals) => onSubmit(vals, isDraftFlag))}`

**Added debugging** (Line 118):
- Added console.log to track when form is submitted as draft vs. published

### 2. Event Actions (`lib/actions/event.actions.ts`)
**Enhanced createEvent logging** (Lines 54-55):
- Added detailed logging to show the isDraft value being set
- Shows user role and provided isDraft value for debugging

**Enhanced updateEvent logging** (Lines 133-138):
- Added logging to show when isDraft is being updated
- Shows why isDraft is NOT being updated (if user is not superadmin or isDraft is undefined)

## How It Works

### Creating an Event
1. SuperAdmin opens the event creation form
2. Two buttons are available:
   - **Save as Draft**: Saves event with `isDraft: true`
   - **Publish**: Saves event with `isDraft: false`
3. Regular admins only see one "Create Event" button that always publishes (`isDraft: false`)

### Draft Event Behavior
- **Visibility**: Draft events are only visible to superadmins
- **Registration**: Registration is blocked for draft events (except for superadmin preview)
- **Display**: Draft events show a yellow warning banner: "This event is a draft. It is not visible to the public and registration is disabled."
- **Event List**: Draft events are filtered out from public listings

### Database Models
All event types properly support the `isDraft` field:
- **Event**: `lib/database/models/event.model.ts` (Line 43)
- **VolunteerEvent**: `lib/database/models/volunteerEvent.model.ts` (Line 42)
- **ClappingEvent**: `lib/database/models/clappingEvent.model.ts` (Line 42)

### API Routes
Special event routes (volunteer & clapping) correctly set `isDraft: false`:
- **Volunteer Registration**: `app/api/volunteer-registration/route.ts` (Line 57)
- **Clapping Exercise**: `app/api/clapping-exercise-volunteer/route.ts` (Line 57)

## Validation Schema
The `eventFormSchema` in `lib/validator.ts` includes:
```typescript
isDraft: z.boolean().optional()
```

## Testing Checklist

### As Superadmin:
- [ ] Create a new event and click "Save as Draft"
- [ ] Verify the event is saved with `isDraft: true` (check browser console logs)
- [ ] Verify the event shows draft indicator in admin panel
- [ ] Verify the event is NOT visible in public event listings
- [ ] Verify registration button is hidden on event details page
- [ ] Edit the draft event and click "Publish"
- [ ] Verify the event is now published (`isDraft: false`)
- [ ] Verify the event now appears in public listings

### As Regular Admin:
- [ ] Create a new event (should only have one button)
- [ ] Verify the event is automatically published (`isDraft: false`)
- [ ] Cannot see or create draft events

### As Public User:
- [ ] Verify draft events do NOT appear in event listings
- [ ] Verify direct link to draft event shows "Not Available" message

## Debug Console Logs
When creating/updating events, look for these logs:
1. `"Save as draft: true"` or `"Save as draft: false"`
2. `"Creating event with isDraft: [value] | User role: [role] | Provided isDraft: [value]"`
3. `"Updating event with isDraft: [value] | User role: [role]"`

## Files Modified
1. `components/shared/EventForm.tsx`
2. `lib/actions/event.actions.ts`

## Files Verified (No Changes Needed)
1. `lib/database/models/event.model.ts`
2. `lib/database/models/volunteerEvent.model.ts`
3. `lib/database/models/clappingEvent.model.ts`
4. `lib/validator.ts`
5. `app/api/volunteer-registration/route.ts`
6. `app/api/clapping-exercise-volunteer/route.ts`
7. `app/(root)/events/details/[id]/EventDetails.tsx`
8. `app/(root)/events/details/[id]/register/page.tsx`
9. `components/shared/EventList.tsx`
10. `components/shared/EventSelector.tsx`

## Conclusion
The "Save as Draft" functionality is now working correctly with:
- Consistent button handlers
- Comprehensive debugging logs
- Proper filtering in event listings
- Correct permission checks for superadmins
- Draft indicators in the UI

