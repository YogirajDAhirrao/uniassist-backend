import app from "./app.js";
app.get("/", (req, res) => {
    res.send("Test");
});
app.listen(3001, () => {
    console.log("Started");
});
//# sourceMappingURL=server.js.map