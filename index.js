import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, getDoc, doc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDTjuuiKk6JTN-X1r_JsENwOLePcPmY7W0",
    authDomain: "library-system-6738d.firebaseapp.com",
    projectId: "library-system-6738d",
    storageBucket: "library-system-6738d.appspot.com",
    messagingSenderId: "557477699859",
    appId: "1:557477699859:web:ca2d331a1645bc3d91bae6"
  };
  
  const app = initializeApp(firebaseConfig);

  const auth=getAuth();
  const db=getFirestore();


  onAuthStateChanged(auth, (user)=>{
    const loggedInUserId=localStorage.getItem('loggedInUserId');
    if(loggedInUserId){
        const docRef = doc(db, "users", loggedInUserId);
        getDoc(docRef)
        .then((docSnap)=>{
            if(docSnap.exists()){
                const userData=docSnap.data();
                document.getElementById('loggedUserusername').innerText=userData.username;
                document.getElementById('loggedUseremail').innerText=userData.email;
            }
            else{
                console.log("no document found matching id")
            }
        })
        .catch((error)=>{
            console.log("Error getting doc")
        })
    }
    else{
        console.log("User Id not found")
    }
  })

