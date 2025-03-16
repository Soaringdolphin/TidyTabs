import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create context
const ArchivedGroupsContext = createContext();

// Custom hook to use the archived groups context
export const useArchivedGroups = () => useContext(ArchivedGroupsContext);

export function ArchivedGroupsProvider({ children }) {
  const [archivedGroups, setArchivedGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load archived groups from AsyncStorage on mount
  useEffect(() => {
    const loadArchivedGroups = async () => {
      try {
        const storedGroups = await AsyncStorage.getItem('archivedGroups');
        if (storedGroups) {
          setArchivedGroups(JSON.parse(storedGroups));
        }
      } catch (error) {
        console.error('Error loading archived groups:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadArchivedGroups();
  }, []);

  // Save archived groups to AsyncStorage whenever they change
  useEffect(() => {
    const saveArchivedGroups = async () => {
      try {
        await AsyncStorage.setItem('archivedGroups', JSON.stringify(archivedGroups));
      } catch (error) {
        console.error('Error saving archived groups:', error);
      }
    };

    if (!isLoading) {
      saveArchivedGroups();
    }
  }, [archivedGroups, isLoading]);

  // Archive a group - memoized to prevent unnecessary re-renders
  const archiveGroup = useCallback((group) => {
    setArchivedGroups(prevGroups => {
      // Check if group is already archived
      const isAlreadyArchived = prevGroups.some(g => g.id === group.id);
      if (isAlreadyArchived) {
        return prevGroups;
      }
      return [...prevGroups, { ...group, archivedAt: new Date() }];
    });
  }, []);

  // Unarchive a group - memoized to prevent unnecessary re-renders
  const unarchiveGroup = useCallback((groupId) => {
    setArchivedGroups(prevGroups => 
      prevGroups.filter(group => group.id !== groupId)
    );
  }, []);

  // Check if a group is archived - memoized to prevent unnecessary re-renders
  const isGroupArchived = useCallback((groupId) => {
    return archivedGroups.some(group => group.id === groupId);
  }, [archivedGroups]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    archivedGroups, 
    archiveGroup, 
    unarchiveGroup, 
    isGroupArchived,
    isLoading
  }), [archivedGroups, archiveGroup, unarchiveGroup, isGroupArchived, isLoading]);

  return (
    <ArchivedGroupsContext.Provider value={contextValue}>
      {children}
    </ArchivedGroupsContext.Provider>
  );
} 