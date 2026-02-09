# LaterBox Share Feature - Design Document

## Overview

This document describes the user flows and design for LaterBox's share functionality, allowing users to share content from any app directly into LaterBox threads.

---

## Core User Flows

### Flow 1: Share from Another App (iOS Share Sheet / Android Sharesheet)

**Trigger:** User taps "Share" in any app (Safari, Photos, Messages, etc.)

**Steps:**
1. User selects "LaterBox" from the system share sheet
2. LaterBox share extension opens (iOS) OR LaterBox activity appears (Android)
3. System passes shared content to LaterBox
4. LaterBox shows share preview with thread picker
5. User selects existing thread OR creates new thread
6. User optionally adds caption
7. User taps "Share"
8. Content saved to thread, share sheet closes

**Success Criteria:**
- Share sheet closes automatically after successful share
- User redirected to the thread where content was saved
- Content appears in thread immediately

---

### Flow 2: Share URL from Browser

**Trigger:** User shares a URL from Safari/Chrome

**Steps:**
1. User taps share icon in browser
2. Selects "LaterBox"
3. LaterBox receives URL
4. System fetches URL preview (Open Graph metadata)
5. Preview shown with:
   - Page title
   - Description (if available)
   - Thumbnail image (if available)
   - Domain name
6. User selects thread
7. User taps "Share"
8. Link saved to thread with preview

**Success Criteria:**
- URL preview loads within 3 seconds
- Fallback to plain URL if preview fails
- Link is clickable from within thread

---

### Flow 3: Share Location from Maps

**Trigger:** User shares location from Apple Maps / Google Maps

**Steps:**
1. User opens Maps, selects a location
2. Taps share icon
3. Selects "LaterBox"
4. LaterBox receives location data
5. System fetches static map thumbnail
6. Preview shown with:
   - Mini map thumbnail with pin
   - Address (reverse geocoded)
7. User selects thread
8. User taps "Share"
9. Location saved to thread

**Success Criteria:**
- Map thumbnail displays correctly
- Tapping location opens full map in Maps app
- Address is readable and accurate

---

### Flow 4: Share Image/Video

**Trigger:** User shares media from Photos, Files, or any app

**Steps:**
1. User selects image/video
2. Taps share icon
3. Selects "LaterBox"
4. LaterBox receives media file
5. Preview shown with thumbnail
6. User selects thread
7. User taps "Share"
8. Media copied to LaterBox storage
9. Media saved as attachment in thread

**Success Criteria:**
- Large files (>50MB) show progress indicator
- HEIC images convert automatically
- Videos under 5 minutes supported
- Thumbnails generate quickly

---

### Flow 5: Share Text

**Trigger:** User shares selected text from any app

**Steps:**
1. User selects text
2. Taps share icon
3. Selects "LaterBox"
4. LaterBox receives text
5. Preview shown with text content
6. User selects thread
7. User optionally edits/expands text
8. User taps "Share"
9. Text saved as note in thread

**Success Criteria:**
- Plain text preserved exactly
- Formatting (bold, italic) NOT preserved - this is intentional
- Long text truncates in preview, full text saved

---

### Flow 6: Share Contact (vCard)

**Trigger:** User shares contact from Contacts app

**Steps:**
1. User opens contact
2. Taps share icon
3. Selects "LaterBox"
4. LaterBox receives vCard data
5. Preview shown with:
   - Contact name
   - Phone number (if available)
   - Email (if available)
6. User selects thread
7. User taps "Share"
8. Contact saved to thread

**Success Criteria:**
- Contact card displays key info
- Contact is tappable to call/email/navigate

---

## Share Destination Selection

### Option A: Recent Threads

```
┌─────────────────────────────────────┐
│  Share to LaterBox                  │
├─────────────────────────────────────┤
│  🔍 Search threads...               │
├─────────────────────────────────────┤
│  ○ #general                         │
│  ● #work-projects      ◉ Pinned    │
│  ○ #personal-ideas                   │
│  ○ #recipes                         │
├─────────────────────────────────────┤
│  + Create new thread                │
└─────────────────────────────────────┘
```

- Shows 4-6 most recent threads
- Pinned threads prioritized
- Currently selected thread shows checkmark

### Option B: Create New Thread

```
┌─────────────────────────────────────┐
│  Create New Thread                  │
├─────────────────────────────────────┤
│  [ #  Thread Name                   │
│     (optional emoji)                ]│
├─────────────────────────────────────┤
│  [Cancel]          [Create & Share] │
└─────────────────────────────────────┘
```

---

## Preview UI Design

### Text Preview

```
┌─────────────────────────────────────┐
│  📝 Text Preview                   │
├─────────────────────────────────────┤
│  This is the text that will be     │
│  shared. It shows a preview of     │
│  the content here.                  │
├─────────────────────────────────────┤
│  Shared from: Safari               │
└─────────────────────────────────────┘
```

### URL Preview

```
┌─────────────────────────────────────┐
│  🔗 https://example.com/article    │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐   │
│  │ [ OG Image Preview       ]│   │
│  │      (120x120px)          │   │
│  └─────────────────────────────┘   │
│                                     │
│  Page Title Here                    │
│  Description of the page...         │
│  example.com                        │
├─────────────────────────────────────┤
│  [View Link]  [Open in Browser]    │
└─────────────────────────────────────┘
```

### Location Preview

```
┌─────────────────────────────────────┐
│  📍 123 Main St, San Francisco     │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  │    [Static Map Thumbnail]  │   │
│  │         with pin 📍        │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
├─────────────────────────────────────┤
│  [Open in Maps]                     │
└─────────────────────────────────────┘
```

### Media Preview

```
┌─────────────────────────────────────┐
│  🖼️ 2 images selected             │
├─────────────────────────────────────┤
│  ┌───┐ ┌───┐ ┌───┐               │
│  │ img│ │ img│ │ img│             │
│  └───┘ └───┘ └───┘               │
│                                     │
│  📄 document.pdf (2.4 MB)           │
├─────────────────────────────────────┤
│  [Remove]                           │
└─────────────────────────────────────┘
```

---

## Data Types Supported

| Type | Source | Preview | Notes |
|------|--------|---------|-------|
| Plain Text | Any app | Full text | No formatting preserved |
| URL | Safari, Chrome, any | OG preview + favicon | Auto-fetches metadata |
| Selected Text | Safari, Chrome | Text + source URL | Attribution included |
| Image | Photos, Files, Safari | Thumbnail | Copied to app storage |
| Video | Photos, Files | Thumbnail + duration | Max 5 min |
| Audio | Files | Filename + size | Max 100MB |
| Document | Files, Mail | Filename + size | Any type, max 100MB |
| Location | Maps app | Static map + address | Auto-reverse geocoded |
| Contact | Contacts app | Name + info card | vCard format |

---

## Edge Cases

### 1. No Thread Selected

- Show error toast: "Please select a thread"
- Keep share sheet open
- Don't dismiss

### 2. Share Failed

- Show error message with reason
- Offer retry option
- Don't dismiss share sheet

### 3. Large File Transfer

- Show progress indicator
- Allow cancel
- Timeout after 60 seconds

### 4. No Network (for URL previews)

- Show URL without preview
- Fallback to basic title (domain name)
- Allow share anyway

### 5. Share from Locked/Protected Thread

- Allow share to protected thread
- User must unlock first (if protected notes system exists)
- Show lock icon in thread picker

### 6. Multiple Items

- Allow multiple images/videos
- Show count badge
- All items share to same thread

---

## iOS Share Extension Specifics

### Info.plist Configuration

```xml
<NSExtension>
    <NSExtensionPointIdentifier>com.apple.share-services</NSExtensionPointIdentifier>
    <NSExtensionPrincipalClass>$(PRODUCT_MODULE_NAME).ShareViewController</NSExtensionPrincipalClass>
    <NSExtensionAttributes>
        <NSExtensionActivationRule>
            <NSExtensionActivationSupportsImageFileWithMaxCount>10</NSExtensionActivationSupportsImageFileWithMaxCount>
            <NSExtensionActivationSupportsVideoFileWithMaxCount>10</NSExtensionActivationSupportsVideoFileWithMaxCount>
            <NSExtensionActivationSupportsText>true</NSExtensionActivationSupportsText>
            <NSExtensionActivationSupportsWebURLWithMaxCount>1</NSExtensionActivationSupportsWebURLWithMaxCount>
            <NSExtensionActivationSupportsFileIncludingFlattenedPDFs>true</NSExtensionActivationSupportsFileIncludingFlattenedPDFs>
        </NSExtensionActivationRule>
    </NSExtensionAttributes>
</NSExtension>
```

### App Group Required

- App Group: `group.com.xcore.laterbox.shared`
- Used for sharing data between extension and main app
- Must be configured in Apple Developer portal
- Must be added to both main app and extension targets

---

## Android Intent Configuration

### AndroidManifest.xml

```xml
<activity android:name=".MainActivity">
    <intent-filter>
        <action android:name="android.intent.action.SEND" />
        <category android:name="android.intent.category.DEFAULT" />
        <data android:mimeType="text/plain" />
        <data android:mimeType="text/*" />
        <data android:mimeType="image/*" />
        <data android:mimeType="video/*" />
        <data android:mimeType="*/*" />
    </intent-filter>
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="laterbox" />
    </intent-filter>
    <intent-filter>
        <action android:name="android.intent.action.SEND_MULTIPLE" />
        <category android:name="android.intent.category.DEFAULT" />
        <data android:mimeType="image/*" />
        <data android:mimeType="video/*" />
    </intent-filter>
</activity>
```

---

## Storage Architecture

### iOS

- **Shared Media:** App Group container (`group.com.xcore.laterbox.shared`)
- **Shared Data:** UserDefaults in App Group
- **Thread List:** Shared via App Group (extension reads thread list)

### Android

- **Shared Media:** App's internal storage
- **Shared Data:** SharedPreferences or Intent extras

---

## Security Considerations

1. **No Sensitive Data in Share Extension** - Don't pass auth tokens
2. **Validate All Input** - Sanitize text, URLs, file paths
3. **Limit File Sizes** - Reject files >100MB
4. **Scan Media for Malware** - Optional, depends on threat model
5. **User Confirmation** - Confirm before sharing to new threads

---

## Performance Targets

| Action | Target Time |
|--------|-------------|
| Share sheet opens | < 500ms |
| URL preview fetched | < 3 seconds |
| Location map loaded | < 2 seconds |
| Image thumbnail generated | < 1 second |
| Share completed | < 5 seconds |

---

## Future Enhancements (Out of Scope for V1)

1. **Quick Share to Recent Thread** - Long-press share icon to quick-share to last thread
2. **Share Templates** - Pre-defined thread templates for specific share types
3. **Batch Share** - Share multiple items to multiple threads
4. **Share from Widget** - Home screen widget for quick note capture
5. **URL Bookmarklet** - Share from desktop browser via bookmarklet
6. **Share via Email** - Email content to laterbox@domain.com
7. **OCR Support** - Extract text from shared images

---

## Testing Checklist

### Manual Testing

- [ ] Share URL from Safari
- [ ] Share URL from Chrome
- [ ] Share selected text from Safari
- [ ] Share image from Photos
- [ ] Share video from Files
- [ ] Share location from Apple Maps
- [ ] Share location from Google Maps
- [ ] Share contact from Contacts
- [ ] Share document from Files
- [ ] Create new thread during share
- [ ] Share to existing thread
- [ ] Cancel share flow
- [ ] Large file transfer (>50MB)
- [ ] No network scenario
- [ ] Multiple items share
- [ ] App in background during share

### Automated Testing

- [ ] Unit tests for URL preview fetching
- [ ] Unit tests for data parsing
- [ ] Integration tests for thread selection
- [ ] E2E tests for complete share flows

---

## Open Questions

1. **Should share extension show thread list or require main app?** Current design shows thread picker in extension for speed.

2. **How to sync thread list to extension?** Need App Group shared storage for thread list.

3. **Should shared content sync immediately?** Yes, if user has sync enabled.

4. **What happens if main app is not installed?** Share extension still works for local storage.

5. **Support share from web?** Could add share buttons to laterbox.app web interface that deep link to mobile app.
