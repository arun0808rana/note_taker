const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const baseDir = process.cwd();
const vault = path.join(baseDir, "vault");

function getDirectoryStructure(rootDir = vault, elmId = null, elmPath = null) {
  const fileTree = [];
  const files = fs.readdirSync(rootDir);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(rootDir, file);
    const stats = fs.statSync(filePath);
    const isDirectory = stats.isDirectory();

    let id;

    if (elmPath === filePath) {
      console.log("found path");
      id = elmId;
    } else {
      id = uuidv4();
    }

    const fileNode = {
      id: id,
      name: file,
      path: filePath,
      type: isDirectory ? "directory" : "file",
      children: [],
    };

    if (isDirectory) {
      fileNode.children = getDirectoryStructure(filePath, elmId, elmPath);
    }

    fileTree.push(fileNode);
  }

  return fileTree;
}

module.exports = {
  getDirectoryStructure,
};
