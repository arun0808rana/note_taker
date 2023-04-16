const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const fs = require("fs");
const path = require("path");
const { getDirectoryStructure } = require("./utils/fileHandlers");
const { v4: uuidv4 } = require("uuid");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(`${__dirname}/assets`));

app.get("/", (req, res) => {
  res.sendFile("assets/index.html", { root: __dirname });
});

app.get("/getDirStruct", (req, res) => {
  const rootDir = process.cwd();
  const vault = path.join(rootDir, "vault");
  const dirStruct = JSON.stringify(getDirectoryStructure(vault));

  res.json(dirStruct);
});

app.post("/readDocDataOnFileClick", (req, res) => {
  const docPath = req.body.docPath;
  const docData = fs.readFileSync(docPath, 'utf8');
  const title = path.basename(docPath, path.extname(docPath));
  res.json({title, docData});
});

app.post("/save", (req, res) => {
  const doc = req.body.doc;
  const fileDest = `${req.body.docPath}`;
  const dirPath = path.dirname(fileDest);

  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  // console.log("fileDest :>> ", fileDest);

  fs.writeFileSync(fileDest, doc);
  res.status(200).json({ success: true });
});

const port = 5000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
