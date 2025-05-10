import { app, db, auth } from './firebaseconfig.js';
import { onAuthStateChanged, signOut} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getDoc, doc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";


  onAuthStateChanged(auth, (user)=>{

    const welcomeMessageElement = document.querySelector('.container h1');

    const loggedInUserId=localStorage.getItem('loggedInUserId');

    if(loggedInUserId){
        const docRef = doc(db, "users", loggedInUserId);
        console.log("loggedInUserId:", loggedInUserId);
        getDoc(docRef)
        .then((docSnap)=>{
            if(docSnap.exists()){
                const userData=docSnap.data();
                const username = userData.username;

                welcomeMessageElement.textContent = `Welcome to the Library, ${username}!`;
            }
            else{
                console.log("no document found matching id")
            }
        })
        .catch((error)=>{
            console.error("Error getting doc: ", error)
        })
    }
    else{
        console.log("User Id not found")
    }
  })

