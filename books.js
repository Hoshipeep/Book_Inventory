import { loadBooks, addBook } from './firebaseauth.js';

document.addEventListener('DOMContentLoaded', () => {
  loadBooks();
  const formWrapper = document.getElementById('addBookWrapper');
  const showFormButton = document.getElementById('showAddForm');
  const addBookForm = document.getElementById('addBookForm');

  formWrapper.style.display = 'none';

  showFormButton.addEventListener('click', () => {
    formWrapper.style.display = 'block';
  });

  if (addBookForm) {
    addBookForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const title = document.getElementById('title').value;
      const author = document.getElementById('author').value;
      const imageUrl = document.getElementById('imageUrl').value;
      await addBook(title, author, imageUrl);
      addBookForm.reset();
      formWrapper.style.display = 'none';
    });
  }
});