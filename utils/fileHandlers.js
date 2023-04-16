const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require('uuid');

function getDirectoryStructure(rootDir) {
  // console.log(rootDir, "root dir");
  const fileTree = [];
  const files = fs.readdirSync(rootDir);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(rootDir, file);
    const stats = fs.statSync(filePath);
    const isDirectory = stats.isDirectory();

    const fileNode = {
      id: uuidv4(),
      name: file,
      path: filePath,
      type: isDirectory ? 'directory' : 'file',
      children: []
    };

    if (isDirectory) {
      fileNode.children = getDirectoryStructure(filePath);
    }

    fileTree.push(fileNode);
  }

  return fileTree;
}


module.exports = {
  getDirectoryStructure,
};