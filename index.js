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
  const dirStruct = getDirectoryStructure();
  res.json(dirStruct);
});

app.get("/getBaseDirPath", (req, res) => {
  res.send(path.join(__dirname, "vault"));
});

app.post("/readDocDataOnFileClick", (req, res) => {
  const docPath = req.body.docPath;
  const docData = fs.readFileSync(docPath, "utf8");
  const title = path.basename(docPath, path.extname(docPath));
  res.json({ title, docData });
});

app.post("/contexMenuAction", (req, res) => {
  const actionType = req.body.actionType;
  const copyPath = req.body.copyPath || null;
  const pastePath = req.body.pastePath || null;
  const renamePath = req.body.renamePath || null;
  const renamedName = req.body.renamedName || null;

  switch (actionType) {
    case "RENAME":
      if (!renamedName) {
        throw new Error("Please provide a new renaming name.");
      }

      try {
        if (!renamePath) {
          throw new Error("Please provide a rename target element.");
        }

        const isNameValid = isValidTreeElmName(renamedName);
        if (!isNameValid) {
          throw new Error("Invalid element name.");
        }

        fs.rename(
          renamePath,
          path.join(path.dirname(renamePath), renamedName),
          (err) => {
            if (err) throw err;
            const dirStruct = getDirectoryStructure();

            res.json({ success: true, dirStruct });
          }
        );
      } catch (error) {
        const dirStruct = getDirectoryStructure();
        res.json({ success: false, dirStruct, reason: error?.message });
      }
      break;

    default:
      const dirStruct = getDirectoryStructure();
      res.json({ success: false, dirStruct, reason: "INVALID Action Type." });
      break;
  }
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
  res.json({ dirStruct, newElmId });
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

app.listen(port, async () => {
  const open = await import('open');
  await open.default(`http://localhost:${port}`);
  console.log(`Server running on port ${port}`);
});

function isValidTreeElmName(name) {
  const isWindows = process.platform === "win32";
  const isMac = process.platform === "darwin";
  const isLinux = process.platform === "linux";

  if (isWindows) {
    const reservedChars = /[<>:"/\\|?*\x00-\x1F]/g;
    const reservedNames = /^(con|prn|aux|nul|com\d|lpt\d)$/i;
    const maxLength = 260;
    const endsWithPeriodOrSpace = /[. ]$|^ $/;
    return (
      !reservedChars.test(name) &&
      !reservedNames.test(name) &&
      name.length <= maxLength &&
      !endsWithPeriodOrSpace.test(name)
    );
  }

  if (isMac || isLinux) {
    const invalidChars = /[^\w\s-]/g;
    const maxLength = 255;
    const endsWithSpace = /^.*\s$/;
    return (
      !invalidChars.test(name) &&
      name.length <= maxLength &&
      !endsWithSpace.test(name)
    );
  }

  return true; // assume name is valid for other operating systems
}
