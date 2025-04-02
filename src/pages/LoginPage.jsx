import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    const ADMIN_ID = 'gun@wisebirds.jp';
    const ADMIN_PASS = 'wisebirdsJP';
    console.log("🧪 handleLogin 실행됨");
    console.log('입력된 아이디:', `"${email.trim()}"`);
    console.log('입력된 비밀번호:', `"${password}"`);
    console.log('정답 아이디:', `"${ADMIN_ID}"`);
    console.log('정답 비밀번호:', `"${ADMIN_PASS}"`);
  
    if (email.trim() === ADMIN_ID && password === ADMIN_PASS) {
      localStorage.setItem('auth', 'true');
      window.location.href = '/dashboard'; 
    } else {
        console.log("❌ 로그인 실패");  
      setError('아이디 또는 비밀번호가 올바르지 않습니다.');
    }
  };
  

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-10">
        {/* 로고 */}
        <div className="flex justify-center mb-8">
          <img src="/images/logo2.png" alt="BYUL Clinic Logo" className="h-12" />
        </div>

        {/* 로그인 폼 */}
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A9 9 0 1112 21a9 9 0 01-6.879-3.196z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="이메일"
              className="w-full pl-10 pr-4 py-2 border-b border-gray-300 focus:outline-none focus:border-gray-600 text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c1.1 0 2 .9 2 2v3H10v-3c0-1.1.9-2 2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 11V9a5 5 0 00-10 0v2" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 11h14v10H5V11z" />
              </svg>
            </span>
            <input
              type="password"
              placeholder="비밀번호 입력"
              className="w-full pl-10 pr-4 py-2 border-b border-gray-300 focus:outline-none focus:border-gray-600 text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button
            type="submit"
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 rounded-md transition"
          >
            LOGIN
          </button>
        </form>
      </div>
    </div>
  );
}
