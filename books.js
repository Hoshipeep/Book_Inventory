import { loadBooks, addBook } from './firebaseauth.js';

document.addEventListener('DOMContentLoaded', () => {
  loadBooks();

  const addBookForm = document.getElementById('addBookForm');

  if (addBookForm) {
    addBookForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const title = document.getElementById('title').value;
      const author = document.getElementById('author').value;
      const imageUrl = document.getElementById('imageUrl').value;
      await addBook(title, author, imageUrl);
      addBookForm.reset();
      window.location.href = 'books.html';
    });
  }
});