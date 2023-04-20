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

module.exports = {
  getDirectoryStructure,
  isValidTreeElmName,
};
