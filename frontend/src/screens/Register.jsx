import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../config/axios";
import { UserContext } from "../context/UserProvider";

// Registration page component
const Register = () => {
  // State for form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Access user context
  const { setUser } = useContext(UserContext);
  // Navigation hook
  const navigate = useNavigate();

  // Handle form submission for registration
  const submitHandler = (e) => {
    e.preventDefault();
    axios.post("/users/register", { name, email, password })
      .then((res) => {
        localStorage.setItem("token", res.data.token);
        setUser(res.data.user);
        navigate("/login");
      }).catch(console.error);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-green-900/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-2xl p-8 shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Get Started</h1>
          <p className="text-gray-400">Create your account</p>
        </div>
        <form onSubmit={submitHandler} className="space-y-6">
          <div>
            <label className="block text-gray-300 mb-2">Full Name</label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your name"
                required
              />
              <i className="ri-user-line absolute right-4 top-3 text-gray-400"></i>
            </div>
          </div>
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
          <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-all">
            Register
          </button>
        </form>
        <div className="text-center mt-6">
          <span className="text-gray-400">Already have an account? </span>
          <Link to="/login" className="text-blue-400 hover:underline">Login</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;