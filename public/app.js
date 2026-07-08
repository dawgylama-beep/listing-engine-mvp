const form = document.querySelector("#listing-form");
const photosInput = document.querySelector("#photos");
const preview = document.querySelector("#photo-preview");
const statusBox = document.querySelector("#status");
const results = document.querySelector("#results");
const generateButton = document.querySelector("#generate-button");
const buttonLabel = document.querySelector("#button-label");
const copyAllButton = document.querySelector("#copy-all");

const sections = [
  ["platform", "Platform"],
  ["categorySuggestion", "Category Suggestion"],
  ["title", "Title"],
  ["description", "Description"],
  ["itemDetails", "Item Details"],
  ["priceStrategy", "Price Strategy"],
  ["expectedSellingTimeline", "Expected Selling Timeline"],
  ["shippingDelivery", "Shipping / Delivery"],
  ["stagingPhotos", "Staging & Photos"],
  ["sellerNotes", "Seller Notes"]
];

let latestListing = null;

photosInput.addEventListener("change", renderPhotoPreview);
form.addEventListener("submit", generateListing);
copyAllButton.addEventListener("click", () => {
  if (!latestListing) {
    return;
  }

  copyText(formatListing(latestListing), copyAllButton);
});

function renderPhotoPreview() {
  preview.innerHTML = "";
  const files = Array.from(photosInput.files || []).slice(0, 6);

  for (const file of files) {
    const image = document.createElement("img");
    image.className = "photo-thumb";
    image.alt = file.name || "Uploaded item photo";
    image.src = URL.createObjectURL(file);
    image.addEventListener("load", () => URL.revokeObjectURL(image.src), { once: true });
    preview.appendChild(image);
  }
}

async function generateListing(event) {
  event.preventDefault();

  latestListing = null;
  copyAllButton.disabled = true;
  setLoading(true);
  setStatus("Generating listing from photos and notes...", "loading");

  try {
    const formData = new FormData(form);
    const photoFiles = Array.from(photosInput.files || []).slice(0, 6);
    const photos = [];

    for (const file of photoFiles) {
      photos.push({
        name: file.name,
        dataUrl: await resizeImage(file)
      });
    }

    const response = await fetch("/api/generate-listing", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        platform: formData.get("platform"),
        notes: formData.get("notes"),
        photos
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Unable to generate listing.");
    }

    latestListing = data.listing;
    renderListing(latestListing);
    clearStatus();
    copyAllButton.disabled = false;
  } catch (error) {
    renderEmpty();
    setStatus(error.message || "Unable to generate listing.", "error");
  } finally {
    setLoading(false);
  }
}

function renderListing(listing) {
  results.classList.remove("empty-state");
  results.innerHTML = "";

  for (const [key, label] of sections) {
    const card = document.createElement("article");
    card.className = "section-card";

    const header = document.createElement("div");
    header.className = "section-topline";

    const title = document.createElement("h3");
    title.textContent = label;

    const copyButton = document.createElement("button");
    copyButton.className = "copy-button";
    copyButton.type = "button";
    copyButton.textContent = "Copy";
    copyButton.addEventListener("click", () => copyText(formatSection(label, listing[key]), copyButton));

    const body = document.createElement("div");
    body.className = "section-body";
    body.appendChild(renderValue(listing[key]));

    header.append(title, copyButton);
    card.append(header, body);
    results.appendChild(card);
  }
}

function renderValue(value) {
  if (Array.isArray(value)) {
    const list = document.createElement("ul");
    for (const item of value) {
      const listItem = document.createElement("li");
      listItem.textContent = item;
      list.appendChild(listItem);
    }
    return list;
  }

  const paragraph = document.createElement("p");
  paragraph.textContent = value || "";
  return paragraph;
}

function renderEmpty() {
  latestListing = null;
  copyAllButton.disabled = true;
  results.className = "results empty-state";
  results.innerHTML = "<p>Your listing draft will appear here.</p>";
}

function setLoading(isLoading) {
  generateButton.disabled = isLoading;
  buttonLabel.textContent = isLoading ? "Generating..." : "Generate Listing";
}

function setStatus(message, type) {
  statusBox.textContent = message;
  statusBox.className = `status is-visible is-${type}`;
}

function clearStatus() {
  statusBox.textContent = "";
  statusBox.className = "status";
}

async function copyText(text, button) {
  await navigator.clipboard.writeText(text);
  const original = button.textContent;
  button.textContent = "Copied";
  setTimeout(() => {
    button.textContent = original;
  }, 1200);
}

function formatListing(listing) {
  return sections.map(([key, label]) => formatSection(label, listing[key])).join("\n\n");
}

function formatSection(label, value) {
  const body = Array.isArray(value) ? value.map((item) => `- ${item}`).join("\n") : value;
  return `${label}\n${body || ""}`;
}

function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read an uploaded photo."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Could not process an uploaded photo."));
      image.onload = () => {
        const maxDimension = 1400;
        const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));

        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
