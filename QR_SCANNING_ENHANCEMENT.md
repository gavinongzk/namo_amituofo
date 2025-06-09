# QR Scanning Enhancement for Newly Created Registrations

## Problem

The AttendanceClient's QR scanning functionality was not working with registrations that were just created because:

1. The client maintained an in-memory state of registrations (`registrations` state)
2. When new registrations were created, they existed in the database but weren't reflected in the client's state
3. QR scanning relied on this local state to find and verify registrations
4. Users had to manually click the "Refresh" button to update the state

## Solution Implemented

### 1. **Auto-Refresh Functionality**

Added automatic polling to periodically fetch new registrations:

```typescript
// State for auto-refresh - initialized to prevent hydration issues
const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(false);
const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);
const autoRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

// Enable auto-refresh after component mounts to prevent hydration issues
useEffect(() => {
  // Initialize auto-refresh and timestamp on client-side only
  setAutoRefreshEnabled(true);
  setLastRefreshTime(Date.now());
}, []);

// Auto-refresh effect
useEffect(() => {
  if (autoRefreshEnabled) {
    // Refresh more frequently when QR scanner is active for better UX
    const refreshInterval = showScanner ? 10000 : 15000; // 10s when scanner active, 15s otherwise
    
    const interval = setInterval(() => {
      setLastRefreshTime(Date.now());
      fetchRegistrations();
    }, refreshInterval);
    autoRefreshIntervalRef.current = interval;

    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
        autoRefreshIntervalRef.current = null;
      }
    };
  }
  
  return () => {
    if (autoRefreshIntervalRef.current) {
      clearInterval(autoRefreshIntervalRef.current);
      autoRefreshIntervalRef.current = null;
    }
  };
}, [autoRefreshEnabled, showScanner, fetchRegistrations]);
```

**Features:**
- Hydration-safe initialization to prevent React error #423
- Refreshes every 15 seconds normally, every 10 seconds when QR scanner is active
- Can be toggled on/off by users
- Shows last refresh time in the UI
- Proper interval cleanup to prevent memory leaks

### 2. **Smart QR Scan Retry Logic**

Enhanced the QR scan handler to automatically fetch fresh data when a registration is not found:

```typescript
const handleScan = useCallback(async (decodedText: string) => {
  // ... existing code ...

  // First, try to find the registration in current data
  let registration = findAndVerifyRegistration(registrations);

  if (registration) {
    processRegistration(registration);
  } else {
    // If registration not found, try refreshing data and search again
    console.log('Registration not found, refreshing data and retrying...');
    showModalWithMessage(
      'Searching / 搜索中',
      `Searching for registration: ${queueNumber}\n搜索注册信息: ${queueNumber}`,
      'loading'
    );

    try {
      // Fetch fresh data from the API
      const response = await fetch(`/api/events/${event._id}/attendees`);
      if (!response.ok) {
        throw new Error('Failed to fetch fresh registrations');
      }
      const data = await response.json();
      
      if (Array.isArray(data.attendees)) {
        const freshRegistrations = data.attendees.map((registration: EventRegistration) => ({
          ...registration,
          order: {
            ...registration.order,
            customFieldValues: registration.order.customFieldValues.map((group) => ({
              ...group,
              cancelled: group.cancelled || false
            }))
          }
        }));

        // Search in fresh data
        const updatedRegistration = findAndVerifyRegistration(freshRegistrations);

        if (updatedRegistration) {
          console.log('Found registration after refresh, processing...');
          // Update the registrations state with fresh data
          setRegistrations(freshRegistrations);
          setLastRefreshTime(Date.now());
          
          // Process the found registration
          processRegistration(updatedRegistration);
        } else {
          // Show error if still not found
        }
      }
    } catch (error) {
      // Handle errors
    }
  }
}, [registrations, handleMarkAttendance, showModalWithMessage, beepHistory, event._id]);
```

**Features:**
- When QR scan doesn't find a registration in local state, it automatically fetches fresh data
- Shows a "Searching..." loading message during the refresh
- Updates local state with fresh data if registration is found
- Processes the registration immediately after finding it

### 3. **User Interface Enhancements**

Added UI controls and status indicators:

```tsx
{/* Auto-refresh toggle button */}
<Button
  onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
  className={`text-lg p-3 w-full sm:w-auto ${autoRefreshEnabled ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-600 hover:bg-green-700'} text-white`}
>
  {autoRefreshEnabled ? 'Disable Auto-Refresh' : 'Enable Auto-Refresh'}
</Button>

{/* Auto-refresh status */}
<div className="mb-4 text-sm text-gray-600">
  <span>
    Auto-refresh: {autoRefreshEnabled ? 
      `ON (every ${showScanner ? '10' : '15'} seconds${showScanner ? ' - Scanner Active' : ''})` : 
      'OFF'
    }
  </span>
  {autoRefreshEnabled && (
    <span className="ml-4">
      Last refresh: {new Date(lastRefreshTime).toLocaleTimeString()}
    </span>
  )}
</div>
```

## Benefits

1. **Immediate QR Scanning**: QR codes work immediately after registration without requiring manual refresh
2. **Real-time Updates**: Registrations are automatically synced every 10-15 seconds
3. **Better UX**: Users don't need to manually refresh the page
4. **Faster Response When Active**: When QR scanner is open, refresh happens more frequently (10s)
5. **Fallback Mechanism**: If auto-refresh misses something, the QR scan itself will trigger a refresh
6. **User Control**: Users can disable auto-refresh if needed
7. **Status Visibility**: Clear indication of auto-refresh status and last update time

## Usage

1. **Default Behavior**: Auto-refresh is enabled by default and works transparently
2. **QR Scanning**: Just scan QR codes - if a registration isn't found locally, the system will automatically refresh and try again
3. **Manual Control**: Use the "Enable/Disable Auto-Refresh" button to control automatic updates
4. **Manual Refresh**: The existing "Refresh" button still works for immediate updates

## Technical Notes

- Auto-refresh uses the existing `fetchRegistrations` function
- QR scanning remains backwards compatible with existing functionality
- The enhancement is non-breaking and can be toggled off if needed
- Performance impact is minimal due to reasonable refresh intervals
- Fresh data fetching in QR scan uses direct API calls for immediate response

## 🐛 Hydration Fix (React Error #423)

During implementation, we encountered React minified error #423: "There was an error while hydrating but React was able to recover by instead client rendering the entire root."

This error occurs when the server-rendered HTML doesn't match the client-rendered content, causing hydration mismatches.

### Root Cause
The initial implementation had hydration issues because:
1. Auto-refresh was enabled by default (`useState(true)`)
2. Timestamp was initialized with `Date.now()` on both server and client
3. These values would be different between server and client renders

### Solution Applied
```typescript
// ❌ Before (caused hydration mismatch)
const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(true);
const [lastRefreshTime, setLastRefreshTime] = useState<number>(Date.now());

// ✅ After (hydration-safe)
const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(false);
const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);

// Initialize on client-side only
useEffect(() => {
  setAutoRefreshEnabled(true);
  setLastRefreshTime(Date.now());
}, []);
```

### Key Changes Made
1. **Safe Initial Values**: Started with `false` and `0` for server-side rendering
2. **Client-Side Initialization**: Used `useEffect` to set proper values after hydration
3. **Proper Cleanup**: Added comprehensive interval cleanup to prevent memory leaks
4. **Conditional Rendering**: Only show timestamp when `lastRefreshTime > 0`

This ensures the server and client render the same initial content, preventing hydration errors while maintaining full functionality after the component mounts.

This solution ensures that QR scanning works seamlessly with newly created registrations while maintaining good performance and user experience. 