importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyDnjOUeAWRprZPwxCHAyflE0Fy5SG_rsYo",
  authDomain: "vehicle-resuce-13e96.firebaseapp.com",
  projectId: "vehicle-resuce-13e96",
  storageBucket: "vehicle-resuce-13e96.firebasestorage.app",
  messagingSenderId: "414123737679",
  appId: "1:414123737679:web:db72d0648db3ddb523603a",
  measurementId: "G-B6VBJ727HM"
};

// Khởi tạo Firebase trong Service Worker
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Nhận thông báo khi web đang tắt/chạy ngầm
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Nhận được thông báo ngầm: ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png' // Thay bằng đường dẫn icon của bạn nếu có
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});