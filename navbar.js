import { app, db, auth } from './firebaseconfig.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getDoc, doc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
  fetch('navbar.html')
    .then(response => response.text())
    .then(async (data) => {
      document.getElementById('navbar-placeholder').innerHTML = data;

      const profileLink = document.getElementById('profileLink');
      const signinLink = document.getElementById('signinLink');
      const signupLink = document.getElementById('signUpLink');
      const logoutLink = document.getElementById('logoutLink');
      const borrowed = document.getElementById('borrowed');
      const addbook = document.getElementById('addBook');
      const navbar = document.querySelector('.navbar');

      onAuthStateChanged(auth, async (user) => {
        try {
          if (user) {
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
              const userData = docSnap.data();

              signinLink?.style.setProperty('display', 'none');
              signupLink?.style.setProperty('display', 'none');
              profileLink?.style.setProperty('display', 'inline-block');
              logoutLink?.style.setProperty('display', 'inline-block');
              borrowed?.style.setProperty('display', 'inline-block');

              console.log("User data:", userData); 
              console.log("Admin flag:", userData.admin);

              if (userData.admin === true) {
                addbook?.style.setProperty('display', 'inline-block');
              } else {
                addbook?.style.setProperty('display', 'none');
              }
            }
          } else {
            profileLink?.style.setProperty('display', 'none');
            logoutLink?.style.setProperty('display', 'none');
            borrowed?.style.setProperty('display', 'none');
            addbook?.style.setProperty('display', 'none');
            signinLink?.style.setProperty('display', 'inline-block');
            signupLink?.style.setProperty('display', 'inline-block');
          }
        } catch (error) {
          console.error("Auth/nav error:", error);
        } finally {
          navbar?.classList.add('show');
        }
      });

      logoutLink?.addEventListener('click', (e) => {
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
    })
    .catch(error => console.error('Failed to load navbar:', error));
});
