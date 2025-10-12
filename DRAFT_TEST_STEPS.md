# Draft Functionality Test Steps

## Prerequisites
- You must be logged in as a **superadmin** to test the draft functionality
- Open browser developer console to view debug logs

## Test 1: Create a Draft Event
1. Navigate to the "Create Event" page
2. Fill in all required fields:
   - Title: "Test Draft Event"
   - Description: "This is a test draft event"
   - Category: Select any category
   - Location: "Test Location"
   - Date & Time: Select future dates
   - Max Seats: 100
3. Click the **"Save as Draft"** button (gray button on the left)
4. **Expected Results:**
   - Console should show: `"Save as draft: true"`
   - Console should show: `"Creating event with isDraft: true"`
   - You should be redirected to the event details page
   - The event details page should show a **yellow warning banner**: "This event is a draft..."
   - The registration button should be **hidden**

## Test 2: Verify Draft Event Visibility
1. Go to the main events page (public listing)
2. **Expected Results:**
   - The draft event should **NOT** appear in the public listing
3. Go to the admin panel or event selector
4. **Expected Results:**
   - The draft event **should appear** with a "(草稿/Draft)" indicator

## Test 3: Publish a Draft Event
1. Navigate to the draft event details page
2. Click "Update Event" or edit the event
3. Click the **"Publish Event"** button (blue button on the right)
4. **Expected Results:**
   - Console should show: `"Save as draft: false"`
   - Console should show: `"Updating event with isDraft: false"`
   - You should be redirected to the event details page
   - The yellow draft warning banner should be **gone**
   - The registration button should be **visible**

## Test 4: Verify Published Event Visibility
1. Go to the main events page (public listing)
2. **Expected Results:**
   - The event should **now appear** in the public listing
3. Go to the admin panel
4. **Expected Results:**
   - The "(草稿/Draft)" indicator should be **gone**

## Test 5: Create a Published Event Directly
1. Navigate to the "Create Event" page
2. Fill in all required fields
3. Click the **"Publish"** button (blue button on the right)
4. **Expected Results:**
   - Console should show: `"Save as draft: false"`
   - Console should show: `"Creating event with isDraft: false"`
   - Event should be immediately visible in public listings
   - No draft warning banner
   - Registration button visible

## Test 6: Regular Admin Cannot Create Drafts
1. Log out and log in as a **regular admin** (not superadmin)
2. Navigate to the "Create Event" page
3. **Expected Results:**
   - Only **one button** should be visible: "Create Event"
   - No "Save as Draft" or "Publish" buttons
   - Created events are automatically published (isDraft: false)

## Test 7: Public Users Cannot See Drafts
1. Log out or use incognito mode
2. Try to access a draft event's direct URL
3. **Expected Results:**
   - Should show "Not Available" or redirect to home page
   - Registration should be blocked

## Console Logs to Watch For

### When creating a draft:
```
Form submitted with values: {...}
Save as draft: true
Creating event with isDraft: true | User role: superadmin | Provided isDraft: true
New event created successfully: {...}
```

### When publishing an event:
```
Form submitted with values: {...}
Save as draft: false
Creating event with isDraft: false | User role: superadmin | Provided isDraft: false
New event created successfully: {...}
```

### When updating to publish:
```
Form submitted with values: {...}
Save as draft: false
Updating event with isDraft: false | User role: superadmin
```

## Common Issues and Solutions

### Issue: Draft event appears in public listing
- **Solution**: Check that the event listing filters include `{ isDraft: { $ne: true } }`

### Issue: "Save as Draft" button not showing
- **Solution**: Verify you're logged in as a superadmin (check user role in console)

### Issue: Draft status not changing when clicking Publish
- **Solution**: Check console logs to see if isDraft value is being passed correctly

### Issue: Console shows "NOT updating isDraft"
- **Reason**: Either user is not a superadmin OR isDraft is undefined in the event data
- **Solution**: Verify the button click handler is passing the correct value

## Success Criteria
✅ All test cases pass without errors
✅ Console logs show correct isDraft values
✅ Draft events are only visible to superadmins
✅ Published events are visible to everyone
✅ Draft indicators show correctly in admin panel
✅ Registration is properly blocked for draft events

