const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const PORT = 5000;
const sidebarRouter = require('./Routes/sidebar_router');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(`${__dirname}/assets`));

app.get("/", (req, res) => {
  res.sendFile("assets/index.html", { root: __dirname });
});

app.use('/', sidebarRouter);

app.listen(PORT, async () => {
  const open = await import('open');
  await open.default(`http://localhost:${PORT}`);
  console.log(`Server running on port ${PORT}`);
});
