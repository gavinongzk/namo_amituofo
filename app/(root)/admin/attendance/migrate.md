# AttendanceClient Migration Guide

## Overview
This guide helps you migrate from the current monolithic `AttendanceClient.tsx` to the refactored modular version.

## Migration Steps

### Phase 1: Gradual Migration (Recommended)

#### Step 1: Keep both versions side by side
1. Rename current file: `AttendanceClient.tsx` → `AttendanceClientLegacy.tsx`
2. Create new refactored version as `AttendanceClient.tsx`
3. Use feature flag to switch between versions

```tsx
// In your page component
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import AttendanceClient from './AttendanceClient';
import AttendanceClientLegacy from './AttendanceClientLegacy';

export default function AttendancePage({ event }) {
  const useRefactoredVersion = useFeatureFlag('refactored-attendance');
  
  return useRefactoredVersion ? 
    <AttendanceClient event={event} /> : 
    <AttendanceClientLegacy event={event} />;
}
```

#### Step 2: Test individual components
```bash
# Test the new components individually
npm test -- AttendanceHeader
npm test -- AttendanceTable  
npm test -- useAttendanceData
npm test -- useAutoRefresh
```

#### Step 3: Gradual rollout
1. Start with 10% of users
2. Monitor for issues
3. Gradually increase to 50%, then 100%

### Phase 2: Complete Migration

#### Step 1: Update imports in your page
```tsx
// Before
import AttendanceClient from './AttendanceClient';

// After  
import AttendanceClient from './AttendanceClient'; // Now the refactored version
```

#### Step 2: Remove legacy code
```bash
rm app/\(root\)/admin/attendance/AttendanceClientLegacy.tsx
```

## Rollback Plan

If issues arise, quickly rollback:

```tsx
// Emergency rollback - rename files back
mv AttendanceClient.tsx AttendanceClientRefactored.tsx
mv AttendanceClientLegacy.tsx AttendanceClient.tsx
```

## Testing Checklist

- [ ] Queue number input works
- [ ] QR scanning functions correctly  
- [ ] Attendance marking/unmarking
- [ ] Registration cancellation
- [ ] Registration deletion (superadmin)
- [ ] Remarks editing (superadmin)
- [ ] CSV export (superadmin)
- [ ] Google Sheets export (superadmin)
- [ ] Auto-refresh functionality
- [ ] Pagination works
- [ ] Search functionality
- [ ] Mobile responsiveness

## Performance Verification

Check these metrics before/after:
- Component render time
- Memory usage
- Bundle size
- Time to interactive
- Core web vitals

## Common Issues & Solutions

### Issue: Import errors
**Solution:** Ensure all new files are created and paths are correct

### Issue: Type errors  
**Solution:** Make sure types/attendance.ts is properly imported

### Issue: Hook dependencies
**Solution:** Verify all dependencies are listed in useEffect arrays

### Issue: Props drilling
**Solution:** Consider adding Context if props become unwieldy 