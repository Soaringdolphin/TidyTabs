import React, { useEffect, useState, useContext, useCallback, memo, useRef } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, StatusBar, SafeAreaView, Animated } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import { NavigationContainer, useIsFocused, useFocusEffect } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { getGroups } from "./firebase/firestoreFunctions";
import AddGroupScreen from "./screens/AddGroupScreen";
import GroupDetailsScreen from "./screens/GroupDetailsScreen";
import AddExpenseScreen from "./screens/AddExpenseScreen";
import ManageExpenseScreen from "./screens/ManageExpenseScreen";
import ManageMembersScreen from "./screens/ManageMembers";
import SettingsScreen from "./screens/Settings";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import ForgotPasswordScreen from "./screens/ForgotPasswordScreen";
import ProfileScreen from "./screens/ProfileScreen";
import { ThemeContext, ThemeProvider, Colors } from "./ThemeContext";
import { AuthProvider, useAuth } from "./AuthContext";
import { ArchivedGroupsProvider, useArchivedGroups } from "./ArchivedGroupsContext";
import { Easing } from "react-native";
import ArchivedGroupsScreen from "./screens/ArchivedGroupsScreen";
import ArchivedGroupDetailsScreen from "./screens/ArchivedGroupDetailsScreen";
import { AlertProvider } from "./components";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Memoized GroupItem component for better performance
const GroupItem = memo(({ item, onPress, colors, theme }) => {
  // Function to format date in "Month Day, Year" format
  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown Date";
    
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch {
      return "Date Error";
    }
  };

  // Calculate member count
  const memberCount = item.members ? item.members.length : 0;

  return (
    <TouchableOpacity
      style={[styles.groupItem, { 
        backgroundColor: colors.card, 
        borderColor: colors.border,
        shadowColor: theme === 'dark' ? '#000' : '#888',
      }]}
      onPress={onPress}
      accessibilityLabel={`Group ${item.name || "Unnamed Group"}`}
      accessibilityHint="Tap to view group details"
    >
      <View style={styles.groupHeader}>
        <Text style={[styles.groupName, { color: colors.text }]}>{item.name ?? "Unnamed Group"}</Text>
        <View style={[styles.memberCountBadge, { backgroundColor: colors.primary + '20' }]}>
          <Text style={[styles.memberCountText, { color: colors.primary }]}>
            {memberCount} {memberCount === 1 ? 'member' : 'members'}
          </Text>
        </View>
      </View>
      
      <View style={styles.groupFooter}>
        <View style={styles.groupDateContainer}>
          <Ionicons name="calendar-outline" size={14} color={colors.subText} style={styles.groupIcon} />
          {item.createdAt && item.createdAt.seconds ? (
            <Text style={[styles.groupDate, { color: colors.subText }]}>{formatDate(item.createdAt)}</Text>
          ) : (
            <Text style={[styles.groupDate, { color: colors.subText }]}>Unknown Date</Text>
          )}
        </View>
        
        <View style={styles.viewDetailsContainer}>
          <Text style={[styles.viewDetailsText, { color: colors.primary }]}>View Details</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
});

/**
 * HomeScreen component displays the list of expense groups
 * @param {object} navigation - Navigation object for screen transitions
 */
function HomeScreen({ navigation, route }) {
  const { theme } = useContext(ThemeContext);
  const colors = Colors[theme];
  const { user } = useAuth();
  const { isGroupArchived, archiveGroup } = useArchivedGroups();
  const isFocused = useIsFocused();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [newGroupId, setNewGroupId] = useState(null); // Track newly added group for animation
  
  // Store groups in a ref to maintain between renders
  const cachedGroupsRef = useRef([]);

  // Get user's first name for greeting
  const firstName = user?.displayName?.split(' ')[0] || 'there';

  // Explicitly show the tab bar when this screen is focused and refresh data
  useFocusEffect(
    useCallback(() => {
      // Get the parent navigator (Tab Navigator) and show its tab bar
      const parent = navigation.getParent();
      if (parent) {
        parent.setOptions({
          tabBarStyle: {
            display: 'flex',
            backgroundColor: colors.tabBar,
            borderTopColor: colors.tabBarBorder,
          }
        });
      }
      
      // Force a refresh when the screen is focused
      if (user?.uid) {
        fetchGroups();
      }
    }, [navigation, colors, user, fetchGroups])
  );

  // Memoize the fetchGroups function to prevent recreation on each render
  const fetchGroups = useCallback(async () => {
    if (!user?.uid) return;

    try {
      if (!refreshing) setLoading(true);
      setError(null);
      
      const fetchedGroups = await getGroups(user.uid);
      
      // Filter out archived groups
      const filteredGroups = fetchedGroups.filter(group => !isGroupArchived(group.id));
      
      // Sort groups by creation date (newest first)
      filteredGroups.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.seconds - a.createdAt.seconds;
      });
      
      setGroups(filteredGroups);
      cachedGroupsRef.current = filteredGroups;
    } catch (error) {
      setError("Failed to load groups. Pull down to refresh.");
      // Keep showing cached groups if available
      if (cachedGroupsRef.current.length > 0) {
        setGroups(cachedGroupsRef.current);
      } else {
        setGroups([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.uid, isGroupArchived, refreshing]);

  // Respond to the refresh parameter from route.params
  useEffect(() => {
    if (route.params?.refresh && isFocused) {
      // Clear the parameter to prevent multiple refreshes
      navigation.setParams({ refresh: null });
      // Force a complete refresh from Firebase
      fetchGroups();
    }
  }, [route.params?.refresh, navigation, fetchGroups, isFocused]);

  // Handle pull-to-refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchGroups();
  }, [fetchGroups]);

  // Handle archiving a group
  const handleArchiveGroup = useCallback((group) => {
    archiveGroup(group);
    // Remove the group from the current list
    setGroups(prevGroups => prevGroups.filter(g => g.id !== group.id));
  }, [archiveGroup]);

  // Function to add a new group to the list with animation
  const addNewGroup = useCallback((newGroup) => {
    if (!newGroup || !newGroup.id) return;
    
    // Check if group already exists in the list
    const exists = groups.some(group => group.id === newGroup.id);
    if (exists) return;
    
    // Add the new group to the list
    setGroups(prevGroups => [newGroup, ...prevGroups]);
    
    // Set the new group ID for animation
    setNewGroupId(newGroup.id);
    
    // Clear the animation flag after a delay
    setTimeout(() => {
      setNewGroupId(null);
    }, 2000);
    
    // Update the cached groups
    cachedGroupsRef.current = [newGroup, ...cachedGroupsRef.current];
    
    // Refresh the full list in the background
    setTimeout(() => {
      fetchGroups(false);
    }, 500);
  }, [groups, fetchGroups]);

  // Set up navigation params to allow direct refresh and adding new groups
  useEffect(() => {
    navigation.setParams({
      refreshGroups: () => fetchGroups(false),
      addNewGroup: addNewGroup
    });
  }, [navigation, fetchGroups, addNewGroup]);

  // When screen comes into focus, show cached groups immediately and refresh in background
  useFocusEffect(
    useCallback(() => {
      if (user) {
        // If we have cached groups, show them immediately
        if (cachedGroupsRef.current.length > 0) {
          setGroups(cachedGroupsRef.current);
          setLoading(false);
          
          // Then refresh in the background
          setTimeout(() => {
            fetchGroups(false);
          }, 100);
        } else {
          // Otherwise do a normal fetch
          fetchGroups();
        }
      }
    }, [user, fetchGroups])
  );

  // Fetch groups when the screen is focused
  useEffect(() => {
    if (isFocused && user?.uid) {
      fetchGroups();
    }
  }, [isFocused, user, fetchGroups]);

  // Memoize the keyExtractor and renderItem functions to prevent unnecessary re-renders
  const keyExtractor = useCallback((item) => item.id, []);
  
  const renderItem = useCallback(({ item }) => {
    const isNewGroup = item.id === newGroupId;
    
    return (
      <Animated.View
        style={[
          isNewGroup && {
            backgroundColor: colors.primary + '20',
            transform: [{ scale: 1.02 }],
          }
        ]}
      >
        <GroupItem 
          item={item} 
          onPress={() => navigation.navigate("GroupDetails", { 
            groupId: item.id,
            groupName: item.name,
            members: item.members
          })} 
          colors={colors}
          theme={theme}
        />
      </Animated.View>
    );
  }, [navigation, colors, newGroupId, theme]);

  if (loading && !refreshing && groups.length === 0) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (groups.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>TidyTabs</Text>
          <Text style={[styles.headerGreeting, { color: colors.subText }]}>Hi, {firstName}!</Text>
        </View>
        
        <View style={styles.emptyStateContainer}>
          <Ionicons name="document-text-outline" size={80} color={colors.primary + '60'} style={styles.emptyStateIcon} />
          <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No Groups Yet</Text>
          <Text style={[styles.emptyStateText, { color: colors.subText }]}>
            Create your first expense group to start tracking shared expenses with friends and family.
          </Text>
          <TouchableOpacity 
            style={[styles.emptyStateButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('AddGroup')}
          >
            <Ionicons name="add-circle-outline" size={20} color="#fff" style={styles.emptyStateButtonIcon} />
            <Text style={styles.emptyStateButtonText}>Create Group</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>TidyTabs</Text>
        <Text style={[styles.headerGreeting, { color: colors.subText }]}>Hi, {firstName}!</Text>
      </View>
      
      <View style={styles.groupsContainer}>
        <View style={styles.groupsHeader}>
          <Text style={[styles.groupsHeaderTitle, { color: colors.text }]}>Your Groups</Text>
          <Text style={[styles.groupsHeaderCount, { color: colors.subText }]}>{groups.length} {groups.length === 1 ? 'group' : 'groups'}</Text>
        </View>
        
        <FlatList
          data={groups}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={[styles.listContent, { paddingHorizontal: 16 }]}
          initialNumToRender={8}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}

/**
 * HomeStack component that sets up the home stack navigation
 */
function HomeStack() {
  const { theme } = useContext(ThemeContext);
  const colors = Colors[theme];

  // Custom transition spec to prevent flashing during transitions
  const transitionSpec = {
    animation: 'timing',
    config: {
      duration: 100,
      easing: Easing.inOut(Easing.ease),
    },
  };

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        cardStyle: { backgroundColor: colors.background },
        headerStyle: {
          backgroundColor: colors.background,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        // Prevent detaching previous screen to avoid flickering
        detachPreviousScreen: false,
        // Enable card overlay for smoother transitions
        cardOverlayEnabled: true,
        // Disable card shadow to prevent visual artifacts
        cardShadowEnabled: false,
        // Custom transition spec
        transitionSpec: {
          open: transitionSpec,
          close: transitionSpec,
        },
        // Custom card style interpolator for smooth transitions
        cardStyleInterpolator: ({ current, next, layouts }) => {
          return {
            cardStyle: {
              opacity: current.progress,
              backgroundColor: colors.background,
            },
            overlayStyle: {
              opacity: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.5],
              }),
            },
          };
        },
      }}
      initialRouteName="HomeScreen"
    >
      <Stack.Screen
        name="HomeScreen"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="GroupDetails"
        component={GroupDetailsScreen}
        options={({ navigation }) => ({
          title: "Group Details",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('HomeScreen')}
              style={{ paddingLeft: 15 }}
            >
              <Ionicons name="arrow-back" size={24} color={Colors[theme].text} />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="AddExpense"
        component={AddExpenseScreen}
        options={({ navigation, route }) => ({
          title: "Add Expense",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('GroupDetails', {
                groupId: route.params?.groupId,
                groupName: route.params?.groupName,
                members: route.params?.members
              })}
              style={{ paddingLeft: 15 }}
            >
              <Ionicons name="arrow-back" size={24} color={Colors[theme].text} />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="ManageExpense"
        component={ManageExpenseScreen}
        options={({ navigation, route }) => ({
          title: "Manage Expense",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('GroupDetails', {
                groupId: route.params?.groupId,
                groupName: route.params?.groupName,
                members: route.params?.members
              })}
              style={{ paddingLeft: 15 }}
            >
              <Ionicons name="arrow-back" size={24} color={Colors[theme].text} />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="ManageMembers"
        component={ManageMembersScreen}
        options={({ navigation, route }) => ({
          title: "Manage Group",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('GroupDetails', {
                groupId: route.params?.groupId,
                groupName: route.params?.groupName,
                members: route.params?.members
              })}
              style={{ paddingLeft: 15 }}
            >
              <Ionicons name="arrow-back" size={24} color={Colors[theme].text} />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="ArchivedGroups"
        component={ArchivedGroupsScreen}
        options={({ navigation }) => ({
          title: "Archived Groups",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('HomeScreen')}
              style={{ paddingLeft: 15 }}
            >
              <Ionicons name="arrow-back" size={24} color={Colors[theme].text} />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="ArchivedGroupDetails"
        component={ArchivedGroupDetailsScreen}
        options={({ route, navigation }) => ({
          title: route.params?.groupName || "Archived Group",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('ArchivedGroups')}
              style={{ paddingLeft: 15 }}
            >
              <Ionicons name="arrow-back" size={24} color={Colors[theme].text} />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={({ navigation }) => ({
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('HomeScreen')}
              style={{ paddingLeft: 15 }}
            >
              <Ionicons name="arrow-back" size={24} color={Colors[theme].text} />
            </TouchableOpacity>
          ),
        })}
      />
    </Stack.Navigator>
  );
}

/**
 * SettingsStack component that sets up the settings stack navigation
 */
function SettingsStack() {
  const { theme } = useContext(ThemeContext);
  const colors = Colors[theme];

  // Custom transition spec to prevent flashing during transitions
  const transitionSpec = {
    animation: 'timing',
    config: {
      duration: 100,
      easing: Easing.inOut(Easing.ease),
    },
  };

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        cardStyle: { backgroundColor: colors.background },
        // Prevent detaching previous screen to avoid flickering
        detachPreviousScreen: false,
        // Enable card overlay for smoother transitions
        cardOverlayEnabled: true,
        // Disable card shadow to prevent visual artifacts
        cardShadowEnabled: false,
        // Custom transition spec
        transitionSpec: {
          open: transitionSpec,
          close: transitionSpec,
        },
        // Custom card style interpolator for smooth transitions
        cardStyleInterpolator: ({ current, next, layouts }) => {
          return {
            cardStyle: {
              opacity: current.progress,
              backgroundColor: colors.background,
            },
            overlayStyle: {
              opacity: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.5],
              }),
            },
          };
        },
      }}
    >
      <Stack.Screen
        name="SettingsScreen"
        component={SettingsScreen}
        options={{ title: "Settings" }}
      />
      <Stack.Screen
        name="ArchivedGroups"
        component={ArchivedGroupsScreen}
        options={{ title: "Archived Groups" }}
      />
      <Stack.Screen
        name="ArchivedGroupDetails"
        component={ArchivedGroupDetailsScreen}
        options={({ route }) => ({
          title: route.params?.groupName || "Archived Group",
        })}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: "Your Profile" }}
      />
    </Stack.Navigator>
  );
}

/**
 * AuthStack component defines the navigation stack for authentication screens
 */
function AuthStack() {
  const { theme } = useContext(ThemeContext);
  const colors = Colors[theme];
  
  // Custom transition configuration to prevent flashing
  const customTransitionConfig = {
    animation: 'timing',
    config: {
      duration: 200,
    },
  };
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        cardStyle: { backgroundColor: colors.background },
        headerStyle: {
          backgroundColor: colors.background,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        // Add back button to all screens
        headerBackTitleVisible: false,
        headerLeftContainerStyle: {
          paddingLeft: 10,
        },
        // Add these to prevent flashing during transitions
        detachPreviousScreen: false,
        cardOverlayEnabled: true,
        cardShadowEnabled: false,
        cardStyleInterpolator: ({ current: { progress } }) => ({
          cardStyle: {
            opacity: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1],
            }),
            backgroundColor: colors.background,
          },
        }),
        transitionSpec: {
          open: {
            animation: 'timing',
            config: {
              duration: 100,
              easing: Easing.inOut(Easing.ease),
            },
          },
          close: {
            animation: 'timing',
            config: {
              duration: 100,
              easing: Easing.inOut(Easing.ease),
            },
          },
        },
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{
          // No back button for login screen
          headerLeft: () => null,
        }}
      />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: "Reset Password" }} />
    </Stack.Navigator>
  );
}

/**
 * MainApp component that sets up the authenticated app navigation
 */
function MainApp() {
  const { theme } = useContext(ThemeContext);
  const colors = Colors[theme];
  
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else if (route.name === 'AddGroup') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.subText,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
        },
        headerShown: false,
      })}
      backBehavior="history"
    >
      {/* DO NOT CHANGE THE ORDER OF THESE TABS - Home must stay in the middle */}
      <Tab.Screen 
        name="AddGroup" 
        component={AddGroupScreen} 
        options={({ navigation }) => ({
          tabBarLabel: 'Create',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons 
              name={focused ? 'add-circle' : 'add-circle-outline'} 
              size={size} 
              color={color} 
            />
          ),
          headerShown: true,
          headerTitle: "Create Group",
          headerStyle: {
            backgroundColor: colors.background,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('Home')}
              style={{ paddingLeft: 15 }}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
          ),
          // Hide tab bar by default for this screen
          tabBarStyle: {
            display: 'none',
            backgroundColor: colors.tabBar,
            borderTopColor: colors.tabBarBorder,
          }
        })}
        listeners={({ navigation }) => ({
          tabPress: e => {
            // Prevent default behavior
            e.preventDefault();
            
            // Navigate to AddGroup screen
            navigation.navigate('AddGroup');
          },
        })}
      />
      <Tab.Screen 
        name="Home" 
        component={HomeStack}
        options={{
          tabBarStyle: {
            display: 'flex', // Always show for Home
            backgroundColor: colors.tabBar,
            borderTopColor: colors.tabBarBorder,
          }
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsStack}
      />
    </Tab.Navigator>
  );
}

/**
 * AppContent component that handles authentication state
 */
function AppContent() {
  const { user, isLoading } = useAuth();
  const { theme } = useContext(ThemeContext);
  const colors = Colors[theme];
  
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <StatusBar
          translucent={false}
          backgroundColor="#000000"  // Use black for status bar regardless of theme
          barStyle="light-content"   // Use light content for black background
        />
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <>
      <StatusBar
        translucent={false}
        backgroundColor="#000000"  // Use black for status bar regardless of theme
        barStyle="light-content"   // Use light content for black background
      />
      <NavigationContainer>
        {user ? <MainApp /> : <AuthStack />}
      </NavigationContainer>
    </>
  );
}

/**
 * Main App component that sets up providers
 */
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ArchivedGroupsProvider>
          <AppContent />
          <AlertProvider />
        </ArchivedGroupsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 4,
  },
  headerGreeting: {
    fontSize: 16,
  },
  groupsContainer: {
    flex: 1,
  },
  groupsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  groupsHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  groupsHeaderCount: {
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyStateIcon: {
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  emptyStateButtonIcon: {
    marginRight: 8,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContent: {
    paddingBottom: 20,
  },
  groupItem: {
    padding: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  groupHeader: {
    marginBottom: 12,
  },
  groupName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
  },
  memberCountBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  memberCountText: {
    fontSize: 12,
    fontWeight: '500',
  },
  groupFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  groupDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupIcon: {
    marginRight: 4,
  },
  groupDate: {
    fontSize: 12,
  },
  viewDetailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: '500',
    marginRight: 2,
  },
});
