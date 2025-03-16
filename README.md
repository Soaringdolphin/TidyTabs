# TidyTabs - Expense Splitting App

TidyTabs is a mobile application that helps friends and roommates split expenses fairly. Create groups, add expenses, and see who owes what to whom.

## Features

- **Create Expense Groups**: Organize expenses by groups (e.g., roommates, trips, events)
- **Add and Manage Members**: Add, rename, or remove members from groups
- **Track Expenses**: Record who paid for what and how much
- **Smart Expense Splitting**: Automatically calculate who owes what to whom
- **Dark Mode**: Toggle between light and dark themes

## Installation

### Prerequisites

- Node.js (v14 or newer)
- npm or yarn
- Expo CLI

### Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/TidyTabs.git
   cd TidyTabs
   ```

2. Install dependencies:
   ```
   npm install
   ```
   or
   ```
   yarn install
   ```

3. Create a `.env` file in the root directory with your Firebase configuration:
   ```
   API_KEY=your_api_key
   AUTH_DOMAIN=your_auth_domain
   PROJECT_ID=your_project_id
   STORAGE_BUCKET=your_storage_bucket
   MESSAGING_SENDER_ID=your_messaging_sender_id
   APP_ID=your_app_id
   ```

4. Start the development server:
   ```
   expo start
   ```

## Usage

1. **Create a Group**: Tap "Create Group" and enter a group name and members
2. **Add Expenses**: Within a group, tap "Add Expense" to record new expenses
3. **View Balances**: See who owes what to whom in the group details screen
4. **Manage Members**: Add, rename, or remove members as needed

## Technologies Used

- React Native
- Expo
- Firebase/Firestore
- React Navigation

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Privacy Policy

See [PRIVACY_POLICY.md](./PRIVACY_POLICY.md) for details on how user data is handled.

## Performance Optimizations

TidyTabs has been optimized for performance in several key areas:

### 1. List Rendering Optimizations

- **Memoized Components**: All list items are now memoized using React.memo to prevent unnecessary re-renders
- **Optimized FlatList**: Added performance props to FlatList components:
  - `initialNumToRender`: Limits initial render batch
  - `maxToRenderPerBatch`: Controls render batch size
  - `windowSize`: Manages render window
  - `removeClippedSubviews`: Detaches off-screen views

### 2. Firebase Data Fetching Optimizations

- **In-Memory Caching**: Implemented a simple caching system to reduce Firestore reads
- **Cache Invalidation**: Smart cache invalidation on write operations
- **Fallback to Cache**: Returns cached data when network requests fail

### 3. React Optimizations

- **useCallback**: All event handlers are memoized with useCallback
- **useMemo**: Complex calculations and styles are memoized with useMemo
- **Async Rendering**: Heavy calculations are deferred using requestAnimationFrame
- **Optimized State Updates**: Reduced unnecessary state updates

These optimizations significantly improve the app's performance, especially on lower-end devices and with larger datasets.

## Alert System

TidyTabs uses a standardized alert system to ensure consistent UI/UX across the application. The alerts are themed to match the app's light or dark mode.

### Using AlertHelper

The `AlertHelper` utility is located in `utils/AlertHelper.js` and provides the following methods:

#### Success Alerts

```javascript
import { AlertHelper } from '../utils/AlertHelper';

// Show a success message
AlertHelper.showSuccess("Your expense was added successfully");

// With a callback
AlertHelper.showSuccess("Group created successfully", () => {
  // Do something after the user presses OK
  navigation.goBack();
});
```

#### Error Alerts

```javascript
// Show an error message
AlertHelper.showError("Failed to create group");

// With a callback
AlertHelper.showError("You must be logged in to add an expense", () => {
  navigation.navigate('Login');
});
```

#### Confirmation Alerts

```javascript
// Show a confirmation dialog
AlertHelper.showConfirmation(
  "Confirm Action",
  "Are you sure you want to proceed?",
  () => {
    // Action to take when user confirms
    console.log("User confirmed");
  },
  () => {
    // Optional: Action to take when user cancels
    console.log("User canceled");
  }
);
```

#### Destructive Confirmation Alerts

```javascript
// Show a destructive confirmation dialog (for delete operations)
AlertHelper.showDestructiveConfirmation(
  "Delete Group",
  "Are you sure you want to delete this group? This action cannot be undone.",
  () => {
    // Delete action
    deleteGroup(groupId);
  }
);

// With custom confirm button text
AlertHelper.showDestructiveConfirmation(
  "Remove Member",
  "Are you sure you want to remove this member?",
  () => removeMember(memberId),
  null,
  "Remove" // Custom confirm button text
);
```

### Themed Alerts

The alerts automatically adapt to the app's current theme (light or dark mode):

- **Light Mode**: Light background with dark text
- **Dark Mode**: Dark background with light text

Each alert type has a distinct visual style:
- **Success**: Green icon and title
- **Error**: Red icon and title
- **Confirmation**: Blue/primary color icon and buttons
- **Destructive**: Red warning icon and destructive action button

### Benefits

- **Consistency**: All alerts have the same styling and behavior throughout the app
- **Theme-Aware**: Alerts automatically adapt to light or dark mode
- **Maintainability**: Changes to alert styling can be made in one place
- **Readability**: Alert code is more concise and easier to understand
- **Flexibility**: Easy to add new alert types or modify existing ones 