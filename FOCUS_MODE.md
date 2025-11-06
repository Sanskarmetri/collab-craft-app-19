# Focus Mode Implementation - Phase 6

## Overview

The Focus Mode feature provides distraction-blocking capabilities across web and mobile platforms to help UPSC aspirants maintain study discipline.

## Web/PWA Implementation

### Features Implemented

1. **Working Timer System**
   - Accurate countdown with pause/resume
   - Preset durations (25, 45, 60 minutes)
   - Visual progress tracking
   - Real-time focus time calculation

2. **Session Management**
   - Subject and topic tracking
   - Automatic session persistence to Supabase
   - Integration with analytics and streak tracking
   - Session history and notes

3. **Break Handling with Friction**
   - 5 and 10-minute break options
   - Two-step confirmation required
   - 15-second countdown before break starts
   - Prevents impulsive breaks

4. **Hard-to-Exit Flow**
   - Exit attempt logging
   - 15-second countdown before session cancellation
   - Warning about streak impact
   - Visual feedback on exit attempts

5. **Telemetry & Analytics**
   - Focus time tracking
   - Session completion metrics
   - Exit attempt logging
   - Daily statistics display

### Browser Extension (Chrome/Edge)

Located in `/extension` directory:

#### Files Structure
- `manifest.json` - Extension configuration (Manifest V3)
- `background.js` - Service worker for site blocking logic
- `content.js` - Content script for page-level blocking
- `popup.html/js` - Extension popup UI
- `blocked.html` - Page shown when sites are blocked

#### Features
- Blocks distracting websites during focus sessions
- Communicates with PWA via postMessage
- Configurable blocked sites list
- Full-page overlay with motivational messaging
- Prevents back navigation from blocked sites

#### Default Blocked Sites
- facebook.com
- twitter.com
- instagram.com
- youtube.com
- reddit.com
- netflix.com
- tiktok.com

#### Installation (Development)
1. Open Chrome/Edge and go to `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `/extension` directory
5. Extension will activate during focus sessions

#### Extension-PWA Communication
The PWA sends messages to the extension:
```javascript
window.postMessage({ type: 'FOCUS_START', sessionId: '...' }, '*');
window.postMessage({ type: 'FOCUS_END' }, '*');
```

## Mobile Implementation Considerations

### Android

**Recommended Approach:**
1. Use Android's Digital Wellbeing API where available
2. Implement App Usage Stats for tracking
3. Use Accessibility Service for overlay blocking (requires user permission)
4. Guided Access mode for full-screen lock

**Limitations:**
- Full app blocking requires DeviceOwner mode (not feasible for regular apps)
- Play Store policies restrict aggressive blocking methods
- Users must manually grant accessibility permissions

**Implementation Strategy:**
```kotlin
// Pseudocode for Android
class FocusModeService {
  fun startFocusMode(duration: Int) {
    // Show full-screen overlay
    // Monitor app usage
    // Show warnings when distracting apps are accessed
    // Log exit attempts
  }
  
  fun blockApp(packageName: String) {
    // Use Accessibility Service to overlay blocking screen
    // Show countdown and confirmation dialogs
  }
}
```

### iOS

**Recommended Approach:**
1. Use Screen Time API (iOS 15+) for basic blocking
2. Integrate with Focus Filters
3. Implement Guided Access instructions
4. Local notifications for reminders

**Limitations:**
- iOS heavily restricts background app blocking
- Screen Time API has limited programmatic control
- Best approach: Guide users to enable Focus Mode manually
- Cannot force-block apps without user configuration

**Implementation Strategy:**
```swift
// Pseudocode for iOS
class FocusModeManager {
  func startFocusMode(duration: Int) {
    // Show full-screen study interface
    // Use local notifications for time tracking
    // Provide instructions to enable iOS Focus Mode
    // Track session manually
  }
  
  func suggestFocusConfiguration() {
    // Deep link to iOS Settings > Focus
    // Show tutorial for setting up custom Focus Mode
  }
}
```

## Privacy & Permissions

### Web Extension
- **Required:** `storage`, `tabs`, `webNavigation`
- **Justification:** Blocking distracting sites, tracking focus mode state
- **Data:** All processing happens locally, no data sent to servers

### Android (Proposed)
- **Required:** Accessibility Service, Usage Stats
- **Justification:** Overlay blocking, app usage monitoring
- **Data:** Local only, no sensitive data collection

### iOS (Proposed)
- **Required:** Notifications
- **Justification:** Timer reminders
- **Data:** No app blocking data collected

## Testing Instructions

### Web/PWA Testing
1. Go to `/focus` page
2. Enter subject and topic
3. Select duration and click "Start Focus Session"
4. Verify timer counts down correctly
5. Test pause/resume functionality
6. Try requesting a break - confirm 15s countdown works
7. Try ending session early - verify warning and countdown
8. Check that session appears in analytics
9. Install browser extension and verify sites are blocked

### Extension Testing
1. Load extension in developer mode
2. Start a focus session in PWA
3. Try visiting facebook.com or youtube.com
4. Verify blocked page appears
5. End focus session in PWA
6. Verify sites become accessible again

## Known Limitations

1. **Web Extension:** Only works in Chrome/Edge browsers
2. **Mobile:** Native mobile apps not yet implemented
3. **iOS Blocking:** Very limited due to OS restrictions
4. **Android Blocking:** Requires user to grant accessibility permissions
5. **Cross-Device:** Focus mode doesn't sync between devices in real-time

## Future Enhancements

1. **Mobile Apps:** Build native Android/iOS apps with Capacitor
2. **Smart Blocking:** AI-based distraction prediction
3. **Pomodoro Integration:** Built-in break timers
4. **Focus Zones:** Location-based automatic focus mode
5. **Social Features:** Study together rooms with friends
6. **Gamification:** Achievements for focus streaks
7. **Advanced Analytics:** Focus quality scoring

## Security Considerations

1. All session data protected by RLS policies
2. Extension uses minimal permissions
3. No tracking or data collection beyond study metrics
4. Transparent logging of exit attempts
5. User can view all telemetry data

## Acceptance Criteria - Phase 6 ✅

- [x] Focus sessions track focus_time accurately
- [x] Break handling requires confirmation with 15s countdown
- [x] Exit attempts logged with warnings
- [x] Chrome extension blocks distracting sites
- [x] Session data persisted to Supabase
- [x] Analytics integration working
- [x] UI flows complete for start/stop/break
- [x] Permissions explained in extension
- [x] Mobile limitations documented
- [ ] Native mobile apps (future work)

## Support

For issues or questions about Focus Mode:
1. Check browser console for errors
2. Verify Supabase connection is working
3. Ensure browser extension is properly installed
4. Review session data in database

## References

- [Chrome Extension Manifest V3](https://developer.chrome.com/docs/extensions/mv3/)
- [Android Digital Wellbeing API](https://developer.android.com/about/versions/pie/android-9.0#digital-wellbeing)
- [iOS Screen Time API](https://developer.apple.com/documentation/deviceactivity)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
