import { auth, db } from './firebaseconfig.js';
import { onAuthStateChanged, updateProfile, updateEmail, updatePassword, EmailAuthProvider , reauthenticateWithCredential} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { loadBorrowedBooksTable } from './firebaseauth.js';


const emailInput = document.getElementById("email");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("newPassword");
const profileForm = document.getElementById("profileForm");
const messageDiv = document.getElementById("profileMessage");
const depositBtn = document.getElementById("depositButton");
const depositModal = document.getElementById("depositModal");
const submitDeposit = document.getElementById("submitDeposit");
const cancelDeposit = document.getElementById("cancelDeposit");
const depositAmountInput = document.getElementById("depositAmount");

let currentUser = null;


onAuthStateChanged(auth, async (user) => {
  if (user) {

    loadBorrowedBooksTable();
    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);
    console.log("Auth state changed:", user);

    if (docSnap.exists()) {
      const userData = docSnap.data();
      const balance = userData.balance || 0;
      document.getElementById("userBalance").textContent =  `₱${parseFloat(balance).toFixed(2)}`;
    }
  

    currentUser = user;
    emailInput.value = user.email || "";
    usernameInput.value = user.displayName || "";


  } else {
    window.location.href = "signin.html";
  }
});

profileForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentUser) return;

  const newEmail = emailInput.value.trim();
  const newUsername = usernameInput.value.trim();
  const newPassword = passwordInput.value.trim();

  try {
    const needReauth = (newEmail !== currentUser.email || newPassword);

    if (needReauth) {
      const currentPassword = prompt("Please enter your current password to confirm changes:");
      if (!currentPassword) throw new Error("Current password is required.");

      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
    }

    if (newEmail !== currentUser.email) {
      await updateEmail(currentUser, newEmail);
    }

    if (newUsername !== currentUser.displayName) {
      await updateProfile(currentUser, { displayName: newUsername });
    }

    if (newPassword) {
      await updatePassword(currentUser, newPassword);
    }


    const userDocRef = doc(db, "users", currentUser.uid);
    await updateDoc(userDocRef, {
      email: newEmail,
      username: newUsername
    });

    showMessage("Profile updated successfully!", "success");
    passwordInput.value = "";
  } catch (error) {
    console.error(error);
    showMessage(error.message, "error");
  }
});

depositBtn.addEventListener("click", () => {
  depositModal.classList.remove("hidden");
});

cancelDeposit.addEventListener("click", () => {
  depositModal.classList.add("hidden");
  depositAmountInput.value = "";
});

submitDeposit.addEventListener("click", async () => {
  const amount = parseFloat(depositAmountInput.value);
  if (isNaN(amount) || amount <= 0) {
    alert("Please enter a valid amount.");
    return;
  }

  try {
    const userDocRef = doc(db, "users", currentUser.uid);
    const userDocSnap = await getDoc(userDocRef);
    const currentBalance = userDocSnap.exists() ? userDocSnap.data().balance || 0 : 0;
    const newBalance = currentBalance + amount;

    await updateDoc(userDocRef, { balance: newBalance });

    document.getElementById("userBalance").textContent = `₱${newBalance.toFixed(2)}`;
    showMessage("Deposit successful!", "success");

  } catch (error) {
    showMessage("Failed to deposit: " + error.message, "error");
  } finally {
    depositModal.classList.add("hidden");
    depositAmountInput.value = "";
  }
});


function showMessage(msg, type = "success") {
  messageDiv.textContent = msg;
  messageDiv.style.display = "block";
  messageDiv.style.backgroundColor = type === "success" ? "green" : "red";
  messageDiv.style.opacity = 1;

  setTimeout(() => {
    messageDiv.style.opacity = 0;
  }, 5000);
}