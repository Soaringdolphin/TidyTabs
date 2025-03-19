// Firebase provider bridge - allows switching between web and native implementations
import { Platform } from 'react-native';

// Import web implementations
import { db } from './firebaseConfig';
import { 
  auth, 
  signUp, 
  signIn, 
  logOut, 
  resetPassword, 
  subscribeToAuthChanges, 
  updateUserEmail 
} from './auth';

// Import native implementations (will only be used on native platforms)
import { 
  nativeDb, 
  nativeAuth, 
  rnSignUp, 
  rnSignIn, 
  rnLogOut, 
  rnResetPassword, 
  rnSubscribeToAuthChanges, 
  rnUpdateUserEmail 
} from './nativeConfig';

// Flag to force using native implementation on all platforms
const FORCE_NATIVE = true;

// Check if running on native platform
const isNative = Platform.OS === 'android' || Platform.OS === 'ios';

// Use native implementation on native platforms
export const firebase = {
  // Core services
  db: isNative || FORCE_NATIVE ? nativeDb : db,
  auth: isNative || FORCE_NATIVE ? nativeAuth : auth,
  
  // Auth methods
  signUp: isNative || FORCE_NATIVE ? rnSignUp : signUp,
  signIn: isNative || FORCE_NATIVE ? rnSignIn : signIn,
  logOut: isNative || FORCE_NATIVE ? rnLogOut : logOut,
  resetPassword: isNative || FORCE_NATIVE ? rnResetPassword : resetPassword,
  subscribeToAuthChanges: isNative || FORCE_NATIVE ? rnSubscribeToAuthChanges : subscribeToAuthChanges,
  updateUserEmail: isNative || FORCE_NATIVE ? rnUpdateUserEmail : updateUserEmail,
};

// For debugging
console.log(`Using ${isNative || FORCE_NATIVE ? 'native' : 'web'} Firebase implementation`);

export default firebase; 