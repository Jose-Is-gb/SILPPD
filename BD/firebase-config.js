// ===============================
// firebase-config.js — Inicialización de Firebase (Cloud)
// ===============================

// Tu configuración de Firebase extraída del console
const firebaseConfig = {
    apiKey: "AIzaSyAm2lfW4BGMsKgbKQZE6SeoyV8jQ-tX-3A",
    authDomain: "silppd-4e248.firebaseapp.com",
    projectId: "silppd-4e248",
    storageBucket: "silppd-4e248.firebasestorage.app",
    messagingSenderId: "958355743113",
    appId: "1:958355743113:web:9db87f25390f6afdff4158",
    measurementId: "G-G3WQ1H8FW8"
};

// Inicializar Firebase (Modo Compatibility)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Referencias globales a servicios para usar en toda la app
const dbFirestore = firebase.firestore();
const authFirebase = firebase.auth();

console.log("🔥 Firebase (Cloud) conectado exitosamente.");