const router = require("express").Router();
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs");
const { getDirectoryStructure, isValidTreeElmName } = require("../utils/fileHandlers");


router.get("/getDirStruct", (req, res) => {
  const dirStruct = getDirectoryStructure();
  res.json(dirStruct);
});

router.get("/getBaseDirPath", (req, res) => {
  res.send(path.join(process.cwd(), "vault"));
});

router.post("/readDocDataOnFileClick", (req, res) => {
  const docPath = req.body.docPath;
  const docData = fs.readFileSync(docPath, "utf8");
  const title = path.basename(docPath, path.extname(docPath));
  res.json({ title, docData });
});

router.post("/save", (req, res) => {
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

router.post("/create", (req, res) => {
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

router.post("/contexMenuAction", (req, res) => {
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


module.exports = router;