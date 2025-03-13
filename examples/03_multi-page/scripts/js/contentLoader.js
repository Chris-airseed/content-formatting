document.addEventListener("DOMContentLoaded", async function () {
    await loadContent();
});

function addBrAfterParagraphs() {
    document.querySelectorAll("#content p").forEach(paragraph => {
        let br = document.createElement("br");
        paragraph.insertAdjacentElement("afterend", br);
    });
}

async function loadContent() {
    try {
        const [htmlRes, stylesRes, tablesRes] = await Promise.all([
            fetch("content/content.html").then(res => res.text()),
            fetch("data/styles.json").then(res => res.json()),
            fetch("data/tables.json").then(res => res.json())
        ]);

        const contentDiv = document.getElementById("content");
        contentDiv.innerHTML = htmlRes;

        applyStyles(stylesRes);
        renderTables(tablesRes, stylesRes);

        // 🔹 Wrap sections correctly after content loads
        if (typeof wrapHeadings === "function") {
            wrapHeadings(contentDiv);
        }

        // 🔹 Load navigation after sections are available
        if (typeof loadNavigation === "function") {
            loadNavigation();
        }

        // 🔹 Add <br> after each <p> AFTER content is loaded
        addBrAfterParagraphs();

    } catch (error) {
        console.error("❌ Error loading content:", error);
    }
}


function applyStyles(styles) {
    if (!styles) return;

    const applyStyle = (element, styleObj) => {
        if (!styleObj) return;
        Object.entries(styleObj).forEach(([key, value]) => {
            element.style[key] = value;
        });
    };

    if (styles.headings) {
        Object.entries(styles.headings).forEach(([tag, styleObj]) => {
            document.querySelectorAll(tag).forEach(el => applyStyle(el, styleObj));
        });
    }

    if (styles.body) {
        if (styles.body.p) {
            document.querySelectorAll("p").forEach(el => applyStyle(el, styles.body.p));
        }
        if (styles.body.ul) {
            document.querySelectorAll("ul").forEach(el => applyStyle(el, styles.body.ul));
        }
        if (styles.body.li) {
            document.querySelectorAll("li").forEach(el => applyStyle(el, styles.body.li));
        }
    }
}

function renderTables(tables, globalStyles) {
    document.querySelectorAll("[data-table]").forEach(div => {
        const tableId = div.getAttribute("data-table");
        const caption = div.getAttribute("data-caption") || ""; // Extract caption from div

        if (tables[tableId]) {
            console.log(`Rendering table: ${tableId}, Caption: ${caption}`);
            div.innerHTML = generateTable(tables[tableId], globalStyles, caption);
        } else {
            console.error(`Table ID ${tableId} not found in tables.json`);
            div.innerHTML = `<p>Table ${tableId} not found</p>`;
        }
    });
}

