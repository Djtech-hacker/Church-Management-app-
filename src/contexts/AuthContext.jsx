// src/contexts/AuthContext.jsx
import { createContext, useState, useEffect, useContext } from 'react';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, storage } from '../firebase/config';

// Export auth, db, storage for use in other components
export { auth, db, storage };

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Register new user
  const register = async (userData) => {
    try {
      const { email, password, fullName, phone, department } = userData;
      
      console.log('📧 Creating Firebase Auth user...');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log('✅ Auth user created:', user.uid);
      
      // Create user profile in Firestore
      const userProfileData = {
        uid: user.uid,
        email,
        fullName,
        phone,
        department,
        role: 'member',
        photoURL: '',
        createdAt: new Date().toISOString(),
        churchId: 'default'
      };
      
      console.log('💾 Saving user profile to Firestore...');
      await setDoc(doc(db, 'users', user.uid), userProfileData);
      
      console.log('✅ User profile saved successfully');
      
      // Immediately set the user profile in state to avoid waiting for onAuthStateChanged
      setUserProfile(userProfileData);
      
      return user;
    } catch (error) {
      console.error('❌ Registration error in AuthContext:', error);
      throw error;
    }
  };

  // Login
  const login = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Logout
  const logout = () => {
    return signOut(auth);
  };

  // Reset password
  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  // Fetch user profile
  const fetchUserProfile = async (uid) => {
    try {
      console.log('🔍 Fetching user profile for:', uid);
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        console.log('✅ User profile found:', docSnap.data());
        setUserProfile(docSnap.data());
        return docSnap.data();
      } else {
        console.warn('⚠️ User profile not found in Firestore');
        // Wait a bit and try again (for new registrations)
        await new Promise(resolve => setTimeout(resolve, 1000));
        const retrySnap = await getDoc(docRef);
        if (retrySnap.exists()) {
          console.log('✅ User profile found on retry');
          setUserProfile(retrySnap.data());
          return retrySnap.data();
        }
      }
    } catch (error) {
      console.error('❌ Error fetching user profile:', error);
    }
  };

  useEffect(() => {
    console.log('👂 Setting up auth listener...');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔔 Auth state changed:', user ? user.uid : 'No user');
      setCurrentUser(user);
      
      if (user) {
        // Only fetch if we don't already have the profile
        if (!userProfile || userProfile.uid !== user.uid) {
          await fetchUserProfile(user.uid);
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    register,
    login,
    logout,
    resetPassword,
    fetchUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};