import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.9/firebase-app.js";
  
  
  // Your web app's Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyBrcprj6HQuuxaRQk3QN3xix3J-Ecct-7I",
    authDomain: "updatebimsc.firebaseapp.com",
    projectId: "updatebimsc",
    storageBucket: "updatebimsc.appspot.com",
    messagingSenderId: "1009229988981",
    appId: "1:1009229988981:web:fafe21f6f2be6b500ea43c"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);

  //Set database variable

  const database = app.database()

  function save(){
      var email = document.getElementById('email').value
      var email = document.getElementById('password').value
      var email = document.getElementById('username').value
      var email = document.getElementById('saysomething').value
      var email = document.getElementById('favorite').value

      database.ref('users/' + username).set({
          email : email,
          password : password,
          username : username,
          saysomething : saysomething,
          favorite : favorite


      })
    
    alert('Saved')
  }