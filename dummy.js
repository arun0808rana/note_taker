const fs = require("fs");
const path = require("path");

function getDirectoryStructure(rootDir) {
  console.log(rootDir, "root dir");
  const fileTree = [];
  const files = fs.readdirSync(rootDir);

  files.forEach((file) => {
    const filePath = path.join(rootDir, file);
    const stats = fs.statSync(filePath);
    const isDirectory = stats.isDirectory();

    const fileNode = {
      name: file,
      path: filePath,
      isDirectory,
    };

    if (isDirectory) {
      fileNode.children = getDirectoryStructure(filePath);
    }

    fileTree.push(fileNode);
  });

  return fileTree;
}

const directoryStructure = getDirectoryStructure(path.join(__dirname, 'vault'));
console.log(directoryStructure);

fs.writeFileSync('directoryStructure.json', JSON.stringify(directoryStructure))
