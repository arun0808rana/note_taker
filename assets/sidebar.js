let dirStruct = [];
let docIdPathMap = [];
let parent = document.querySelector(".left-section");
let folderTemplate = document.querySelector(".folder_template");
let fileTemplate = document.querySelector(".file_template");
let contextMenuTemplate = document.querySelector(".context_template");
const menuHandle = contextMenuTemplate.content.querySelector(".context-menu");
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
let newElementCreationType = "";
let copiedPath = "";

(async () => {
  dirStruct = await getVaultStucture();
  baseDirPath = await getBaseDirPath();
  await generateTreeView(parent, dirStruct);
  document.addEventListener("contextmenu", contextMenuListener);
})();

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
    // naming tree elements
    childNode.querySelector(".children_name .elm-name").innerText = child.name;

    if (child.children.length > 0) {
      const subChild = generateTreeView(childNode, child.children);
      childNode.append(subChild);
    }
    parent.appendChild(childNode);
  }
  return childNode;
}

function getTreeElementPath(id) {
  if (!id) {
    console.log("baseDirPath :>> ", baseDirPath);
    return baseDirPath;
  }
  return docIdPathMap.find((_) => _.id === id).path;
}

function renderMarkdown() {
  const md = new markdownit();
  const markdownText = editor.value;
  const html = md.render(markdownText);
  editorPreview.innerHTML = html;
}

function focusCurrentTreeElm(fileHTMLElement) {
  // remove previous elm's bg color
  parent.querySelector(".active_tree_elm")?.classList.remove("active_tree_elm");
  // add bg color to the new current doc
  fileHTMLElement.classList.add("active_tree_elm");
  // set focused element's type
  focusedTreeElm.type = fileHTMLElement.getAttribute("data-type");
  focusedTreeElm.elementHandle = fileHTMLElement;

  if (focusedTreeElm.type === "file") {
    const docPath = getFocusedElmPath();
    const payload = {
      docPath,
    };
    fetchReadDocDataOnFileClick(payload);
  }
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

function uncollapseSubTree(childTarget) {
  childTarget.querySelectorAll(".children").forEach((elm) => {
    elm.classList.toggle("collapse_child");
  });
}

//  ******************indirect event handlers************

function handleEditorInput(event) {
  isCurrentDocPrestine = false;
  renderMarkdown();
}

function createNewEleemntInTree(elementType) {
  newElementCreationType = elementType;
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

function collapseTree() {
  parent.classList.toggle("collapse");
}

async function handleTreeClick(e) {
  const childTarget = e.target.closest(".children");
  // remove context menu
  menuHandle.remove();

  if (!childTarget) {
    console.log("No dir/file found. Setting root as parent.");
    // set focused element's type
    parent
      .querySelector(".active_tree_elm")
      ?.classList.remove("active_tree_elm");
    focusedTreeElm.type = "directory";
    focusedTreeElm.elementHandle = parent;
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
    if (!isCurrentDocPrestine) {
      const answer = confirm("Do you want save the document?");
      if (answer) {
        saveCurrentDocument();
      } else {
        isCurrentDocPrestine = true;
      }
    }

    // fetchReadDocDataOnFileClick(payload);
  }
}

function getFocusedElmPath() {
  const id = focusedTreeElm.elementHandle.getAttribute("data-id");
  return getTreeElementPath(id);
}

// *******************event handlers******************

function renameListener(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    const path = getFocusedElmPath();
    const renamedName =
      focusedTreeElm.elementHandle.querySelector(".elm-name").innerText;
    const payload = {
      actionType: "RENAME",
      renamePath: path,
      renamedName,
    };
    fetchContexMenuAction(payload);
    const elmHandle = focusedTreeElm.elementHandle.querySelector(".elm-name");
    elmHandle.setAttribute("contentEditable", "false");
    elmHandle.removeEventListener("keypress", renameListener);
  }
}

function titlePlaceholderEnterListener(event) {
  if (event.key === "Enter") {
    handleCreate();
  }
}

function titlePlaceholderUnfocusListener(event) {
  handleCreate();
}

function contextMenuListener(event) {
  menuHandle.remove();

  // return if right clik is not on left-section
  if (!event.target.closest(".left-section")) {
    console.log("Context Menu Target not found.");
    return;
  }
  event.preventDefault();
  const target = event.target.closest(".children");

  // return if parent is root
  if (!target) {
    console.log("No target found for ctx menu");
    return;
  }
  target.appendChild(menuHandle);
  focusCurrentTreeElm(target);
}

function handleConextMenu(event) {
  event.stopPropagation();
  const target = event.target.closest(".menu-item");
  menuHandle.remove();
  const actionType = target.innerText.trim().toUpperCase();

  switch (actionType) {
    case "RENAME":
      const elmNameHandle =
        focusedTreeElm.elementHandle.querySelector(".elm-name");
      elmNameHandle.setAttribute("contentEditable", "true");
      // put cursor at end of tree element's name
      const range = document.createRange();
      const sel = window.getSelection();
      const cursorEndPos = focusedTreeElm.type === 'directory' ? elmNameHandle.textContent.length : elmNameHandle.textContent.split('.')[0].length;
      range.setStart(
        elmNameHandle.childNodes[0],
        cursorEndPos
      );
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
      elmNameHandle.focus();
      elmNameHandle.addEventListener("keypress", renameListener);
      break;

    case "COPY":
      copiedPath = getFocusedElmPath();
      console.log("copiedPath :>> ", copiedPath);
      break;

    case "PASTE":
      break;

    case "DELETE":
      break;

    default:
      break;
  }

  // fetchContexMenuAction();
}

//******************** api ************************

async function fetchContexMenuAction(payload) {
  try {
    fetch("/contexMenuAction", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("data :>> ", data);
      });
  } catch (error) {
    console.log("error renaming element: ", error?.message);
  } finally {
    const dirStruct = await getVaultStucture();
    console.log('dirStruct :>> ', dirStruct);
    parent.innerHTML = '',
    generateTreeView(parent, dirStruct);
    // arun--
  }
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

function handleCreate() {
  const payload = {
    parentDirPath,
    type: newElementCreationType,
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
        const dirStruct = data.dirStruct;
        // remove input of new elm listeners
        removeTitlePlaceholder();
        parent.innerHTML = "";
        generateTreeView(parent, dirStruct);
        focusOnNewlyCreatedElm(data.newElmId);
        if (newElementCreationType === "file") {
          editor.value = "";
          editorPreview.innerHTML = "";
          title.value = focusedTreeElm.elementHandle.innerText;
          editor.focus();
        }
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

async function fetchReadDocDataOnFileClick(payload) {
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
    currentDocPath = payload.docPath;
    isCurrentDocPrestine = true;
    currentDocData = data.docData;
  } catch (error) {
    console.error(error);
  } finally {
    currentDocPath = payload.docPath;
    renderMarkdown();
  }
}

async function getVaultStucture() {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await fetch("/getDirStruct");
      let dirStruct = await response.json();
      resolve(dirStruct);
    } catch (error) {
      console.error(`Download error: ${error.message}`);
      reject([]);
    }
  });
}
