import { auth, db } from './firebase-config.js';
import { showToast } from './utils.js';
import { 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    doc, 
    getDoc, 
    setDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let currentUser = null;

// Get current user role & details
export const getCurrentUser = () => {
    return currentUser;
};

// Monitor Firebase Auth State Changed to keep user session alive
export const initAuthListener = (onUserChanged) => {
    onAuthStateChanged(auth, async (fbUser) => {
        if (fbUser) {
            try {
                const userDocRef = doc(db, 'users', fbUser.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    currentUser = { id: fbUser.uid, ...userDoc.data() };
                } else {
                    // Fallback default role
                    currentUser = { id: fbUser.uid, nama: fbUser.email.split('@')[0], email: fbUser.email, role: 'bendahara' };
                }
            } catch (e) {
                console.error("Gagal memuat profil pengguna:", e);
                currentUser = { id: fbUser.uid, nama: fbUser.email.split('@')[0], email: fbUser.email, role: 'bendahara' };
            }
        } else {
            currentUser = null;
        }
        onUserChanged(currentUser);
    });
};

// Login user via Firebase
export const login = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userDocRef = doc(db, 'users', userCredential.user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
        const userData = { id: userCredential.user.uid, ...userDoc.data() };
        currentUser = userData;
        return userData;
    } else {
        const fallbackUser = { id: userCredential.user.uid, nama: userCredential.user.email.split('@')[0], email: userCredential.user.email, role: 'bendahara' };
        currentUser = fallbackUser;
        return fallbackUser;
    }
};

// Register user and create profile in Firestore
export const registerUser = async (nama, email, password, role) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const userDocRef = doc(db, 'users', userCredential.user.uid);
    
    const userData = {
        nama: nama,
        email: email,
        role: role,
        createdAt: new Date().toISOString()
    };
    
    await setDoc(userDocRef, userData);
    currentUser = { id: userCredential.user.uid, ...userData };
    return currentUser;
};

// Logout User
export const logout = async () => {
    await signOut(auth);
    currentUser = null;
    showToast('Anda telah keluar dari sistem.');
    return true;
};

// Check if user has required roles
export const hasAccess = (allowedRoles) => {
    const user = getCurrentUser();
    if (!user) return false;
    return allowedRoles.includes(user.role);
};
