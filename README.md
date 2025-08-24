# PRE Admin Dashboard

A comprehensive React-based admin dashboard for managing the PRE sports platform, cloned from the Platinum project and adapted for React.

## 🚀 Features

### ✅ **Completed Features**
- **Authentication System** - Secure login/logout with Firebase Auth
- **Responsive Layout** - Mobile-first design with sidebar navigation
- **Dashboard Overview** - Statistics cards, charts, and recent activity
- **User Management** - View, edit, delete users and manage roles
- **Bookings Management** - Manage court and academy bookings
- **Real-time Data** - Live data from Firebase Firestore

### 🚧 **Coming Soon**
- **Academies Management** - Manage training programs and schedules
- **Courts Management** - Manage sports facilities and availability
- **Events Management** - Manage tournaments and events
- **Advanced Analytics** - Detailed reporting and insights

## 🛠️ Tech Stack

- **Frontend**: React 19, React Router DOM
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **Backend**: Firebase (Firestore, Auth)
- **Build Tool**: Create React App

## 📦 Installation

1. **Clone the repository**
   ```bash
   cd pre-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Update `src/config/firebase.js` with your Firebase configuration
   - Replace the placeholder values with your actual Firebase project details

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## 🔧 Configuration

### Firebase Setup
1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication (Email/Password)
3. Enable Firestore Database
4. Get your project configuration and update `src/config/firebase.js`

### Environment Variables
Create a `.env` file in the root directory:
```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

## 🎯 Usage

### Login
- Default credentials: `admin@pre.com` / `admin123`
- Update these in the Firebase Authentication console

### Navigation
- **Dashboard**: Overview of platform statistics
- **Users**: Manage user accounts and roles
- **Bookings**: View and manage all bookings
- **Academies**: Manage training programs (coming soon)
- **Courts**: Manage sports facilities (coming soon)
- **Events**: Manage tournaments (coming soon)

### Key Actions
- **User Management**: View details, change roles, delete users
- **Booking Management**: Confirm, cancel, and view booking details
- **Real-time Updates**: All changes are reflected immediately

## 📱 Responsive Design

The dashboard is fully responsive and works on:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## 🔒 Security Features

- Protected routes requiring authentication
- Role-based access control
- Secure Firebase integration
- Input validation and sanitization

## 📊 Data Structure

### Collections
- **users**: User accounts and profiles
- **bookings**: Court and academy bookings
- **academies**: Training programs and schedules
- **sports**: Sports types and court information

### User Roles
- **admin**: Full access to all features
- **user**: Limited access (future implementation)
- **pending**: Awaiting approval

## 🚀 Deployment

### Netlify
1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `build`
4. Add environment variables

### Vercel
1. Import your GitHub repository
2. Set build command: `npm run build`
3. Set output directory: `build`
4. Add environment variables

### Firebase Hosting
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init hosting`
4. Build and deploy: `npm run build && firebase deploy`

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 🐛 Troubleshooting

### Common Issues

**Firebase Connection Error**
- Verify your Firebase configuration
- Check if Firestore rules allow read/write
- Ensure Authentication is enabled

**Build Errors**
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version compatibility
- Verify all dependencies are installed

**Authentication Issues**
- Check Firebase Auth configuration
- Verify user exists in Firebase console
- Check browser console for errors

## 📞 Support

For support and questions:
- Check the Firebase documentation
- Review React and Tailwind CSS docs
- Open an issue in the repository

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **Platinum Project** - Original Vue.js admin dashboard
- **Firebase** - Backend services
- **Tailwind CSS** - Utility-first CSS framework
- **React Community** - Excellent documentation and tools

---

**Built with ❤️ for the PRE sports platform**
