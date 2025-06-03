import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../config/axios";
import { UserContext } from "../context/UserProvider";

// Login page component
const Login = () => {
  // State for form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Access user context
  const { setUser } = useContext(UserContext);
  // Navigation hook
  const navigate = useNavigate();

  // Handle form submission for login
  const submitHandler = (e) => {
    e.preventDefault();
    axios.post('/users/login', { email, password })
      .then((res) => {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        navigate('/');
      }).catch(console.error);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-2xl p-8 shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-gray-400">Sign in to continue</p>
        </div>
        <form onSubmit={submitHandler} className="space-y-6">
          <div>
            <label className="block text-gray-300 mb-2">Email</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email"
                required
              />
              <i className="ri-mail-line absolute right-4 top-3 text-gray-400"></i>
            </div>
          </div>
          <div>
            <label className="block text-gray-300 mb-2">Password</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your password"
                required
              />
              <i className="ri-lock-password-line absolute right-4 top-3 text-gray-400"></i>
            </div>
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-all">
            Login
          </button>
        </form>
        <div className="text-center mt-6">
          <span className="text-gray-400">Don't have an account? </span>
          <Link to="/register" className="text-blue-400 hover:underline">Register</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;