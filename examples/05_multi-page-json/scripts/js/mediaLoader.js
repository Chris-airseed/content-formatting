async function loadImages() {
    try {
        // Fetch media.json
        const mediaRes = await fetch("data/media.json");
        const mediaData = await mediaRes.json();

        console.log("Loaded media.json:", mediaData);

        // Find all elements with the data-image attribute
        document.querySelectorAll("#content div.image").forEach(div => {
            const imagePath = div.getAttribute("data-src"); // ✅ Extract image path
            const captionText = div.getAttribute("data-caption"); // ✅ Extract caption

            // Find the corresponding image entry in media.json
            const imageEntry = Object.values(mediaData).find(img => img.path === imagePath);

            if (imageEntry) {
                console.log(`Replacing div with image: ${imageEntry.path}`);

                // Create an <img> element
                const imgElement = document.createElement("img");
                imgElement.src = imageEntry.path;
                imgElement.alt = imageEntry.alt_text;
                imgElement.style.maxWidth = "50%"; // Optional for responsiveness

                let replacementElement;

                // ✅ If caption exists, wrap image in <figure> with <figcaption>
                if (captionText) {
                    const figureElement = document.createElement("figure");

                    // Create <figcaption>
                    const captionElement = document.createElement("figcaption");
                    captionElement.innerHTML = captionText; // ✅ Decoded HTML

                    // Append <img> and <figcaption> to <figure>
                    figureElement.appendChild(imgElement);
                    figureElement.appendChild(captionElement);

                    replacementElement = figureElement;
                } else {
                    replacementElement = imgElement; // No caption, just replace with <img>
                }

                // Replace the div with the new image element or figure
                div.replaceWith(replacementElement);
            } else {
                console.warn(`Image not found in media.json for path: ${imagePath}`);
            }
        });

    } catch (error) {
        console.error("Error loading images:", error);
    }
}

// Run the function after content is loaded
document.addEventListener("DOMContentLoaded", loadImages);
