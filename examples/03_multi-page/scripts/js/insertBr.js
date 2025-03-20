function addBrAfterParagraphs() {
    document.querySelectorAll("#content p").forEach(paragraph => {
        if (!paragraph.closest("caption") && !paragraph.closest("ul, ol")) {
            let br = document.createElement("br");
            paragraph.insertAdjacentElement("afterend", br);
        }
    });

    // Remove <br> before a list (ul, ol)
    document.querySelectorAll("#content ul, #content ol").forEach(list => {
        let prev = list.previousSibling;
        while (prev && prev.nodeType === Node.TEXT_NODE) {
            prev = prev.previousSibling;
        }
        if (prev && prev.tagName === "BR") {
            prev.remove();
        }

        // Add <br> after the last list item if not present
        let lastItem = list.lastElementChild;
        if (lastItem && !lastItem.nextElementSibling) {
            let br = document.createElement("br");
            lastItem.insertAdjacentElement("afterend", br);
        }
    });
}
