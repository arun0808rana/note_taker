const doc = document.querySelector("textarea");
const title = document.querySelector("input");

let currentPathOfDoc = "";

async function saveDocument() {
  let payload = JSON.stringify({
    docPath: currentPathOfDoc + title.value,
    doc:doc.value,
  });
  let response = await fetch("/save", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: payload,
  });

  response = await response.json(); 
  console.log(response)
}
