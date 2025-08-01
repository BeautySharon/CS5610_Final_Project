import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    userType: "owner", // default role
    location: "",
    bio: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5001/pawtrust/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Registration failed");
      }

      // Save to localStorage
      localStorage.setItem("userId", data.user._id);
      localStorage.setItem("role", data.user.userType);
      localStorage.setItem("name", data.user.name);

      // Optional: reset form
      setFormData({
        name: "",
        email: "",
        password: "",
        userType: "owner",
        location: "",
        bio: "",
      });

      // Redirect
      navigate(`/${data.user.userType}`);
    } catch (err) {
      alert("Register failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <form
        onSubmit={handleRegister}
        className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md space-y-4"
      >
        <h2 className="text-2xl font-bold text-center mb-4">Register</h2>

        <input
          name="name"
          type="text"
          placeholder="Full Name"
          className="w-full border px-3 py-2"
          onChange={handleChange}
          value={formData.name}
          required
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          className="w-full border px-3 py-2"
          onChange={handleChange}
          value={formData.email}
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          className="w-full border px-3 py-2"
          onChange={handleChange}
          value={formData.password}
          required
        />

        <select
          name="userType"
          className="w-full border px-3 py-2"
          onChange={handleChange}
          value={formData.userType}
        >
          <option value="owner">Pet Owner</option>
          <option value="sitter">Pet Sitter</option>
        </select>

        <input
          name="location"
          type="text"
          placeholder="Location (e.g. San Jose, CA)"
          className="w-full border px-3 py-2"
          onChange={handleChange}
          value={formData.location}
        />
        <textarea
          name="bio"
          placeholder="Short bio"
          className="w-full border px-3 py-2"
          rows={3}
          onChange={handleChange}
          value={formData.bio}
        />

        <button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded"
          disabled={loading}
        >
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
    </div>
  );
}
