# PRE Dashboard - Integrated Project Services

This dashboard has been integrated with the same functionality from the Platinum project, but with a key difference: **each project has its own separate database**. This means services are isolated per project, providing better data security and organization.

## 🏗️ Architecture

### Project-Specific Database Structure
Instead of global collections, each project has its own isolated collections:

```
projects/
├── {projectId}/
│   ├── users/           # Project-specific users
│   ├── academies/       # Project-specific academies
│   ├── sports/          # Project-specific sports
│   ├── courts/          # Project-specific courts
│   ├── shops/           # Project-specific dining/shops
│   ├── products/        # Project-specific products
│   ├── orders/          # Project-specific orders
│   ├── bookings/        # Project-specific bookings
│   ├── events/          # Project-specific events
│   ├── gatePasses/      # Project-specific access control
│   └── notifications/   # Project-specific notifications
```

## 🚀 Available Services

### 1. **User Management** (`useUserStore`)
- Add, edit, delete project users
- Role-based access control (admin, manager, member, guest)
- User status management (active, inactive, suspended)
- Membership types (basic, premium, vip)

### 2. **Academy Management** (`useAcademyStore`)
- Manage sports academies within the project
- Add/edit/delete academy programs
- Track academy details (contact, location, programs)

### 3. **Sports Management** (`useSportsStore`)
- Manage sports activities and programs
- Track difficulty levels, age groups, equipment
- Program status management

### 4. **Court Management** (`useCourtStore`)
- Manage sports courts and facilities
- Track court availability, maintenance, amenities
- Court status management (available, maintenance, booked)

### 5. **Store Management** (`useStoreManagementStore`)
- Manage retail stores within the project
- Product inventory management
- Stock level tracking
- Category management

### 6. **Order Management** (`useOrderStore`)
- Process and track product orders
- Order status management
- Payment tracking
- Revenue analytics

### 7. **Booking System** (`useBookingStore`)
- Court bookings
- Academy session bookings
- Event registrations
- Booking status management

### 8. **Event Management** (`useEventStore`)
- Create and manage events
- Tournament management
- Workshop scheduling
- Event status tracking

### 9. **Gate Pass System** (`useGatePassStore`)
- Visitor access control
- Contractor passes
- Vendor access
- Entry/exit tracking

### 10. **Notification System** (`notificationService`)
- Project-specific notifications
- Browser notifications
- User-specific alerts

## 📱 How to Use

### 1. **Initialize Stores**
```javascript
import { useAcademyStore, useSportsStore, useCourtStore } from '../stores';

const MyComponent = () => {
  const { fetchAcademies, academyOptions } = useAcademyStore();
  const { fetchSports, sports } = useSportsStore();
  
  useEffect(() => {
    if (projectId) {
      fetchAcademies(projectId);
      fetchSports(projectId);
    }
  }, [projectId]);
  
  // Use the data...
};
```

### 2. **Add New Items**
```javascript
const { addAcademy } = useAcademyStore();

const handleAddAcademy = async () => {
  try {
    await addAcademy(projectId, {
      name: 'Tennis Academy',
      email: 'tennis@academy.com',
      phone: '+1234567890'
    });
    // Success!
  } catch (error) {
    // Handle error
  }
};
```

### 3. **Update Items**
```javascript
const { updateAcademy } = useAcademyStore();

const handleUpdate = async () => {
  await updateAcademy(projectId, {
    id: academyId,
    name: 'Updated Name',
    email: 'new@email.com'
  });
};
```

### 4. **Delete Items**
```javascript
const { deleteAcademy } = useAcademyStore();

const handleDelete = async () => {
  await deleteAcademy(projectId, academyId);
};
```

## 🔧 Store Methods

Each store provides these common methods:

- `fetch[Items]()` - Load data from Firebase
- `add[Item]()` - Create new item
- `update[Item]()` - Update existing item
- `delete[Item]()` - Remove item
- `get[Items]By[Filter]()` - Filter data
- `clear[Items]()` - Clear store data

## 📊 Data Flow

1. **Component mounts** → Calls store fetch method
2. **Store fetches data** → From project-specific Firebase collection
3. **Data stored in Zustand** → Component re-renders with data
4. **User actions** → Call store methods (add/update/delete)
5. **Store updates Firebase** → And local state
6. **Component updates** → With new data

## 🎯 Key Benefits

- **Data Isolation**: Each project's data is completely separate
- **Scalability**: Easy to add new projects without affecting existing ones
- **Security**: Project admins can only access their own data
- **Consistency**: Same functionality across all projects
- **Maintainability**: Centralized store logic, easy to update

## 🚨 Important Notes

- **Always pass `projectId`** to store methods
- **Clear stores** when switching projects
- **Handle loading states** for better UX
- **Error handling** is built into all stores
- **Real-time updates** can be added with Firebase listeners

## 🔮 Future Enhancements

- Real-time data synchronization
- Advanced filtering and search
- Bulk operations
- Data export/import
- Advanced analytics dashboard
- Mobile app integration

---

This system provides a robust foundation for managing multiple projects with isolated data while maintaining consistent functionality across all projects.
