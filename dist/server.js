import express from "express";
const app = express();
app.get("/", (req, res) => res.send("Hey"));
app.listen(3001, () => {
    console.log("Started");
});
//# sourceMappingURL=server.js.map