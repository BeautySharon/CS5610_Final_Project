import { useState } from "react";

export default function PostTaskForm() {
  const [form, setForm] = useState({
    petType: "",
    description: "",
    date: "",
    duration: "",
    location: "",
    status: "open",
  });

  const owner_id = localStorage.getItem("userId");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch("http://localhost:5001/pawtrust/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...form, owner_id }),
    });

    const data = await res.json();
    // console.log("Response from server:", data);
    if (res.ok) {
      alert("Task posted!");
    } else {
      alert("Failed to post task: " + (data.error || "Unknown error"));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <input name="petType" placeholder="Pet Type" onChange={handleChange} />
      <textarea
        name="description"
        placeholder="Description"
        onChange={handleChange}
      />
      <input name="date" type="datetime-local" onChange={handleChange} />
      <input name="duration" placeholder="Duration" onChange={handleChange} />
      <input name="location" placeholder="Location" onChange={handleChange} />
      <button
        type="submit"
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        Post Task
      </button>
    </form>
  );
}
