# Camera Management Improvements

## Overview
This document outlines the improvements made to ensure proper camera opening and closing in the QR code scanner component.

## Key Improvements

### 1. Enhanced Cleanup Function
- **Centralized cleanup**: All camera resources are now properly cleaned up in a single `cleanupCamera` function
- **Comprehensive resource management**: Stops scanner, media tracks, and clears video element
- **Error handling**: Wraps cleanup operations in try-catch blocks to prevent errors during cleanup

### 2. Better State Management
- **Loading states**: Added `isInitializing` state to show proper loading feedback
- **Active state tracking**: Better tracking of camera active state
- **Proper state reset**: All states are reset during cleanup

### 3. Improved Error Handling
- **Enhanced error messages**: More specific error messages for different camera access issues
- **Bilingual support**: Error messages in both English and Chinese
- **Retry logic**: Improved retry mechanism with proper timeout handling

### 4. Resource Management
- **Stream references**: Proper tracking of media streams for cleanup
- **Scanner references**: Better management of QR scanner instances
- **Timeout cleanup**: Proper cleanup of retry timeouts

### 5. Component Lifecycle
- **Mount/unmount handling**: Proper cleanup when component unmounts
- **Camera switching**: Better handling when switching between cameras
- **Parent component integration**: Improved integration with parent components

## Technical Details

### Cleanup Process
1. Clear any pending retry timeouts
2. Stop the QR scanner instance
3. Stop all media tracks and disable them
4. Clear video element and reset it
5. Reset all component states

### Error Types Handled
- `NotAllowedError`: Camera permission denied
- `NotFoundError`: No camera found
- `NotReadableError`: Camera in use by another application
- `NotSupportedError`: Browser doesn't support camera access
- Generic errors with fallback messages

### State Management
- `isActive`: Tracks if camera should be active
- `isInitializing`: Shows loading state during camera initialization
- `error`: Displays error messages to user
- `retryCount`: Tracks retry attempts
- `retryDelay`: Manages retry timing

## Usage

### In Parent Components
```tsx
const [showScanner, setShowScanner] = useState(false);

const handleToggleScanner = useCallback(() => {
  setShowScanner(prev => !prev);
}, []);

const handleScannerClose = useCallback(() => {
  setShowScanner(false);
}, []);

// Cleanup on unmount
useEffect(() => {
  return () => {
    setShowScanner(false);
  };
}, []);

// In JSX
{showScanner && (
  <QrCodeScanner 
    onScan={handleScan} 
    onClose={handleScannerClose} 
  />
)}
```

### Scanner Component
```tsx
<QrCodeScanner 
  onScan={(decodedText) => {
    // Handle scanned QR code
    console.log('Scanned:', decodedText);
  }}
  onClose={() => {
    // Handle scanner close
    console.log('Scanner closed');
  }}
/>
```

## Best Practices

1. **Always provide onClose handler**: Ensures proper cleanup when scanner is closed
2. **Handle component unmounting**: Clean up scanner state when parent component unmounts
3. **Monitor console logs**: Check for cleanup messages to verify proper resource management
4. **Test on different devices**: Verify camera behavior on various devices and browsers
5. **Handle permissions**: Provide clear guidance for camera permission issues

## Troubleshooting

### Camera Not Opening
- Check browser permissions
- Ensure HTTPS connection (required for camera access)
- Verify no other applications are using the camera
- Check browser console for error messages

### Camera Not Closing
- Verify `onClose` handler is provided
- Check for proper component unmounting
- Monitor console for cleanup messages
- Ensure no memory leaks in parent components

### Performance Issues
- Camera resources are automatically cleaned up
- Retry logic prevents infinite loops
- Timeouts prevent hanging operations
- State management prevents unnecessary re-renders

## Testing

To verify camera management is working properly:

1. Open the scanner and check console for initialization messages
2. Close the scanner and verify cleanup messages appear
3. Test on different browsers (Chrome, Firefox, Safari)
4. Test on mobile devices
5. Verify camera permissions work correctly
6. Check that camera is released when switching between apps
