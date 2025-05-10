import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, setDoc, doc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getDatabase, ref, set, push, onValue } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDTjuuiKk6JTN-X1r_JsENwOLePcPmY7W0",
  authDomain: "library-system-6738d.firebaseapp.com",
  projectId: "library-system-6738d",
  storageBucket: "library-system-6738d.appspot.com",
  messagingSenderId: "557477699859",
  appId: "1:557477699859:web:ca2d331a1645bc3d91bae6",
  databaseURL: "https://library-system-6738d-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();

function showMessage(message, divId) {
  const messageDiv = document.getElementById(divId);
  if (!messageDiv) return;
  messageDiv.style.display = "block";
  messageDiv.innerHTML = message;
  messageDiv.style.opacity = 1;
  setTimeout(() => {
    messageDiv.style.opacity = 0;
  }, 5000);
}

// --- Sign Up Event Listener ---
const signUp = document.getElementById('submitSignUp');
if (signUp) {
  signUp.addEventListener('click', (event) => {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const username = document.getElementById('username').value;

    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        const userData = {
          email: email,
          username: username,
          admin: false
          admin: false
        };

        showMessage('Account Created Successfully', 'signUpMessage');

        const docRef = doc(db, "users", user.uid);
        return setDoc(docRef, userData);
      })
      .then(() => {
        window.location.href = 'signin.html';
      })
      .catch((error) => {
        const errorCode = error.code;
        if (errorCode === 'auth/email-already-in-use') {
          showMessage('Email Address Already Exists', 'signUpMessage');
        } else {
          showMessage('Unable to create user', 'signUpMessage');
        }
      });
  });
}

// --- Sign In Event Listener ---
const signIn = document.getElementById('submitSignIn');
if (signIn) {
  signIn.addEventListener('click', (event) => {
    event.preventDefault();

    setPersistence(auth, browserSessionPersistence);

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        showMessage('Login is successful', 'signInMessage');
        const user = userCredential.user;
        localStorage.setItem('loggedInUserId', user.uid);
        window.location.href = 'books.html';
      })
      .catch((error) => {
        const errorCode = error.code;
        if (errorCode === 'auth/invalid-credential') {
          showMessage('Incorrect Email or Password', 'signInMessage');
        } else {
          showMessage('Account Does Not Exist', 'signInMessage');
        }
      });
  });
}

async function addBook(title, author, imageUrl) {
  const db = getDatabase();
  const bookRef = ref(db, 'books');
  
  const newBook = {
      title: title,
      author: author,
      imageUrl: imageUrl,
      createdAt: Date.now(),
      available: true
  };
  
  try {
      await set(push(bookRef), newBook);
      showMessage('Book Added Successfully', 'bookMessage');
  } catch (error) {
      showMessage(`Failed to add book: ${error.message}`, 'bookMessage');
  }
}

function loadBooks() {
  const db = getDatabase();
  const booksRef = ref(db, 'books');
  
  onValue(booksRef, (snapshot) => {
      const bookList = document.getElementById('booklist');
      bookList.innerHTML = '';
      
      snapshot.forEach((bookSnapshot) => {
          const book = bookSnapshot.val();
          
          const bookListItem = `
              <li>
                  <h3>${book.title}</h3>
                  <p>by ${book.author}</p>
                  <div class="book-image">
                      <img src="${book.imageUrl}" alt="${book.title}">
                  </div>
                  <button>See More</button>
              </li>
          `;
          
          bookList.insertAdjacentHTML('beforeend', bookListItem);
      });
  }, (error) => {
      console.error('Error loading books:', error);
  });
}

export { addBook, loadBooks };