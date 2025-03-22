const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
const MONGO_URI = "mongodb://localhost:27017/todoapp";
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

// Todo Schema and Model
const todoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: false },
  completed: { type: Boolean, default: false },
});
const Todo = mongoose.model("Todo", todoSchema);

// Trash Schema and Model
const trashSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: false },
  completed: { type: Boolean, default: false },
  deletedAt: { type: Date, default: Date.now },
});
const Trash = mongoose.model("Trash", trashSchema);

// Routes
// Create a new Todo
app.post("/api/todos", async (req, res) => {
  try {
    const { title, description, completed } = req.body;
    const todo = new Todo({
      title,
      description,
      completed,
    });
    await todo.save();
    res.status(201).json(todo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all Todos
app.get("/api/todos", async (req, res) => {
  try {
    const todos = await Todo.find();
    res.status(200).json(todos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a Todo
app.put("/api/todos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, completed, description } = req.body;
    const todo = await Todo.findByIdAndUpdate(
      id,
      { title, completed, description },
      { new: true }
    );
    res.status(200).json(todo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a Todo (Move to Trash)
app.delete("/api/todos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const todo = await Todo.findById(id);
    if (!todo) {
      return res.status(404).json({ error: "Todo not found" });
    }

    // Move to Trash
    const trashedTodo = new Trash({
      title: todo.title,
      description: todo.description,
      completed: todo.completed,
    });
    await trashedTodo.save();

    // Delete from Todos
    await Todo.findByIdAndDelete(id);

    res.status(200).json({ message: "Todo moved to trash successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all Trashed Todos
app.get("/api/trash", async (req, res) => {
  try {
    const trashedTodos = await Trash.find();
    res.status(200).json(trashedTodos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Restore a Trashed Todo
app.post("/api/trash/restore/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const trashedTodo = await Trash.findById(id);
    if (!trashedTodo) {
      return res.status(404).json({ error: "Trashed todo not found" });
    }

    // Restore to Todos
    const restoredTodo = new Todo({
      title: trashedTodo.title,
      description: trashedTodo.description,
      completed: trashedTodo.completed,
    });
    await restoredTodo.save();

    // Delete from Trash
    await Trash.findByIdAndDelete(id);

    res.status(200).json({ message: "Todo restored successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a Trashed Todo Permanently
app.delete("/api/trash/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Trash.findByIdAndDelete(id);
    res.status(200).json({ message: "Trashed todo deleted permanently" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Server
const PORT = 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));