// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { BASE_URL } from "../config";

// export default function RegisterPage() {
//   const navigate = useNavigate();
//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     password: "",
//     userType: "owner", // default role
//     location: "",
//     bio: "",
//   });

//   const [loading, setLoading] = useState(false);

//   const handleChange = (e) => {
//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value,
//     });
//   };

//   const handleRegister = async (e) => {
//     e.preventDefault();
//     setLoading(true);

//     try {
//       // const res = await fetch("http://localhost:5001/pawtrust/register", {
//       const res = await fetch(`${BASE_URL}/pawtrust/register`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(formData),
//       });

//       const data = await res.json();
//       if (!res.ok) {
//         throw new Error(data?.message || "Registration failed");
//       }

//       // Save to localStorage
//       localStorage.setItem("userId", data.user._id);
//       localStorage.setItem("role", data.user.userType);
//       localStorage.setItem("name", data.user.name);

//       // Optional: reset form
//       setFormData({
//         name: "",
//         email: "",
//         password: "",
//         userType: "owner",
//         location: "",
//         bio: "",
//       });

//       // Redirect
//       navigate(`/${data.user.userType}`);
//     } catch (err) {
//       alert("Register failed: " + err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
//       <form
//         onSubmit={handleRegister}
//         className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md space-y-4"
//       >
//         <h2 className="text-2xl font-bold text-center mb-4">Register</h2>

//         <input
//           name="name"
//           type="text"
//           placeholder="Full Name"
//           className="w-full border px-3 py-2"
//           onChange={handleChange}
//           value={formData.name}
//           required
//         />
//         <input
//           name="email"
//           type="email"
//           placeholder="Email"
//           className="w-full border px-3 py-2"
//           onChange={handleChange}
//           value={formData.email}
//           required
//         />
//         <input
//           name="password"
//           type="password"
//           placeholder="Password"
//           className="w-full border px-3 py-2"
//           onChange={handleChange}
//           value={formData.password}
//           required
//         />

//         <select
//           name="userType"
//           className="w-full border px-3 py-2"
//           onChange={handleChange}
//           value={formData.userType}
//         >
//           <option value="owner">Pet Owner</option>
//           <option value="sitter">Pet Sitter</option>
//         </select>

//         <input
//           name="location"
//           type="text"
//           placeholder="Location (e.g. San Jose, CA)"
//           className="w-full border px-3 py-2"
//           onChange={handleChange}
//           value={formData.location}
//         />
//         <textarea
//           name="bio"
//           placeholder="Short bio"
//           className="w-full border px-3 py-2"
//           rows={3}
//           onChange={handleChange}
//           value={formData.bio}
//         />

//         <button
//           type="submit"
//           className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded"
//           disabled={loading}
//         >
//           {loading ? "Registering..." : "Register"}
//         </button>
//       </form>
//     </div>
//   );
// }
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../config";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    userType: "owner",
    location: "",
    bio: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleChange = (e) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErr("");

    // 最小校验（可按需加）
    if (!formData.name || !formData.email || !formData.password) {
      setErr("Please fill in name, email, and password.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/pawtrust/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Registration failed.");

      localStorage.setItem("userId", data.user._id);
      localStorage.setItem("role", data.user.userType);
      localStorage.setItem("name", data.user.name);

      setFormData({
        name: "",
        email: "",
        password: "",
        userType: "owner",
        location: "",
        bio: "",
      });

      navigate(`/${data.user.userType}`);
    } catch (e) {
      setErr(e.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* 背景：渐变 + 细网格纹理（与登录页一致） */}
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
          {/* 标题 */}
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Register
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Create your PawTrust account
            </p>
          </div>

          {/* 卡片 */}
          <div className="rounded-2xl bg-white/80 backdrop-blur shadow-xl ring-1 ring-black/5 p-6">
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Name */}
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  Full Name
                </span>
                <input
                  name="name"
                  type="text"
                  placeholder="Full Name"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                  onChange={handleChange}
                  value={formData.name}
                  required
                />
              </label>

              {/* Email */}
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  Email
                </span>
                <input
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                  onChange={handleChange}
                  value={formData.email}
                  required
                />
              </label>

              {/* Password + 显隐 */}
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  Password
                </span>
                <div className="relative">
                  <input
                    name="password"
                    type={showPw ? "text" : "password"}
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 pr-16 text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                    onChange={handleChange}
                    value={formData.password}
                    required
                    minLength={6}
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

              {/* Role */}
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  Role
                </span>
                <select
                  name="userType"
                  className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                  onChange={handleChange}
                  value={formData.userType}
                >
                  <option value="owner">Pet Owner</option>
                  <option value="sitter">Pet Sitter</option>
                </select>
              </label>

              {/* Location */}
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  Location
                </span>
                <input
                  name="location"
                  type="text"
                  placeholder="e.g., San Jose, CA"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                  onChange={handleChange}
                  value={formData.location}
                />
              </label>

              {/* Bio */}
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  Short bio
                </span>
                <textarea
                  name="bio"
                  rows={3}
                  placeholder="Tell us a bit about yourself"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                  onChange={handleChange}
                  value={formData.bio}
                />
              </label>

              {/* 错误提示 */}
              {err && (
                <div className="rounded-lg bg-red-50 text-red-700 px-3 py-2 text-sm border border-red-200">
                  {err}
                </div>
              )}

              {/* 提交按钮 */}
              <button
                type="submit"
                className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 font-medium text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? "Registering..." : "Register"}
              </button>
            </form>

            {/* 已有账号 */}
            <p className="mt-4 text-center text-sm text-slate-600">
              Already have an account?{" "}
              <a
                href="/"
                className="font-medium text-indigo-600 hover:underline"
              >
                Log in
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
