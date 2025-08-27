# Courts Management System

## Overview
The Courts Management system allows project administrators to manage sports courts and facilities within their specific project. Each project has its own isolated database for courts, ensuring data separation between different projects.

## Features

### 🏟️ Court Management
- **Add New Courts**: Create courts with detailed information
- **Edit Courts**: Modify existing court details
- **Delete Courts**: Remove courts from the system
- **Status Management**: Update court availability status

### 📊 Court Information
Each court includes:
- **Court Name**: Unique identifier for the court
- **Location**: Physical address or location description
- **Price/Rate**: Hourly rate for court usage
- **Capacity**: Maximum number of people the court can accommodate
- **Type**: Indoor or Outdoor classification
- **Sport**: Associated sport (dropdown from available sports)
- **Description**: Optional additional details
- **Status**: Available, Maintenance, or Booked

### 🔍 Search & Filtering
- **Search**: Find courts by name or location
- **Status Filter**: Filter by availability status
- **Type Filter**: Filter by indoor/outdoor type
- **Real-time Results**: Dynamic filtering with instant results

### 🏃 Sports Integration
- **Dynamic Sports List**: Dropdown populated from project's sports collection
- **Sample Sports**: Quick setup with predefined sports (Football, Basketball, Tennis, etc.)
- **Sport Association**: Each court is linked to a specific sport

## Database Structure

### Firestore Collections
```
projects/{projectId}/courts/{courtId}
├── name: string
├── location: string
├── hourlyRate: number
├── capacity: number
├── type: "indoor" | "outdoor"
├── sport: string (reference to sport ID)
├── description: string
├── status: "available" | "maintenance" | "booked"
├── active: boolean
├── createdAt: timestamp
└── updatedAt: timestamp
```

### Security Rules
- Only authenticated users can access project-specific courts
- Users can only access courts within their assigned projects
- Full CRUD operations for project administrators

## Usage

### 1. Access Courts Management
- Navigate to your project dashboard
- Click on the "Courts" tab
- The system will automatically load courts for the current project

### 2. Add Sample Sports (First Time Setup)
- If no sports are available, you'll see a "Quick Setup" section
- Click "Add Sample Sports" to populate with common sports
- This creates: Football, Basketball, Tennis, Volleyball, Badminton, Swimming, Gym, Running Track

### 3. Add a New Court
- Click the "Add Court" button
- Fill in the required fields:
  - Court Name (required)
  - Location (required)
  - Price per Hour (required, numeric)
  - Capacity (required, numeric)
  - Type: Indoor/Outdoor (required)
  - Sport (required, select from dropdown)
  - Description (optional)
- Click "Add Court" to save

### 4. Edit a Court
- Click the edit (pencil) icon on any court row
- Modify the desired fields
- Click "Update Court" to save changes

### 5. Delete a Court
- Click the delete (trash) icon on any court row
- Confirm deletion in the popup dialog

### 6. Update Court Status
- Use the status dropdown in the Status column
- Choose between: Available, Maintenance, or Booked
- Changes are saved automatically

## Technical Implementation

### Components
- **CourtsManagement**: Main component for courts management
- **AddSampleSports**: Helper component for initial sports setup

### State Management
- **useCourtStore**: Zustand store for courts data and operations
- **useSportsStore**: Zustand store for sports data
- Real-time updates and optimistic UI updates

### API Operations
- **fetchCourts**: Retrieve all courts for a project
- **addCourt**: Create a new court
- **updateCourt**: Modify existing court
- **deleteCourt**: Remove a court
- **updateCourtStatus**: Change court availability status

## Error Handling
- Loading states during operations
- Error messages for failed operations
- Form validation for required fields
- Confirmation dialogs for destructive actions

## Future Enhancements
- Court images and media
- Advanced scheduling and availability
- Court maintenance history
- Usage analytics and reporting
- Integration with booking system
- Court equipment management

## Troubleshooting

### Common Issues
1. **No Sports Available**: Use "Add Sample Sports" button
2. **Permission Errors**: Ensure you're authenticated and have project access
3. **Form Validation**: All required fields must be filled
4. **Network Issues**: Check Firebase connection and security rules

### Data Validation
- Court names must be unique within a project
- Price must be a positive number
- Capacity must be at least 1
- Sport must be selected from available options

## Support
For technical issues or questions about the Courts Management system, refer to the project documentation or contact the development team.
