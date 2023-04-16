let dirStruct = [];
let docIdPathMap = [];
let parent = document.querySelector(".left-section");
let folderTemplate = document.querySelector(".folder_template");
let fileTemplate = document.querySelector(".file_template");
let editor = document.querySelector(".editor");
let title = document.querySelector(".title");
let editorPreview = document.querySelector(".editor-preview");
let currentDocPath = "";
let isCurrentDocPrestine = true;
let currentDocData = "";

(async () => {
  dirStruct = await getVaultStucture();
  await generateTreeView(parent, dirStruct);
})();

async function getVaultStucture() {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await fetch("/getDirStruct");
      let dirStruct = await response.json();
      dirStruct = await JSON.parse(dirStruct);
      // console.log("dirStruct :>> ", dirStruct);
      resolve(dirStruct);
    } catch (error) {
      console.error(`Download error: ${error.message}`);
      reject([]);
    }
  });
}

function generateTreeView(parent, tree) {
  let childNode;

  for (let key in tree) {
    const child = tree[key];
    docIdPathMap.push({ id: child.id, path: child.path });

    if (child.type === "directory") {
      childNode = folderTemplate.content.cloneNode(true).querySelector("div");
    } else {
      childNode = fileTemplate.content.cloneNode(true).querySelector("div");
    }

    childNode.setAttribute("data-id", child.id);
    childNode.setAttribute("data-type", child.type);
    childNode.setAttribute("data-expanded", true);

    childNode.querySelector(".children_name").innerText = child.name;

    if (child.children.length > 0) {
      const subChild = generateTreeView(childNode, child.children);
      childNode.append(subChild);
    }
    parent.appendChild(childNode);
  }
  return childNode;
}

async function handleTreeClick(e) {
  const childTarget = e.target.closest(".children");

  if (!childTarget) {
    console.log("No dir/file found.");
    return;
  }

  // collapse, uncollapse logic for directories on click
  if (childTarget.getAttribute("data-type") === "directory") {
    const isExpanded = childTarget.getAttribute("data-expanded");
    if (isExpanded === "true") {
      childTarget.classList.add("child_hidden");
      childTarget.setAttribute("data-expanded", "false");
    } else {
      childTarget.classList.remove("child_hidden");
      childTarget.setAttribute("data-expanded", "true");
    }
  } else {
    const docId = childTarget.getAttribute("data-id");
    const docPath = await getDirectoryPath(docId);
    const payload = {
      docPath,
    };

    if (!isCurrentDocPrestine) {
      const answer = confirm("Do you want save the document?");
      if (answer) {
        saveCurrentDocument();
      } else {
        isCurrentDocPrestine = true;
      }
    }

    try {
      const response = await fetch("/readDocDataOnFileClick", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      editor.value = data.docData;
      title.value = data.title;
      currentDocPath = docPath;
      isCurrentDocPrestine = true;
      currentDocData = data.docData;
    } catch (error) {
      console.error(error);
    }

    currentDocPath = docPath;
    renderMarkdown();
  }
}

function getDirectoryPath(id) {
  return docIdPathMap.find((_) => _.id === id).path;
}

function handleEditorInput(event) {
  isCurrentDocPrestine = false;
}

function saveCurrentDocument() {
  fetch("/save", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      doc: editor.value,
      docPath: currentDocPath,
    }),
  });
  isCurrentDocPrestine = true;
  renderMarkdown();
}

function renderMarkdown() {
  const md = new markdownit();
  const markdownText = editor.value;
  console.log("markdownText :>> ", markdownText);
  const html = md.render(markdownText);
  editorPreview.innerHTML = html;
}
