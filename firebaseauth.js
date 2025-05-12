import { app, auth, db } from './firebaseconfig.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { setDoc, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
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
          admin: false,
          balance: 0.00
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
      available: true,
      active: true
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
    allBooks = []; // Clear before updating

    snapshot.forEach((bookSnapshot) => {
      const book = bookSnapshot.val();
      const bookId = bookSnapshot.key;

      // Only include books with active === true
      if (book.active !== false) {
        allBooks.push({ book, bookId });
      }
    });

    console.log("Filtered active books in loadBooks:", allBooks);
    renderBooks(allBooks); // Render only active books
  }, (error) => {
    console.error('Error loading books:', error);
  });
}


// 🔍 Add search functionality
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim().toLowerCase();
    const filtered = allBooks.filter(({ book }) => 
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query)
    );
    renderBooks(filtered);
  });
});

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
      borrowedAt: Date.now(),
      returned: false
    };

    await set(newBorrowRef, borrowedBook);
    await set(ref(db, `books/${originalBookId}/available`), false);

    showMessage('Book borrowed successfully!', 'bookMessage', 'success');
  } catch (error) {
    showMessage(`Failed to borrow book: ${error.message}`, 'bookMessage', 'error');
  }
}


async function buyBook(book, bookId) {
    const userId = localStorage.getItem('loggedInUserId');

    if (!userId) {
        showMessage('You must be signed in to buy books.', 'bookMessage', 'error');
        return;
    }

    const purchasedRef = ref(getDatabase(), 'purchased');
    // Use bookId as the reference for books (whether borrowed or not)
    const originalBookRef = ref(getDatabase(), `books/${bookId}`);
    // Always use the passed bookId to delete from the borrowed collection (if it exists)
    const borrowedBookRef = ref(getDatabase(), `borrowed/${bookId}`);

    try {
        // ✅ Fetch user balance from Firestore
        const userDocRef = doc(db, "users", userId);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
            showMessage('User data not found.', 'bookMessage', 'error');
            return;
        }

        const currentBalance = parseFloat(userDocSnap.data().balance);
        const bookPrice = parseFloat(book.price);

        if (isNaN(currentBalance) || isNaN(bookPrice)) {
            showMessage('Invalid balance or book price.', 'bookMessage', 'error');
            return;
        }

        if (currentBalance < bookPrice) {
            showMessage('Insufficient balance to buy this book.', 'bookMessage', 'error');
            return;
        }

        const updatedBalance = (currentBalance - bookPrice).toFixed(2);

        // ✅ Update balance in Firestore
        await updateDoc(userDocRef, {
            balance: parseFloat(updatedBalance)
        });

        // ✅ Record purchase in Realtime DB
        const newPurchaseRef = push(purchasedRef);
        const purchaseData = {
            ...book,
            purchasedBy: userId,
            purchasedAt: Date.now()
        };
        await set(newPurchaseRef, purchaseData);

        // ✅ Remove book from books and borrowed
        await set(originalBookRef, null);
        // Always attempt to delete from borrowed using the passed bookId
        await set(borrowedBookRef, null);

        showMessage('Book purchased successfully!', 'bookMessage', 'success');
        const modal = document.getElementById('bookModal');
        if (modal) modal.classList.add('hidden');

    } catch (error) {
        console.error('Error buying book:', error);
        showMessage(`Failed to buy book: ${error.message}`, 'bookMessage', 'error');
    }
}

function loadBorrowedBooksTable() {
    const db = getDatabase();
    const borrowedRef = ref(db, 'borrowed');
    const purchasedRef = ref(db, 'purchased');
    const userId = localStorage.getItem('loggedInUserId');

    if (!userId) {
        showMessage('User not logged in. Please sign in.', 'bookMessage');
        return;
    }

    const tableBody = document.getElementById('borrowedBooksTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = ''; // Clear the table

    let borrowedData = [];
    let purchasedData = [];
    let borrowedLoaded = false;
    let purchasedLoaded = false;

    const checkAndRender = () => {
        if (borrowedLoaded && purchasedLoaded) {
            const transactions = [...borrowedData, ...purchasedData];
            transactions.sort((a, b) => b.transactionDate - a.transactionDate);

            if (transactions.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="6">No borrowed or purchased books.</td></tr>';
            } else {
                transactions.forEach((transaction) => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${transaction.title}</td>
                        <td>${transaction.author}</td>
                        <td><img src="${transaction.imageUrl}" alt="${transaction.title}" width="50" height="75" onerror="this.style.display='none';" /></td>
                        <td>₱${parseFloat(transaction.price).toFixed(2)}</td>
                        <td>${new Date(transaction.transactionDate).toLocaleString()}</td>
                        <td>${transaction.type}</td>
                    `;
                    tableBody.appendChild(row);
                });
            }
        }
    };

    // --- Load Borrowed Books ---
    onValue(borrowedRef, (borrowedSnapshot) => {
        borrowedData = [];
        borrowedSnapshot.forEach((borrowedChildSnapshot) => {
            const borrowed = borrowedChildSnapshot.val();
            if (borrowed.borrowedBy === userId) {
                borrowedData.push({
                    title: borrowed.title,
                    author: borrowed.author,
                    imageUrl: borrowed.imageUrl,
                    price: borrowed.price,
                    transactionDate: borrowed.borrowedAt,
                    type: 'Borrowed',
                });
            }
        });
        borrowedLoaded = true;
        checkAndRender();
    }, (error) => {
        console.error('Error loading borrowed books:', error);
        borrowedLoaded = true; // Ensure checkAndRender is called even on error to prevent hang
        checkAndRender();
    });

    // --- Load Purchased Books ---
    onValue(purchasedRef, (purchasedSnapshot) => {
        purchasedData = [];
        purchasedSnapshot.forEach((purchasedChildSnapshot) => {
            const purchased = purchasedChildSnapshot.val();
            if (purchased.purchasedBy === userId) {
                purchasedData.push({
                    title: purchased.title,
                    author: purchased.author,
                    imageUrl: purchased.imageUrl,
                    price: purchased.price,
                    transactionDate: purchased.purchasedAt,
                    type: 'Purchased',
                });
            }
        });
        purchasedLoaded = true;
        checkAndRender();
    }, (error) => {
        console.error('Error loading purchased books:', error);
         purchasedLoaded = true;  // Ensure checkAndRender is called even on error
        checkAndRender();
    });
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
    const noResults = document.getElementById('noResults');
    const searchInput = document.getElementById('searchInput');
    if (!bookList || !searchInput) return;

    const allBooks = [];
    snapshot.forEach((bookSnapshot) => {
      const book = bookSnapshot.val();
      const bookId = bookSnapshot.key;
      if (book.borrowedBy === userId) {
        allBooks.push({ book, bookId });
      }
    });

    const renderFilteredBooks = () => {
      const query = searchInput.value.toLowerCase();
      const filteredBooks = allBooks.filter(({ book }) =>
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query)
      );

      bookList.innerHTML = '';
      if (filteredBooks.length === 0) {
        noResults.classList.remove('hidden');
        return;
      } else {
        noResults.classList.add('hidden');
      }

      filteredBooks.forEach(({ book, bookId }) => {
        const bookListItem = `
          <li>
            <h3>${book.title}</h3>
            <p>by ${book.author}</p>
            ${book.imageUrl ? `
              <div class="book-image">
                <img src="${book.imageUrl}" alt="${book.title}" onerror="this.style.display='none';">
              </div>` : ''}
            <p>₱${parseFloat(book.price).toFixed(2)}</p>
            <button class="see-more-btn" data-book-id="${bookId}">See More</button>
          </li>
        `;
        bookList.insertAdjacentHTML('beforeend', bookListItem);
      });

      // Attach modal logic
      document.querySelectorAll('.see-more-btn').forEach(button => {
        button.addEventListener('click', () => {
          const bookId = button.getAttribute('data-book-id');
          const book = snapshot.val()[bookId];
          showModalReturn(book, bookId);
        });
      });
    };

    // Initial render
    renderFilteredBooks();

    // Re-filter whenever user types
    searchInput.addEventListener('input', renderFilteredBooks);
  }, (error) => {
    console.error('Error loading user\'s books:', error);
  });
}

function showModalBorrow(book, bookId = null) {
  const modal = document.getElementById('bookModal');
  const adminActions = document.getElementById('adminActions');

  document.getElementById('modalTitle').textContent = book.title;
  document.getElementById('modalAuthor').textContent = book.author;
  document.getElementById('modalImage').src = book.imageUrl;
  document.getElementById('modalImage').alt = book.title;
  document.getElementById('modalDescription').textContent = book.description || 'No description available.';
  document.getElementById('modalPrice').textContent = parseFloat(book.price).toFixed(2);
  document.getElementById('modalAvailability').textContent = book.available ? 'Available' : 'Not Available';

  // Hide admin actions by default
  if (adminActions) adminActions.style.display = 'none';

  // Check admin status
  const userId = localStorage.getItem('loggedInUserId');
  if (userId) {
    const userRef = doc(db, "users", userId);
    getDoc(userRef).then((docSnap) => {
      if (docSnap.exists() && docSnap.data().admin) {
        // Show admin actions if admin
        if (adminActions) {
          adminActions.style.display = 'block';
          const deleteBtn = document.getElementById('deleteBtn');
          if (deleteBtn) {
            deleteBtn.onclick = () => {
              deleteBook(bookId);
              modal.classList.add('hidden');
            };
          }
        }
      }
    }).catch((error) => {
      console.error('Error checking admin status:', error);
    });
  }

  modal.classList.remove('hidden'); // Show modal

  document.getElementById('borrowBtn').onclick = () => {
    borrowBook(book, bookId);
    modal.classList.add('hidden');
  };

  document.getElementById('buyBtn').onclick = () => {
    buyBook(book, bookId);
    modal.classList.add('hidden');
  };

  const closeModal = () => modal.classList.add('hidden');

  window.onclick = (event) => {
    if (event.target === modal) {
      closeModal();
    }
  };

  document.getElementById('cancelBtn').onclick = closeModal;
}


function showModalReturn(book, bookId = null) {
    const modal = document.getElementById('bookModal');
    document.getElementById('modalTitle').textContent = book.title;
    document.getElementById('modalAuthor').textContent = book.author;
    document.getElementById('modalImage').src = book.imageUrl;
    document.getElementById('modalImage').alt = book.title;
    document.getElementById('modalDescription').textContent = book.description || 'No description available.';
    document.getElementById('modalPrice').textContent = parseFloat(book.price).toFixed(2);
    document.getElementById('modalAvailability').textContent = book.available ? 'Available' : 'Not Available';

    modal.classList.remove('hidden'); // Show the modal

    const closeModal = () => modal.classList.add('hidden');

    window.onclick = (event) => {
        if (event.target === modal) {
            closeModal();
        }
    };

    document.getElementById('cancelBtn').onclick = closeModal;

    document.getElementById('buyBtn').onclick = () => {
    buyBook(book, bookId);
    modal.classList.add('hidden');
    };

    document.getElementById('returnBtn').onclick = () =>{
      returnBook(bookId);
      modal.classList.add('hidden');
    }
}

let allBooks = []; // Global variable to store all books

function renderBooks(filteredBooks) {
  console.log("renderBooks called with:", filteredBooks);
  const bookList = document.getElementById('booklist');
  bookList.innerHTML = '';

  filteredBooks.forEach(({ book, bookId }) => {
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
      showModalBorrow(book, bookId);
    });

    bookList.appendChild(bookListItem);
  });
}

async function deleteBook(bookId) {
  const db = getDatabase();
  const bookRef = ref(db, `books/${bookId}`);

  try {
    await set(bookRef, {
      ...allBooks.find(b => b.bookId === bookId).book,
      active: false
    });
    showMessage('Book deleted successfully.', 'bookMessage', 'success');
  } catch (error) {
    console.error('Error deleting book:', error);
    showMessage('Failed to delete book.', 'bookMessage', 'error');
  }
}

async function returnBook(bookId) {
  const db = getDatabase();

  try {
    // Set book as available again
    const bookAvailableRef = ref(db, `books/${bookId}/available`);
    await set(bookAvailableRef, true);

    // Mark borrowed entry as returned
    const borrowedRef = ref(db, `borrowed/${bookId}/returned`);
    await set(borrowedRef, true);

    showMessage('Book returned successfully!', 'bookMessage', 'success');

    // Optionally, you can refresh the book list or update the UI here
  } catch (error) {
    console.error("Error returning book:", error);
    showMessage(`Failed to return book: ${error.message}`, 'bookMessage', 'error');
  }
}


export { addBook, loadBooks, loadBorrowedBooks, loadBorrowedBooksTable, buyBook };