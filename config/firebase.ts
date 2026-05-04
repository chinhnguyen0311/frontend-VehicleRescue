import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";
const firebaseConfig = {
  apiKey : "AIzaSyDnjOUeAWRprZPwxCHAyflE0Fy5SG_rsYo" , 
  authDomain : "vehicle-resuce-13e96.firebaseapp.com" , 
  projectId : "vehicle-resuce-13e96" , 
  storageBucket : "vehicle-resuce-13e96.firebasestorage.app" , 
  messagingSenderId : "414123737679" , 
  appId : "1:414123737679:web:db72d0648db3ddb523603a" , 
  measurementId : "G-B6VBJ727HM" 
};
const app = initializeApp(firebaseConfig);

export const messaging = getMessaging(app);