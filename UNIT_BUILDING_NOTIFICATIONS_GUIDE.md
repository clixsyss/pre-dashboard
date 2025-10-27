# Unit & Building Notification & Suspension System

## Overview

Added comprehensive notification and suspension features for managing users at the unit and building level in the PRE Dashboard.

## Features Added

### 1. **Units Tab - Quick Actions** (4 buttons per unit row)

Each unit in the Units tab now has 4 action buttons:

#### Notification Actions:
- **🔔 Notify Unit** (Blue) - Send notification to all users in that specific unit
- **🏢🔔 Notify Building** (Indigo) - Send notification to all users in the entire building

#### Suspension Actions:
- **👤❌ Suspend Unit** (Orange) - Suspend all users in that specific unit
- **🏢❌ Suspend Building** (Red) - Suspend all users in the entire building

### 2. **Notifications Tab - Enhanced Audience Selection**

The Notifications Management page now supports 5 audience types:

1. **👥 All Project Users** - Send to everyone
2. **👤 Specific Users** - Select individual users
3. **🏠 Specific Unit(s)** - NEW! Select one or more units
4. **🏢 Entire Building(s)** - NEW! Select one or more buildings  
5. **📢 Topic Subscribers** - Send to topic subscribers

#### Unit Selection Features:
- **🔍 Search Bar**: Instant search by unit ID, building, or unit number
- **Visual Grid**: Beautiful cards showing each unit with user count
- **Grouped by Building**: Units are organized by building for easy browsing
- **Live User Count**: See how many users are in each unit
- **Multi-Select**: Select multiple units at once
- **Select All/Clear All**: Quick selection buttons
- **Selected Units Display**: See all selected units with user counts as chips
- **Total Recipients**: Real-time count of unique recipients
- **Smart Filtering**: Shows "No units match" when search has no results

#### Building Selection Features:
- **🔍 Search Bar**: Instant search by building number
- **Building Cards**: Large, informative cards for each building
- **Rich Analytics**: Shows total users, total units, and occupancy count
- **Visual Feedback**: Selected buildings scale up with gradient background
- **Multi-Select**: Select multiple buildings simultaneously
- **Select All/Clear All**: Quick selection buttons
- **Selected Buildings Display**: See all selected buildings with user counts as chips
- **Total Recipients**: Real-time count of unique recipients across all buildings
- **Smart Filtering**: Shows "No buildings match" when search has no results

#### Specific User Selection (Redesigned):
- **🔍 Enhanced Search Bar**: With clear button and search icon
- **Grid Card Layout**: Beautiful cards instead of list view
- **User Avatars**: Colored circles with user icons
- **Role Badges**: Shows 👑 Owner or 👨‍👩‍👧 Family badges
- **Unit Display**: Shows user's unit with home icon
- **Gradient Highlights**: Selected users have green gradient background
- **Checkmark Badges**: Visual confirmation of selected users
- **Selected Users Chips**: Display at top with unit info
- **Improved Pagination**: Better styled with updated page sizes (6, 12, 24, 50)
- **Total Recipients**: Real-time count with green theme

## Technical Implementation

### Data Structure

**Notification Document** (stored in `projects/{projectId}/notifications`):
```javascript
{
  audience: {
    all: boolean,
    uids: string[],          // Specific user IDs
    units: string[],         // NEW! e.g., ["D1A-1", "D2A-5"]
    buildings: string[],     // NEW! e.g., ["D1A", "D2A"]
    topic: string | null
  }
}
```

### User Matching Logic

**Unit Matching**:
```javascript
// Matches users where user.projects[].unit === "buildingNum-unitNum"
const unitIdentifier = `${buildingNum}-${unitNum}`;
projectUsers.filter(user => 
  user.projects?.some(p => p.projectId === projectId && p.unit === unitIdentifier)
);
```

**Building Matching**:
```javascript
// Matches users where unit starts with buildingNum
projectUsers.filter(user => 
  user.projects?.some(p => {
    if (p.projectId === projectId && p.unit) {
      const [building] = p.unit.split('-');
      return building === String(buildingNum);
    }
    return false;
  })
);
```

### Suspension Data Structure

When users are suspended via unit/building, the suspension is stored in their `projects` array:

```javascript
{
  projects: [
    {
      projectId: "...",
      unit: "D1A-1",
      role: "owner",
      isSuspended: true,
      suspensionReason: "...",
      suspensionType: "temporary" | "permanent",
      suspendedAt: Date,
      suspendedBy: "adminUid",
      suspensionEndDate: Date (if temporary)
    }
  ]
}
```

## User Experience Highlights

### Units Tab Quick Actions:
1. Click any action button on a unit row
2. Modal opens with pre-filled unit/building info
3. Shows exact user count for transparency
4. Easy to send notifications or suspend users
5. Success feedback with counts

### Notifications Tab:
1. Select "🏠 Specific Unit(s)" or "🏢 Entire Building(s)" from dropdown
2. Visual grid appears with clickable cards
3. Click units/buildings to select (scales and highlights)
4. See live recipient count
5. Send notification to all selected
6. No duplicate users (uses Set for unique recipients)

## Benefits

✅ **Efficiency**: Notify/suspend entire buildings or units with one click
✅ **Transparency**: Always shows exact user counts before taking action
✅ **Flexibility**: Can select multiple units or buildings at once
✅ **Safety**: Confirmation dialogs for mass suspensions
✅ **Visual**: Beautiful, intuitive UI with color coding
✅ **Smart**: Automatically deduplicates users across selections
✅ **Organized**: Units grouped by building for easy navigation

## Usage Examples

### Example 1: Notify Building D1A about Maintenance
1. Go to Notifications tab
2. Select "🏢 Entire Building(s)"
3. Click "Building D1A" card
4. See "12 users" will receive notification
5. Write message: "Water maintenance tomorrow 9-11 AM"
6. Send!

### Example 2: Suspend Unit D1A-1
1. Go to Units tab
2. Find unit D1A-1
3. Click "👤❌ Suspend Unit" button
4. Select "Temporary" suspension
5. Choose "7 days"
6. Reason: "Payment overdue"
7. Confirms and suspends all 2 users in that unit

### Example 3: Emergency Notification to Multiple Buildings
1. Go to Notifications tab
2. Select "🏢 Entire Building(s)"
3. Use search bar to find "D1" - shows D1A, D1B
4. Click both buildings
5. See "24 users" total
6. Write urgent message
7. Send to all at once!

### Example 4: Notify Specific Units with Search
1. Go to Notifications tab
2. Select "🏠 Specific Unit(s)"
3. Search for "D2A" - shows all D2A units
4. Select D2A-1, D2A-2, D2A-11
5. See "8 users" total in selected units chips
6. Write notification
7. Send!

### Example 5: Select Users with Grid View
1. Go to Notifications tab
2. Select "👤 Specific Users"
3. Use search bar: "Ahmed" - filters users
4. Click user cards to select (green highlight!)
5. See role badges (👑 Owner / 👨‍👩‍👧 Family)
6. View unit info on each card
7. Total recipients shown at bottom
8. Send notification!

## Notes

- Units must be imported with `buildingNum` and `unitNum` fields
- User units are stored as "buildingNum-unitNum" format in `user.projects[].unit`
- Suspensions are project-specific (stored in user's projects array)
- All modals match the dashboard's color themes (blue, green, purple, red)
- No duplicate notifications (uses Set to ensure unique recipients)
- Search functionality works across all selection types (users, units, buildings)
- Grid layouts are responsive and adapt to screen size
- Clear buttons (X icons) appear in search bars when text is entered
- User selection now shows owner/family roles with emoji badges
- Empty states show appropriate icons and helpful messages

