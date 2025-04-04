// firebase.js

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Firebase 설정 (복사한 설정 그대로 사용하면 됩니다!)
const firebaseConfig = {
  apiKey: "REDACTED",
  authDomain: "byulads.firebaseapp.com",
  projectId: "byulads",
  storageBucket: "byulads.firebasestorage.app",
  messagingSenderId: "261883348739",
  appId: "1:261883348739:web:a6b90e2bfbeb1e59114b36"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// Firestore 데이터베이스 초기화
const db = getFirestore(app);

// 다른 파일에서도 쉽게 사용하도록 내보내기
export { db };
