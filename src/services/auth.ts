import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { auth, db, firebaseAuth } from './firebase';
export type AuthUser = User;
export function watchAuth(next: (user: User | null) => void) {
  return auth ? onAuthStateChanged(auth, next) : undefined;
}
export async function authenticateAccount(
  email: string,
  password: string,
  name?: string,
) {
  const credential = name
    ? await createUserWithEmailAndPassword(
        firebaseAuth(),
        email.trim(),
        password,
      )
    : await signInWithEmailAndPassword(firebaseAuth(), email.trim(), password);
  if (name) {
    await updateProfile(credential.user, { displayName: name.trim() });
  }
  await set(ref(db(), `users/${credential.user.uid}`), {
    name: credential.user.displayName || email.trim().split('@')[0],
  });
  return credential.user;
}
export const logoutAccount = () => signOut(firebaseAuth());
