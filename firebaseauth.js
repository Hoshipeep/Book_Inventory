import { app, auth, db } from './firebaseconfig.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { setDoc, doc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getDatabase, ref, set, push, onValue } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js";

function showMessage(message, divId, type = "success") {
  const messageDiv = document.getElementById(divId);
  if (!messageDiv) return;

  messageDiv.style.display = "block";
  messageDiv.innerHTML = message;
  messageDiv.style.opacity = 1;
  messageDiv.style.color = "white";
  messageDiv.style.padding = "10px";
  messageDiv.style.borderRadius = "5px";
  messageDiv.style.backgroundColor = type === "success" ? "green" : "red";

  setTimeout(() => {
    messageDiv.style.opacity = 0;
  }, 5000);
}


const signUp = document.getElementById('submitSignUp');
if (signUp) {
  signUp.addEventListener('click', (event) => {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const username = document.getElementById('username').value;


    if (password !== confirmPassword) {
      showMessage('Passwords do not match', 'passwordError');
      return;
    }

    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        const userData = {
          email: email,
          username: username,
          admin: false
        };

        showMessage('Account Created Successfully', 'signUpMessage', 'success');

        const docRef = doc(db, "users", user.uid);
        return setDoc(docRef, userData);
      })
      .then(() => {
        window.location.href = 'index.html';
      })
      .catch((error) => {
        const errorCode = error.code;
        if (errorCode === 'auth/email-already-in-use') {
          showMessage('Email Address Already Exists', 'signUpMessage', 'error');
        } else {
          showMessage('Unable to create user', 'signUpMessage', 'error');
        }
      });
  });
}


const signIn = document.getElementById('submitSignIn');
if (signIn) {
  signIn.addEventListener('click', (event) => {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // showMessage('Login is successful', 'signInMessage', 'success');
        const user = userCredential.user;
        localStorage.setItem('loggedInUserId', user.uid);
        window.location.href = 'books.html';
      })
      .catch((error) => {
        const errorCode = error.code;
        if (errorCode === 'auth/invalid-credential') {
          showMessage('Incorrect Email or Password', 'signInMessage', 'error');
        } else {
          showMessage('Account Does Not Exist', 'signInMessage', 'error');
        }
      });
  });
}

async function addBook(title, author, imageUrl, description, price) {
  const db = getDatabase();
  const bookRef = ref(db, 'books');
  
  const userId = localStorage.getItem('loggedInUserId');
  if (!userId) {
    showMessage('User not logged in. Please sign in.', 'bookMessage');
    return;
  }

  const newBook = {
      title: title,
      author: author,
      imageUrl: imageUrl,
      createdAt: Date.now(),
      createdBy: userId,
      description: description,
      price, price,
      available: true
  };
  
  try {
      await set(push(bookRef), newBook);
      showMessage('Book Added Successfully', 'bookMessage', 'success');
  } catch (error) {
      showMessage(`Failed to add book: ${error.message}`, 'bookMessage', 'error');
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
      const bookId = bookSnapshot.key;
  
      const bookListItem = document.createElement('li');
      bookListItem.innerHTML = `
        <h3>${book.title}</h3>
        <p>by ${book.author}</p>
        <div class="book-image">
          <img src="${book.imageUrl}" alt="${book.title}">
        </div>
        <p>₱${parseFloat(book.price).toFixed(2)}</p>
        <button class="see-more-btn">See More</button>
      `;
  
      const button = bookListItem.querySelector('.see-more-btn');
      button.addEventListener('click', () => {
        showModal(book, bookId);
      });
  
      bookList.appendChild(bookListItem);
    });
  }, (error) => {
    console.error('Error loading books:', error);
  });
}  

async function borrowBook(book, originalBookId) {
  const db = getDatabase();
  const userId = localStorage.getItem('loggedInUserId');

  if (!userId) {
    showMessage('You must be signed in to borrow books.', 'bookMessage', 'error');
    return;
  }

  const originalBookRef = ref(db, `books/${originalBookId}/available`);
  const borrowedRef = ref(db, 'borrowed');

  try {
    //This part checks if the book is available or not
    const availableSnapshot = await new Promise((resolve, reject) => {
      onValue(originalBookRef, resolve, { onlyOnce: true, errorCallback: reject });
    });

    const isAvailable = availableSnapshot.val();

    if (!isAvailable) {
      alert('This book is currently unavailable.');
      return;
    }

    const borrowedSnapshot = await new Promise((resolve, reject) => {
      onValue(borrowedRef, resolve, { onlyOnce: true, errorCallback: reject });
    });

    let alreadyBorrowed = false;

    //this part checks if you already borrowed this book :>
    borrowedSnapshot.forEach((childSnapshot) => {
      const borrowedBook = childSnapshot.val();
      if (borrowedBook.originalBookId === originalBookId && borrowedBook.borrowedBy === userId) {
        alreadyBorrowed = true;
      }
    });

    if (alreadyBorrowed) {
      alert('You have already borrowed this book.');
      return;
    }

    const newBorrowRef = push(borrowedRef);
    const borrowedBook = {
      ...book,
      borrowedBy: userId,
      originalBookId: originalBookId,
      borrowedAt: Date.now()
    };

    await set(newBorrowRef, borrowedBook);
    await set(ref(db, `books/${originalBookId}/available`), false);

    showMessage('Book borrowed successfully!', 'bookMessage', 'success');
  } catch (error) {
    showMessage(`Failed to borrow book: ${error.message}`, 'bookMessage', 'error');
  }
}


function loadBorrowedBooks() {
  const db = getDatabase();
  const booksRef = ref(db, 'borrowed');
  const userId = localStorage.getItem('loggedInUserId');

  if (!userId) {
    showMessage('User not logged in. Please sign in.', 'bookMessage');
    return;
  }

  onValue(booksRef, (snapshot) => {
    const bookList = document.getElementById('booklist');
    if (!bookList) return;

    bookList.innerHTML = '';

    snapshot.forEach((bookSnapshot) => {
      const book = bookSnapshot.val();
      if (book.borrowedBy === userId) {
        const bookListItem = `
          <li>
            <h3>${book.title}</h3>
            <p>by ${book.author}</p>
            ${book.imageUrl ? `
              <div class="book-image">
                <img src="${book.imageUrl}" alt="${book.title}" onerror="this.style.display='none';">
              </div>` : ''}
            <p>₱${parseFloat(book.price).toFixed(2)}</p>
            <button>See More</button>
          </li>
        `;
        bookList.insertAdjacentHTML('beforeend', bookListItem);
      }
    });

  }, (error) => {
    console.error('Error loading user\'s books:', error);
  });
}


function showModal(book, bookId = null) {
  const modal = document.getElementById('bookModal');
  document.getElementById('modalTitle').textContent = book.title;
  document.getElementById('modalAuthor').textContent = book.author;
  document.getElementById('modalImage').src = book.imageUrl;
  document.getElementById('modalImage').alt = book.title;
  document.getElementById('modalDescription').textContent = book.description || 'No description available.';
  document.getElementById('modalPrice').textContent = parseFloat(book.price).toFixed(2);
  document.getElementById('modalAvailability').textContent = book.available ? 'Available' : 'Not Available';

  modal.classList.remove('hidden');

  // document.getElementById('borrowBtn').onclick = () => {
  //   borrowBook(book, bookId);
  //   modal.classList.add('hidden');
  // };

  const closeModal = () => modal.classList.add('hidden');

  window.onclick = (event) => {
    if (event.target === modal) {
      closeModal();
    }
  };

  document.getElementById('cancelBtn').onclick = closeModal;
}






export { addBook, loadBooks, loadBorrowedBooks };