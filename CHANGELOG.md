# TidyTabs Changelog

## June 12, 2024

### UI/UX Improvements

1. **Themed Alert System**
   - Created a custom `ThemedAlert` component that adapts to the app's light/dark theme
   - Implemented an `AlertProvider` to manage alerts throughout the app
   - Updated the `AlertHelper` utility to use the new themed alerts
   - All popups now match the app's theme instead of using default black text on white background
   - Added visual indicators (icons) for different alert types (success, error, confirmation, destructive)

2. **Navigation Improvements**
   - Set Home screen (TidyTabs) as the default screen when app opens using `initialRouteName`
   - Rearranged bottom navigation tabs to have Home in the middle position
   - Maintained the back button on the Create Group screen for consistent navigation

3. **Expense Card Layout Improvements**
   - Updated the expense cards to ensure dollar values are vertically aligned
   - Added proper container structure for better layout control
   - Improved spacing and alignment of expense information

### Documentation

- Updated README with details about the themed alert system
- Created this CHANGELOG to track improvements over time

### Benefits

- **Improved Visual Consistency**: All alerts now match the app's theme
- **Better User Experience**: More intuitive navigation with Home as the default screen
- **Enhanced Readability**: Properly aligned expense amounts for easier scanning
- **Maintainability**: Centralized alert styling for easier future updates 