import express from "express";
import app from "./app.js";

app.get("/health", (req, res) => {
  res.send("OK");
});
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
