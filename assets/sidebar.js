let dirStruct = [];
let docIdPathMap = [];
let parent = document.querySelector(".left-section");
let folderTemplate = document.querySelector(".folder_template");
let fileTemplate = document.querySelector(".file_template");
let editor = document.querySelector(".editor");
let title = document.querySelector(".title");
let editorPreview = document.querySelector(".editor-preview");
let titlePlaceholder = createTitlePlaceholder();
let currentDocPath = "";
let isCurrentDocPrestine = true;
let currentDocData = "";
let parentDirPath;
let focusedTreeElm = {
  elementHandle: null,
  type: "",
};
let baseDirPath = "";

(async () => {
  dirStruct = await getVaultStucture();
  baseDirPath = await getBaseDirPath();
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

  focusCurrentTreeElm(childTarget);

  // collapse, uncollapse logic for directories on click
  if (childTarget.getAttribute("data-type") === "directory") {
    uncollapseSubTree(childTarget);
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
    const docPath = await getTreeElementPath(docId);
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

function getTreeElementPath(id) {
  if (!id) {
    console.log("baseDirPath :>> ", baseDirPath);
    return baseDirPath;
  }
  return docIdPathMap.find((_) => _.id === id).path;
}

function handleEditorInput(event) {
  isCurrentDocPrestine = false;
  renderMarkdown();
}

function saveCurrentDocument() {
  if (editor.value === "" || currentDocPath === "") {
    return;
  }

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
  const html = md.render(markdownText);
  editorPreview.innerHTML = html;
}

function createNewDocument(e) {
  // reset titlePlaceholder
  titlePlaceholder.value = "";
  const elmId = focusedTreeElm.elementHandle.getAttribute("data-id");

  if (focusedTreeElm.type === "directory") {
    parentDirPath = getTreeElementPath(elmId);
    const parentElm = focusedTreeElm.elementHandle;
    console.log(parentElm, "parent elem");
    parentElm.insertBefore(titlePlaceholder, parentElm.children[1]);
  } else {
    const parentId = focusedTreeElm.elementHandle
      .closest(".folder")
      .getAttribute("data-id");
    parentDirPath = getTreeElementPath(parentId);
    const focusedElm = focusedTreeElm.elementHandle;
    focusedElm.insertAdjacentElement("afterend", titlePlaceholder);
  }
  titlePlaceholder.focus();
  titlePlaceholder.addEventListener("blur", titlePlaceholderUnfocusListener);
  titlePlaceholder.addEventListener("keypress", titlePlaceholderEnterListener);
}

function focusCurrentTreeElm(fileHTMLElement) {
  // remove previous elm's bg color
  parent.querySelector(".active_tree_elm")?.classList.remove("active_tree_elm");

  // add bg color to the new current doc
  fileHTMLElement.classList.add("active_tree_elm");

  // set focused element's type
  focusedTreeElm.type = fileHTMLElement.getAttribute("data-type");
  focusedTreeElm.elementHandle = fileHTMLElement;
}

function createTitlePlaceholder() {
  const inputElement = document.createElement("input");
  inputElement.type = "text";
  inputElement.classList.add("new-tree-elm-placeholder");
  return inputElement;
}

function focusOnNewlyCreatedElm(newElmId) {
  const newlyCreateElm = document.querySelector(`[data-id="${newElmId}"]`);
  newlyCreateElm.classList.add("active_tree_elm");
  focusedTreeElm.type = newlyCreateElm.getAttribute("data-type");
  focusedTreeElm.elementHandle = newlyCreateElm;
}

function removeTitlePlaceholder() {
  titlePlaceholder.removeEventListener(
    "keypress",
    titlePlaceholderEnterListener
  );
  titlePlaceholder.removeEventListener("blur", titlePlaceholderUnfocusListener);
  titlePlaceholder.remove();
}

function collapseTree() {
  parent.classList.toggle("collapse");
}

function uncollapseSubTree(childTarget) {
  childTarget.querySelectorAll(".children").forEach((elm) => {
    elm.classList.toggle("collapse_child");
  });
}
// event handlers

function titlePlaceholderEnterListener(event) {
  if (event.key === "Enter") {
    handleCreate();
  }
}

function titlePlaceholderUnfocusListener(event) {
  handleCreate();
}

// api

function handleCreate() {
  const payload = {
    parentDirPath,
    type: "file",
    title: titlePlaceholder.value,
  };

  if (!payload.parentDirPath || !payload.type || !payload.title) {
    console.log("Please provide a title, type, parent directory path.");
    removeTitlePlaceholder();
    return;
  }

  try {
    fetch("/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("data", data);
        const dirStruct = data.dirStruct;
        // remove input of new elm listeners
        removeTitlePlaceholder();
        parent.innerHTML = "";
        generateTreeView(parent, dirStruct);
        focusOnNewlyCreatedElm(data.newElmId);
        editor.value = "";
        editorPreview.innerHTML = "";
        title.value = focusedTreeElm.elementHandle.innerText;
      });
  } catch (error) {
    console.log("[Error]: ", error?.message);
    removeTitlePlaceholder();
  }
}

async function getBaseDirPath() {
  const path = (await fetch("/getBaseDirPath")).text();
  parentDirPath = path;
  return path;
}
