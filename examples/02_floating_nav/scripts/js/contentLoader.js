document.addEventListener("DOMContentLoaded", async function () {
    await loadContent();
});

async function loadContent() {
    try {
        const [htmlRes, stylesRes, tablesRes] = await Promise.all([
            fetch("content/content.html").then(res => res.text()),
            fetch("data/styles.json").then(res => res.json()),
            fetch("data/tables.json").then(res => res.json())
        ]);

        document.getElementById("content").innerHTML = htmlRes;

        applyStyles(stylesRes);
        renderTables(tablesRes, stylesRes);

        // 🔹 Reload navigation after content is inserted
        await loadNavigation();

    } catch (error) {
        console.error("Error loading content:", error);
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
        if (tables[tableId]) {
            console.log(`Rendering table: ${tableId}`);
            div.innerHTML = generateTable(tables[tableId], globalStyles);
        } else {
            console.error(`Table ID ${tableId} not found in tables.json`);
            div.innerHTML = `<p>Table ${tableId} not found</p>`;
        }
    });
}
