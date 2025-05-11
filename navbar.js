import { app, db, auth } from './firebaseconfig.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getDoc, doc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
  const profileLink = document.getElementById('profileLink');
  const signinLink = document.getElementById('signinLink');
  const signupLink = document.getElementById('signUpLink');
  const logoutLink = document.getElementById('logoutLink');

  onAuthStateChanged(auth, (user) => {
    if (user) {
      const loggedInUserId = localStorage.getItem('loggedInUserId');

      if (loggedInUserId) {
        const docRef = doc(db, "users", loggedInUserId);
        getDoc(docRef)
          .then((docSnap) => {
            if (docSnap.exists()) {
              if (signinLink) signinLink.style.display = 'none';
              if (signupLink) signupLink.style.display = 'none';
              if (profileLink) profileLink.style.display = 'inline-block';
              if (logoutLink) logoutLink.style.display = 'inline-block';
            } else {
              console.log("No document found matching ID");
            }
          })
          .catch((error) => {
            console.error("Error getting doc: ", error);
          });
      } else {
        console.log("User ID not found in localStorage");
      }
    } else {
      if (profileLink) profileLink.style.display = 'none';
      if (logoutLink) logoutLink.style.display = 'none';
      if (signinLink) signinLink.style.display = 'inline-block';
      if (signupLink) signupLink.style.display = 'inline-block';
    }
  });

  if (logoutLink) {
    logoutLink.addEventListener('click', (e) => {
      e.preventDefault();
      signOut(auth)
        .then(() => {
          localStorage.removeItem('loggedInUserId');
          window.location.href = 'signin.html';
        })
        .catch((error) => {
          console.error('Error signing out:', error);
        });
    });
  }
});
