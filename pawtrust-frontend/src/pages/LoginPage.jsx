import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    setEmail("");
    setPassword("");
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5001/pawtrust/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      // Save login info to localStorage
      localStorage.setItem("userId", data.user._id);
      localStorage.setItem("role", data.user.userType);
      localStorage.setItem("name", data.user.name);

      // ✅ 清空输入框
      setEmail("");
      setPassword("");

      // Redirect based on role
      navigate(`/${data.user.userType}`);
    } catch (err) {
      setPassword(""); // 登录失败也清空密码
      alert("Login failed: " + err.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <h1 className="text-3xl font-bold mb-6">PawTrust</h1>
      <form
        onSubmit={handleLogin}
        className="bg-white p-6 rounded-xl shadow-lg w-full max-w-sm space-y-4"
      >
        <h2 className="text-xl font-semibold text-center">Login</h2>

        <input
          type="email"
          placeholder="Email"
          autoComplete="off" // ✅ 防止浏览器填充旧值
          className="w-full border px-3 py-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          autoComplete="off"
          className="w-full border px-3 py-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
        >
          Login
        </button>

        <p className="text-sm text-gray-500 text-center">
          Don't have an account?{" "}
          <a href="/register" className="text-blue-600 underline">
            Register here
          </a>
        </p>
      </form>
    </div>
  );
}
