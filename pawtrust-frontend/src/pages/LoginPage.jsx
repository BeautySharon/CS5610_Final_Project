// import { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { BASE_URL } from "../config";

// export default function LoginPage() {
//   const navigate = useNavigate();

//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");

//   useEffect(() => {
//     setEmail("");
//     setPassword("");
//   }, []);

//   const handleLogin = async (e) => {
//     e.preventDefault();

//     try {
//       // const res = await fetch("http://localhost:5001/pawtrust/login", {
//       const res = await fetch(`${BASE_URL}/pawtrust/login`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ email, password }),
//       });

//       const data = await res.json();
//       if (!res.ok) throw new Error(data.message);

//       // Save login info to localStorage
//       localStorage.setItem("userId", data.user._id);
//       localStorage.setItem("role", data.user.userType);
//       localStorage.setItem("name", data.user.name);

//       // Optional: reset form fields
//       setEmail("");
//       setPassword("");

//       // Redirect based on role
//       navigate(`/${data.user.userType}`);
//     } catch (err) {
//       setPassword(""); // Clear password field on error
//       alert("Login failed: " + err.message);
//     }
//   };

//   return (
//     <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
//       <h1 className="text-3xl font-bold mb-6">PawTrust</h1>
//       <form
//         onSubmit={handleLogin}
//         className="bg-white p-6 rounded-xl shadow-lg w-full max-w-sm space-y-4"
//       >
//         <h2 className="text-xl font-semibold text-center">Login</h2>

//         <input
//           type="email"
//           placeholder="Email"
//           autoComplete="off"
//           className="w-full border px-3 py-2 rounded"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           required
//         />

//         <input
//           type="password"
//           placeholder="Password"
//           autoComplete="off"
//           className="w-full border px-3 py-2 rounded"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//           required
//         />

//         <button
//           type="submit"
//           className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
//         >
//           Login
//         </button>

//         <p className="text-sm text-gray-500 text-center">
//           Don't have an account?{" "}
//           <a href="/register" className="text-blue-600 underline">
//             Register here
//           </a>
//         </p>
//       </form>
//     </div>
//   );
// }
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../config";

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    setEmail("");
    setPw("");
    setErr("");
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErr("");

    if (!email || !pw) {
      setErr("Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${BASE_URL}/pawtrust/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pw }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Login failed.");

      // Save login info to localStorage
      localStorage.setItem("userId", data.user._id);
      localStorage.setItem("role", data.user.userType);
      localStorage.setItem("name", data.user.name);

      // Reset
      setEmail("");
      setPw("");

      // Redirect by role
      navigate(`/${data.user.userType}`);
    } catch (e) {
      setPw("");
      setErr(e.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* 背景：渐变 + 细网格纹理 */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-sky-50" />
      <div
        className="absolute inset-0 opacity-[0.12] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
          backgroundSize: "12px 12px",
        }}
      />

      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-md">
          {/* 品牌区 */}
          <div className="mb-6 text-center text-indigo-600">
            <div className="mx-auto mb-2 h-12 w-12 rounded-2xl bg-indigo-600/10 flex items-center justify-center">
              <div className="relative h-5 w-5">
                <span className="absolute inset-0 rounded-full bg-indigo-600" />
                <span className="absolute -top-2 -left-2 h-2.5 w-2.5 rounded-full bg-indigo-600" />
                <span className="absolute -top-2 -right-2 h-2.5 w-2.5 rounded-full bg-indigo-600" />
                <span className="absolute -left-2 top-2 h-2.5 w-2.5 rounded-full bg-indigo-600" />
                <span className="absolute -right-2 top-2 h-2.5 w-2.5 rounded-full bg-indigo-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              PawTrust
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Welcome back—sign in to continue
            </p>
          </div>

          {/* 登录卡片 */}
          <div className="rounded-2xl bg-white/80 backdrop-blur shadow-xl ring-1 ring-black/5 p-6 transition hover:shadow-2xl">
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email */}
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  Email
                </span>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 pr-10 text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 inline-flex items-center text-slate-400">
                    @
                  </span>
                </div>
              </label>

              {/* Password */}
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  Password
                </span>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 pr-16 text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute inset-y-0 right-2 inline-flex items-center rounded-lg px-2 text-xs text-slate-500 hover:bg-slate-100"
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw ? "Hide" : "Show"}
                  </button>
                </div>
              </label>

              {/* 错误提示 */}
              {err && (
                <div className="rounded-lg bg-red-50 text-red-700 px-3 py-2 text-sm border border-red-200">
                  {err}
                </div>
              )}

              {/* 登录按钮 */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 font-medium text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Signing in..." : "Login"}
              </button>
            </form>

            {/* 注册 */}
            <p className="mt-4 text-center text-sm text-slate-600">
              Don’t have an account?{" "}
              <a
                href="/register"
                className="font-medium text-indigo-600 hover:underline"
              >
                Register here
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
