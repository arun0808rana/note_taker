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
  const dirStruct = JSON.stringify(getDirectoryStructure());
  res.json(dirStruct);
});

app.post("/readDocDataOnFileClick", (req, res) => {
  const docPath = req.body.docPath;
  const docData = fs.readFileSync(docPath, "utf8");
  const title = path.basename(docPath, path.extname(docPath));
  res.json({ title, docData });
});

app.post("/create", (req, res) => {
  const type = req.body.type;
  const parentDirPath = req.body.parentDirPath;
  const title = req.body.title;

  if (type === "directory") {
    const dirPath = path.join(parentDirPath, title);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  } else {
    const filePath = path.join(parentDirPath, title);
    fs.writeFileSync(filePath, "");
  }
  const newElmId = uuidv4();
  const elmPath = path.join(parentDirPath, title);
  const dirStruct = getDirectoryStructure(undefined, newElmId, elmPath);
  res.json({dirStruct, newElmId});
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
