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

function generateTable(tableData, globalStyles) {
    if (!tableData) return "<p>Table not found</p>";

    console.log("Generating table with data:", tableData);

    const tableStyles = { ...globalStyles.table, ...tableData.styles };
    const thStyles = { ...globalStyles.th, ...tableData.th };
    const tdStyles = { ...globalStyles.td, ...tableData.td };
    const td1Styles = { ...globalStyles.td1, ...tableData.td1 };

    let tableHTML = `<table style="border: ${tableStyles.border}; 
                                    width: ${tableStyles.width || 'auto'}; 
                                    border-collapse: ${tableStyles.borderCollapse}; 
                                    margin-bottom: ${tableStyles.marginBottom};">`;

    // Generate headers
    if (tableData.headers) {
        tableHTML += "<thead><tr>";
        tableData.headers.forEach(header => {
            let styleStr = `background-color: ${thStyles.backgroundColor}; 
                            color: ${thStyles.color}; 
                            font-size: ${thStyles.fontSize};
                            font-weight: ${thStyles.fontWeight}; 
                            text-align: ${header.textAlign || thStyles.textAlign}; 
                            padding: ${thStyles.padding};`;
            tableHTML += `<th style="${styleStr}">${header.text}</th>`;
        });
        tableHTML += "</tr></thead>";
    }

    tableHTML += "<tbody>";
    tableData.rows.forEach(row => {
        tableHTML += "<tr>";

        row.forEach((cell, colIndex) => {
            let defaultStyle = colIndex === 0 ? td1Styles : tdStyles;
            let backgroundColor = cell.backgroundColor || defaultStyle.backgroundColor;

            let styleStr = `background-color: ${backgroundColor}; 
                            color: ${defaultStyle.color}; 
                            font-size: ${defaultStyle.fontSize};
                            font-weight: ${defaultStyle.fontWeight}; 
                            text-align: ${cell.textAlign || defaultStyle.textAlign}; 
                            padding: ${defaultStyle.padding};`;

            let colspan = cell.colSpan ? `colspan="${cell.colSpan}"` : "";
            let rowspan = cell.rowSpan ? `rowspan="${cell.rowSpan}"` : "";

            let cellText = cell.text ? cell.text.replace(/\n/g, "<br>") : "";

            tableHTML += `<td ${colspan} ${rowspan} style="${styleStr}">${cellText}</td>`;
        });

        tableHTML += "</tr>";
    });
    tableHTML += "</tbody></table>";

    return tableHTML;
}
