# Mneme - Complete Implementation Plan

## Core Concept
A **personal note-taking app** using a familiar instant messaging UI. Users talk to themselves to quickly capture ideas, notes, and thoughts. The chat interface is intuitive because everyone knows how to send a message.

---

## Table of Contents
1. [Auth & User System](#1-auth--user-system)
2. [Database Schemas](#2-database-schemas)
3. [API Endpoints](#3-api-endpoints)
4. [Home Screen - Note List](#4-home-screen---note-list)
5. [Chat Screen - Notes View](#5-chat-screen---notes-view)
6. [Message Input & Attachments](#6-message-input--attachments)
7. [Voice Notes](#7-voice-notes)
8. [Task System & Reminders](#8-task-system--reminders)
9. [Message Locking](#9-message-locking)
10. [Search](#10-search)
11. [Chat Sharing](#11-chat-sharing)
12. [Export](#12-export)
13. [Settings & Profile](#13-settings--profile)
14. [QR Code Web Sync](#14-qr-code-web-sync)
15. [File Structure](#15-file-structure)
16. [Dependencies](#16-dependencies)

---

## 1. Auth & User System

### Strategy
- **Device-based authentication** - auto-register on first app launch
- Generate unique device ID, store in AsyncStorage
- Send device ID in `X-Device-ID` header with every request
- No login screen required for personal use

### Optional Profile Fields (for sharing)
All optional, user adds when they want to share:
- `username` - unique, searchable
- `email` - for sharing via email
- `phone` - for sharing via phone number
- `name` - display name
- `avatar` - profile picture URL

### Device Registration Flow
```
1. App launches
2. Check AsyncStorage for deviceId
3. If not found:
   - Generate UUID
   - POST /api/auth/register { deviceId }
   - Store deviceId in AsyncStorage
4. All subsequent requests include X-Device-ID header
```

### Backend Middleware (`server/middleware/auth.js`)
```javascript
- Extract X-Device-ID from header
- Find or reject user by deviceId
- Attach user to req.user
- Return 401 if no valid device ID
```

---

## 2. Database Schemas

### User Schema (`server/models/User.js`)
```javascript
{
  deviceId: { type: String, required: true, unique: true, index: true },
  name: { type: String, default: 'Me' },
  username: { type: String, unique: true, sparse: true, lowercase: true },
  email: { type: String, unique: true, sparse: true, lowercase: true },
  phone: { type: String, unique: true, sparse: true },
  avatar: { type: String }, // URL to uploaded image
  settings: {
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    notifications: {
      taskReminders: { type: Boolean, default: true },
      sharedMessages: { type: Boolean, default: false }
    },
    privacy: {
      visibility: { type: String, enum: ['public', 'private', 'contacts'], default: 'contacts' }
    }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

### Chat Schema (`server/models/Chat.js`)
```javascript
{
  name: { type: String, required: true },
  icon: { type: String }, // emoji or image URL
  ownerId: { type: ObjectId, ref: 'User', required: true, index: true },
  participants: [{ type: ObjectId, ref: 'User' }], // for shared chats
  isShared: { type: Boolean, default: false },
  isPinned: { type: Boolean, default: false },
  wallpaper: { type: String }, // custom background
  lastMessage: {
    content: String,
    type: { type: String, enum: ['text', 'image', 'voice', 'file', 'location'] },
    timestamp: Date
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}

// Indexes
{ ownerId: 1, isPinned: -1, updatedAt: -1 }
{ participants: 1 }
```

### Message Schema (`server/models/Message.js`)
```javascript
{
  chatId: { type: ObjectId, ref: 'Chat', required: true, index: true },
  senderId: { type: ObjectId, ref: 'User', required: true },

  // Content
  content: { type: String }, // text content
  type: {
    type: String,
    enum: ['text', 'image', 'voice', 'file', 'location'],
    default: 'text'
  },

  // Attachments
  attachment: {
    url: String,           // file URL
    filename: String,      // original filename
    mimeType: String,      // file type
    size: Number,          // bytes
    duration: Number,      // for voice/video in seconds
    thumbnail: String,     // for images/videos
    width: Number,         // for images
    height: Number         // for images
  },

  // Location (for location messages)
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },

  // States
  isLocked: { type: Boolean, default: false },
  isEdited: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false }, // soft delete

  // Task
  task: {
    isTask: { type: Boolean, default: false },
    reminderAt: Date,
    isCompleted: { type: Boolean, default: false },
    completedAt: Date
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}

// Indexes
{ chatId: 1, createdAt: -1 }
{ chatId: 1, isLocked: 1 }
{ 'task.isTask': 1, 'task.reminderAt': 1, 'task.isCompleted': 1 }
{ senderId: 1 }
{ content: 'text' } // text search index
```

### SharedChat Schema (`server/models/SharedChat.js`)
```javascript
{
  chatId: { type: ObjectId, ref: 'Chat', required: true },
  sharedBy: { type: ObjectId, ref: 'User', required: true },
  sharedWith: { type: ObjectId, ref: 'User', required: true },
  permissions: {
    canEdit: { type: Boolean, default: false },
    canDelete: { type: Boolean, default: false }
  },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
}
```

---

## 3. API Endpoints

### Auth Routes (`/api/auth`)
```
POST   /register
       Body: { deviceId }
       Response: { user, isNew }

GET    /me
       Response: { user }

PUT    /me
       Body: { name?, username?, email?, phone?, avatar?, settings? }
       Response: { user }

POST   /me/avatar
       Body: multipart/form-data with image
       Response: { avatarUrl }

DELETE /me
       Deletes account and all data
```

### Chat Routes (`/api/chats`)
```
GET    /
       Query: { search?, filter?: 'all'|'tasks'|'pinned', page?, limit? }
       Response: { chats[], total, page, hasMore }

POST   /
       Body: { name, icon? }
       Response: { chat }

GET    /:id
       Response: { chat }

PUT    /:id
       Body: { name?, icon?, isPinned?, wallpaper? }
       Response: { chat }

DELETE /:id
       - Deletes chat
       - Preserves locked messages (moves to "Locked Notes" system chat)
       Response: { success, lockedMessagesCount }

GET    /:id/media
       Query: { type?: 'images'|'files'|'links'|'voice', page?, limit? }
       Response: { media[], total }

POST   /:id/shortcut
       Creates home screen shortcut (returns deep link)
       Response: { shortcutUrl }
```

### Message Routes (`/api/chats/:chatId/messages`)
```
GET    /
       Query: { before?, after?, limit? }
       Response: { messages[], hasMore }

POST   /
       Body: { content?, type, attachment? }
       For file upload: multipart/form-data
       Response: { message }

GET    /:id
       Response: { message }

PUT    /:id
       Body: { content }
       Response: { message }

DELETE /:id
       Soft delete (unless locked)
       Response: { success }

PUT    /:id/lock
       Body: { isLocked }
       Response: { message }

PUT    /:id/task
       Body: { isTask, reminderAt? }
       Response: { message }

PUT    /:id/task/complete
       Response: { message }
```

### Task Routes (`/api/tasks`)
```
GET    /
       Query: { filter?: 'pending'|'completed'|'overdue', chatId?, page?, limit? }
       Response: { tasks[], total }

GET    /upcoming
       Query: { days?: 7 }
       Response: { tasks[] }
```

### Search Routes (`/api/search`)
```
GET    /
       Query: { q, type?: 'all'|'chats'|'messages', page?, limit? }
       Response: { results: { chats[], messages[] }, total }

GET    /chat/:chatId
       Query: { q, page?, limit? }
       Response: { messages[], total }
```

### Share Routes (`/api/share`)
```
POST   /lookup
       Body: { query } // username, email, or phone
       Response: { user: { id, name, avatar } | null }

POST   /chat/:chatId
       Body: { userId, permissions? }
       Response: { sharedChat }

GET    /pending
       Response: { pendingShares[] }

PUT    /accept/:shareId
       Response: { sharedChat }

PUT    /reject/:shareId
       Response: { success }

DELETE /chat/:chatId/user/:userId
       Removes user from shared chat
```

### Export Routes (`/api/export`)
```
GET    /chat/:chatId
       Query: { format?: 'txt'|'json' }
       Response: File download

GET    /chat/:chatId/media
       Response: ZIP file with all media
```

### Upload Routes (`/api/upload`)
```
POST   /image
       Body: multipart/form-data
       Response: { url, thumbnail, width, height }

POST   /file
       Body: multipart/form-data
       Response: { url, filename, mimeType, size }

POST   /voice
       Body: multipart/form-data
       Response: { url, duration }
```

---

## 4. Home Screen - Note List

### Layout Structure
```
SafeAreaView
├── Header
│   ├── Title: "Mneme"
│   ├── QR Scan Button (left)
│   └── Settings Button (right)
├── SearchBar
│   └── TextInput with search icon
├── FilterChips
│   ├── "All" (default, selected)
│   └── "Tasks"
├── ChatList (FlatList)
│   └── NoteListItem (repeating)
└── FloatingActionButton (+)
```

### Header Component (`components/Header.tsx`)
```typescript
Props:
- title: string
- leftIcon?: { name, onPress }
- rightIcon?: { name, onPress }
- showSearch?: boolean
- onSearchChange?: (text) => void
```

### SearchBar Component (`components/SearchBar.tsx`)
```typescript
Props:
- value: string
- onChangeText: (text) => void
- placeholder?: string
- autoFocus?: boolean

Features:
- Search icon on left
- Clear button when text present
- Debounced search (300ms)
```

### FilterChips Component (`components/FilterChips.tsx`)
```typescript
Props:
- options: { key, label }[]
- selected: string
- onSelect: (key) => void

Styling:
- Horizontal scroll if many options
- Selected chip: filled blue background
- Unselected: outline style
```

### NoteListItem Component (`components/NoteListItem.tsx`)
```typescript
Props:
- chat: Chat
- onPress: () => void
- onLongPress: () => void

Layout:
├── Avatar/Icon (left)
│   └── Chat icon or first letter
├── Content (middle, flex: 1)
│   ├── Row: Name + Timestamp
│   │   ├── Chat name (bold)
│   │   └── Relative time (gray, right)
│   └── Last message preview (gray, 1 line)
└── Indicators (right)
    ├── Pin icon (if pinned)
    └── Task count badge (if has tasks)

Long Press Actions:
- Delete
- Pin/Unpin
- Export
- Add Shortcut
```

### FloatingActionButton (`components/FAB.tsx`)
```typescript
Props:
- icon: string
- onPress: () => void
- color?: string

Positioning:
- Bottom right, 16px margin
- 56px diameter
- Shadow elevation
- Blue background
```

### Long Press Action Sheet
When user long-presses a chat, show action sheet with:
1. **Pin/Unpin** - Toggle pin status
2. **Delete** - Confirm dialog, then delete (preserves locked)
3. **Export** - Export as .txt file
4. **Add Shortcut** - Add to device home screen

---

## 5. Chat Screen - Notes View

### Layout Structure
```
SafeAreaView
├── ChatHeader
│   ├── Back Button
│   ├── Chat Icon
│   ├── Chat Name (tappable → Chat Info)
│   ├── Search Button
│   ├── Tasks Button (with count badge)
│   └── Menu Button (3 dots)
├── MessageList (FlatList, inverted)
│   ├── DateSeparator
│   └── NoteBubble (repeating)
└── MessageInput
    ├── Attachment Button
    ├── Camera Button
    ├── TextInput (expandable)
    └── Send/Voice Button
```

### ChatHeader Component (`components/chat/ChatHeader.tsx`)
```typescript
Props:
- chat: Chat
- onBack: () => void
- onChatPress: () => void (opens chat info)
- onSearch: () => void
- onTasks: () => void
- onMenu: () => void
- taskCount?: number

Menu Options:
- Media, Links, and Docs
- Chat Wallpaper
- Add Shortcut
- Export Chat
- Share (if has profile fields set)
```

### DateSeparator Component (`components/message/DateSeparator.tsx`)
```typescript
Props:
- date: Date

Display Logic:
- Today → "Today"
- Yesterday → "Yesterday"
- This week → "Monday", "Tuesday", etc.
- This year → "January 15"
- Older → "January 15, 2024"

Styling:
- Centered text
- Gray background pill
- Margin above and below
```

### NoteBubble Component (`components/message/NoteBubble.tsx`)
```typescript
Props:
- message: Message
- onLongPress: () => void
- onTaskToggle?: () => void

Layout (Text Message):
├── Bubble Container (blue background, rounded)
│   ├── Content Text
│   ├── Row (bottom right)
│   │   ├── Lock Icon (if locked)
│   │   ├── Edited indicator (if edited)
│   │   └── Timestamp
│   └── Task Checkbox (if task, top right)

Layout (Image Message):
├── Image (rounded corners, max 250px wide)
├── Caption (if any)
└── Timestamp overlay

Layout (Voice Message):
├── Play/Pause Button
├── Waveform visualization
├── Duration
└── Timestamp

Layout (File Message):
├── File Icon
├── Filename
├── File size
└── Timestamp

Long Press Actions:
- Edit (text only)
- Delete
- Lock/Unlock
- Make Task / Remove Task
- Copy Text
```

### MessageList Component (`components/message/MessageList.tsx`)
```typescript
Props:
- messages: Message[]
- onLoadMore: () => void
- isLoading: boolean
- chatId: string

Features:
- Inverted FlatList (newest at bottom)
- Infinite scroll (load older on scroll up)
- Date separators inserted automatically
- Scroll to bottom button when scrolled up
- Pull to refresh
```

---

## 6. Message Input & Attachments

### MessageInput Component (`components/message/MessageInput.tsx`)
```typescript
Props:
- onSend: (message: { content?, type, attachment? }) => void
- onAttachment: () => void
- onCamera: () => void
- onVoiceStart: () => void
- onVoiceEnd: (uri: string) => void
- editingMessage?: Message
- onCancelEdit?: () => void

Layout:
├── Row
│   ├── Attachment Button (paperclip icon)
│   ├── Camera Button (camera icon)
│   ├── TextInput Container (flex: 1)
│   │   ├── TextInput (multiline, auto-expand)
│   │   └── Emoji button (optional)
│   └── Send/Voice Button
│       └── Send icon when text present
│       └── Mic icon when empty

Behavior:
- TextInput expands up to 5 lines
- Send button appears when text or attachment ready
- Mic button for voice recording when empty
- Edit mode: show original text, "Editing" indicator, cancel button
```

### Attachment Picker
When attachment button pressed:
```
Action Sheet:
├── Photo Library → expo-image-picker (multiple selection)
├── Document → expo-document-picker
├── Location → expo-location + map picker
└── Cancel
```

### Camera
When camera button pressed:
```
expo-image-picker with camera
- Photo mode
- Option to switch to video (future)
- Preview before sending
```

### File Upload Flow
```
1. User selects file
2. Show upload progress indicator
3. Upload to /api/upload/{type}
4. Get URL back
5. Send message with attachment URL
```

---

## 7. Voice Notes

### Voice Recording Component (`components/message/VoiceRecorder.tsx`)
```typescript
State:
- isRecording: boolean
- duration: number (seconds)
- waveformData: number[] (amplitude samples)

UI States:

Idle (mic button):
- Mic icon
- "Hold to record" tooltip on first use

Recording (holding):
├── Red recording indicator
├── Duration timer (0:00)
├── Waveform visualization (real-time)
├── Slide left to cancel indicator
└── Release to send

Cancel (slide left while holding):
- "Release to cancel" indicator
- Trash icon
```

### Voice Playback Component (`components/message/VoicePlayer.tsx`)
```typescript
Props:
- uri: string
- duration: number

UI:
├── Play/Pause Button (circle)
├── Progress Bar (seekable)
├── Current Time / Duration
└── Playback speed button (1x, 1.5x, 2x)

Features:
- Background audio playback
- Continue playing when scrolling
- Stop other audio when new one plays
```

### Implementation Details
```
Recording (expo-av):
- Audio.Recording with high quality preset
- Sample amplitude for waveform every 100ms
- Save as m4a format
- Upload to /api/upload/voice

Playback (expo-av):
- Audio.Sound for playback
- Track progress for seek bar
- Handle interruptions (calls, other audio)
```

---

## 8. Task System & Reminders

### Task Creation Flow
```
1. Long press message → "Make Task"
2. Show date/time picker modal
3. Options:
   - Date picker
   - Time picker
   - Quick options: "Today", "Tomorrow", "Next Week"
4. Save → Update message with task data
5. Schedule local notification
```

### TaskPicker Modal (`components/task/TaskPicker.tsx`)
```typescript
Props:
- visible: boolean
- onClose: () => void
- onSave: (date: Date) => void
- initialDate?: Date

Layout:
├── Header: "Set Reminder"
├── Quick Options Row
│   ├── Today
│   ├── Tomorrow
│   └── Next Week
├── Date Picker
├── Time Picker
├── Preview: "Reminder set for Jan 15 at 3:00 PM"
└── Buttons: Cancel | Save
```

### Task List Screen (`app/tasks.tsx`)
```
Accessible from:
- Filter chip "Tasks" on home
- Chat header tasks button

Layout:
├── Header: "Tasks"
├── Filter: Pending | Completed | All
├── TaskList (FlatList)
│   └── TaskItem
│       ├── Checkbox
│       ├── Message preview
│       ├── Chat name (gray)
│       ├── Reminder time
│       └── Tap → Navigate to message in chat
```

### Notifications (expo-notifications)
```
Setup:
1. Request permissions on first task creation
2. Register for push notifications
3. Store expo push token (for future server-side notifications)

Local Notification:
- Title: "Mneme Reminder"
- Body: Message content (truncated)
- Data: { chatId, messageId }
- Schedule at reminderAt time

On Notification Tap:
- Open app
- Navigate to chat
- Scroll to message
- Highlight message briefly
```

### Task Badge
- Show task count on chat header button
- Show overdue indicator (red) if past reminder time

---

## 9. Message Locking

### Lock/Unlock Flow
```
1. Long press message → "Lock" / "Unlock"
2. Locked messages show lock icon
3. Locked messages cannot be deleted
4. When chat is deleted:
   - All unlocked messages deleted
   - Locked messages moved to "Locked Notes" system chat
   - Show toast: "X locked messages preserved"
```

### Locked Notes System Chat
```
- Auto-created if doesn't exist
- Cannot be deleted
- Cannot be renamed
- Shows all locked messages from deleted chats
- Each message shows original chat name as label
```

### Backend Logic
```javascript
// DELETE /api/chats/:id
async function deleteChat(chatId, userId) {
  const lockedMessages = await Message.find({ chatId, isLocked: true });

  if (lockedMessages.length > 0) {
    const lockedChat = await getOrCreateLockedNotesChat(userId);
    await Message.updateMany(
      { chatId, isLocked: true },
      { chatId: lockedChat._id, originalChatName: chat.name }
    );
  }

  await Message.deleteMany({ chatId, isLocked: false });
  await Chat.findByIdAndDelete(chatId);

  return { lockedMessagesCount: lockedMessages.length };
}
```

---

## 10. Search

### Global Search (Home Screen)
```
Search Bar Input → Debounced API call → Results

Results Display:
├── Chats Section (if matches)
│   └── Chat names matching query
├── Messages Section (if matches)
│   └── Message previews with highlighted matches
│   └── Shows chat name + timestamp
│   └── Tap → Navigate to message

API: GET /api/search?q=query
```

### In-Chat Search
```
Tap search icon in chat header → Expand search bar

Features:
- Search within current chat only
- Highlight matches in message list
- Up/Down arrows to navigate between matches
- Show "X of Y matches"
- Scroll to highlighted message

API: GET /api/search/chat/:chatId?q=query
```

### Search Implementation
```
Backend:
- MongoDB text index on message.content
- Also search chat names
- Return with relevance score
- Paginated results

Frontend:
- Debounce 300ms
- Show loading state
- Cache recent searches
- Clear on focus
```

---

## 11. Chat Sharing

### Prerequisites
User must have at least one of:
- username
- email
- phone

If none set, prompt to add in Settings.

### Share Flow
```
1. Chat menu → "Share"
2. Open Share Screen
3. Enter username/email/phone
4. Lookup user (POST /api/share/lookup)
5. If found, show user card
6. Set permissions (view only / can edit)
7. Send share request
8. Recipient sees in "Shared with me" section
9. Recipient accepts/rejects
```

### Share Screen (`app/share/[chatId].tsx`)
```
Layout:
├── Header: "Share Chat"
├── Search Input (username, email, or phone)
├── User Result Card (if found)
│   ├── Avatar
│   ├── Name
│   └── Username/identifier
├── Permissions Toggle
│   └── "Allow editing"
└── Share Button
```

### Shared Chats Display
On home screen:
```
├── My Notes Section
│   └── User's own chats
├── Shared with Me Section (if any)
│   └── Chats others shared with user
│   └── Shows sharer's name as subtitle
```

### Shared Chat Behavior
- Both users see same messages
- Messages show sender name
- Owner can remove shared user
- Shared user can leave chat
- Permissions determine edit/delete ability

---

## 12. Export

### Export Chat as Text
```
Format:
[Chat Name]
Exported on: January 15, 2024

--- January 14, 2024 ---

[10:30 AM] This is a text message

[10:35 AM] [Image: photo_001.jpg]

[10:40 AM] [Voice: 0:45]

[11:00 AM] [File: document.pdf]

--- January 15, 2024 ---

[9:00 AM] Another message
[LOCKED]

[9:30 AM] Task message
[TASK - Due: Jan 20, 2024 at 3:00 PM]
```

### Export Flow
```
1. Chat menu → "Export"
2. Options:
   - Text only (.txt)
   - Include media (creates .zip)
3. Generate file
4. Open share sheet (AirDrop, Save to Files, etc.)
```

### Export API
```
GET /api/export/chat/:chatId?format=txt
→ Returns text file

GET /api/export/chat/:chatId?format=zip
→ Returns zip with txt + media folder
```

---

## 13. Settings & Profile

### Settings Screen (`app/settings/index.tsx`)
```
Layout:
├── Profile Section (tappable → Profile screen)
│   ├── Avatar (large)
│   ├── Name
│   └── Username/email/phone (if set)
├── Account Section
│   ├── Edit Profile →
│   └── Privacy →
├── App Section
│   ├── Notifications →
│   ├── Theme (Light/Dark/System)
│   └── Storage & Data →
├── About Section
│   ├── Help →
│   └── About Mneme →
└── Danger Zone
    └── Delete Account (red)
```

### Profile Screen (`app/settings/profile.tsx`)
```
Layout:
├── Avatar (tappable to change)
├── Name Input
├── Username Input (optional)
│   └── Availability check
├── Email Input (optional)
├── Phone Input (optional)
└── Save Button
```

### Privacy Screen (`app/settings/privacy.tsx`)
```
Options:
├── Who can find me:
│   ├── Everyone (Public)
│   ├── No one (Private)
│   └── Contacts only (default)
```

### Notifications Screen (`app/settings/notifications.tsx`)
```
Options:
├── Task Reminders: Toggle (default: on)
├── Shared Chat Messages: Toggle (default: off)
```

---

## 14. QR Code Web Sync

### Concept
Scan QR code on web browser to access notes on desktop.

### Flow
```
1. User opens web.mneme.app
2. Web shows QR code with session ID
3. User taps QR icon in app
4. Camera opens, scans QR
5. App sends session ID to server
6. Server links session to user
7. Web receives confirmation, loads user's notes
8. Real-time sync via WebSocket
```

### QR Scanner Screen (`app/qr-scan.tsx`)
```
Layout:
├── Camera View (full screen)
├── QR Frame Overlay (centered square)
├── Instructions: "Scan QR code on web.mneme.app"
└── Close Button
```

### Web Client (Future)
```
- React web app
- Same UI as mobile (responsive)
- Real-time sync with WebSocket
- Session expires after 24h or logout
```

### WebSocket Events
```
Server → Client:
- chat:created
- chat:updated
- chat:deleted
- message:created
- message:updated
- message:deleted

Client → Server:
- subscribe:chat
- unsubscribe:chat
```

---

## 15. File Structure

### Frontend
```
app/
├── (tabs)/
│   ├── _layout.tsx           # Tab navigator
│   └── index.tsx             # Home (Note list)
├── chat/
│   ├── [id].tsx              # Chat screen
│   ├── new.tsx               # Create chat
│   └── info/[id].tsx         # Chat info/settings
├── tasks.tsx                 # Tasks list
├── search.tsx                # Search results
├── share/
│   └── [chatId].tsx          # Share chat screen
├── settings/
│   ├── _layout.tsx
│   ├── index.tsx             # Settings home
│   ├── profile.tsx           # Edit profile
│   ├── privacy.tsx           # Privacy settings
│   └── notifications.tsx     # Notification settings
├── qr-scan.tsx               # QR scanner
├── _layout.tsx               # Root layout
└── +not-found.tsx

components/
├── Header.tsx
├── SearchBar.tsx
├── FilterChips.tsx
├── FAB.tsx
├── NoteListItem.tsx
├── chat/
│   ├── ChatHeader.tsx
│   └── ChatInfo.tsx
├── message/
│   ├── MessageList.tsx
│   ├── NoteBubble.tsx
│   ├── MessageInput.tsx
│   ├── DateSeparator.tsx
│   ├── VoiceRecorder.tsx
│   ├── VoicePlayer.tsx
│   ├── ImageMessage.tsx
│   └── FileMessage.tsx
├── task/
│   ├── TaskPicker.tsx
│   ├── TaskItem.tsx
│   └── TaskList.tsx
├── ui/
│   ├── icon-symbol.tsx
│   ├── Avatar.tsx
│   ├── Badge.tsx
│   ├── ActionSheet.tsx
│   └── Modal.tsx
├── themed-text.tsx
└── themed-view.tsx

hooks/
├── useChats.ts
├── useMessages.ts
├── useUser.ts
├── useTasks.ts
├── useSearch.ts
└── useApi.ts

services/
├── api.ts                    # Axios client
├── storage.ts                # AsyncStorage helpers
├── notifications.ts          # Notification helpers
└── upload.ts                 # File upload helpers

constants/
└── theme.ts                  # Colors, fonts

types/
└── index.ts                  # TypeScript interfaces
```

### Backend
```
server/
├── index.js                  # Express app entry
├── config/
│   └── db.js                 # MongoDB connection
├── models/
│   ├── User.js
│   ├── Chat.js
│   ├── Message.js
│   └── SharedChat.js
├── routes/
│   ├── auth.js
│   ├── chats.js
│   ├── messages.js
│   ├── tasks.js
│   ├── search.js
│   ├── share.js
│   ├── export.js
│   └── upload.js
├── middleware/
│   ├── auth.js               # Device auth
│   ├── errorHandler.js       # Error handling
│   └── upload.js             # Multer config
├── services/
│   ├── notification.js       # Push notifications
│   └── export.js             # Export generation
├── utils/
│   └── helpers.js
├── .env
├── .env.example
└── package.json
```

---

## 16. Dependencies

### Frontend (`package.json`)
```json
{
  "dependencies": {
    // Existing Expo deps...

    // Data fetching
    "@tanstack/react-query": "^5.60.0",
    "axios": "^1.7.0",

    // Storage
    "@react-native-async-storage/async-storage": "^1.23.0",

    // Media
    "expo-image-picker": "~16.0.0",
    "expo-document-picker": "~13.0.0",
    "expo-av": "~15.0.0",
    "expo-camera": "~16.0.0",

    // Location
    "expo-location": "~18.0.0",

    // Notifications
    "expo-notifications": "~0.29.0",

    // File system
    "expo-file-system": "~18.0.0",
    "expo-sharing": "~13.0.0",

    // Utilities
    "date-fns": "^3.6.0",
    "uuid": "^10.0.0",

    // UI
    "react-native-gesture-handler": "~2.20.0",
    "@gorhom/bottom-sheet": "^4.6.0"
  }
}
```

### Backend (`server/package.json`)
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^8.0.0",
    "cors": "^2.8.5",
    "express-validator": "^7.0.0",
    "multer": "^1.4.5-lts.1",
    "uuid": "^10.0.0",
    "archiver": "^7.0.0",
    "sharp": "^0.33.0"
  }
}
```

---

## Verification Checklist

### Phase 1: Foundation
- [ ] Theme colors updated to blue
- [ ] Navigation structure updated
- [ ] Icon mappings added

### Phase 2: Backend
- [ ] All models created
- [ ] All routes implemented
- [ ] Auth middleware working
- [ ] File uploads working

### Phase 3: Home Screen
- [ ] Chat list displays
- [ ] Search works
- [ ] Filter chips work
- [ ] Create new chat works
- [ ] Long press actions work

### Phase 4: Chat Screen
- [ ] Messages display with dates
- [ ] Send text messages
- [ ] Edit messages
- [ ] Delete messages
- [ ] Infinite scroll works

### Phase 5: Attachments
- [ ] Image picker works
- [ ] File picker works
- [ ] Camera works
- [ ] Uploads work
- [ ] Display in chat works

### Phase 6: Voice Notes
- [ ] Recording works
- [ ] Playback works
- [ ] Waveform displays

### Phase 7: Tasks
- [ ] Create task from message
- [ ] Task picker modal
- [ ] Notifications scheduled
- [ ] Task list screen
- [ ] Complete task

### Phase 8: Locking
- [ ] Lock/unlock works
- [ ] Locked messages preserved on delete
- [ ] Locked Notes chat works

### Phase 9: Search
- [ ] Global search works
- [ ] In-chat search works
- [ ] Navigate to result works

### Phase 10: Sharing
- [ ] User lookup works
- [ ] Share request works
- [ ] Accept/reject works
- [ ] Shared chat displays

### Phase 11: Export
- [ ] Text export works
- [ ] Media export works

### Phase 12: Settings
- [ ] Profile editing works
- [ ] Privacy settings work
- [ ] Notifications settings work

### Phase 13: QR Sync
- [ ] QR scanner works
- [ ] Web session links
- [ ] Real-time sync works
