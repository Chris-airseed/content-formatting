function generateTable(tableData, globalStyles, caption = "") {
    if (!tableData) return "<p>Table not found</p>";

    console.log("Generating table with data:", tableData);
    console.log("Table Caption Passed:", caption);

    if (!tableData.rows || !Array.isArray(tableData.rows)) {
        console.error("Error: tableData.rows is missing or not an array.", tableData.rows);
        return "<p>Error: Table data is not structured correctly.</p>";
    }

    const tableStyles = { ...globalStyles.table, ...tableData.styles };
    const thStyles = { ...globalStyles.th, ...tableData.th };
    const tdStyles = { ...globalStyles.td, ...tableData.td };
    const td1Styles = { ...globalStyles.td1, ...tableData.td1 };

    let tableHTML = `<table style="border: ${tableStyles.border || '1px solid black'}; 
                                    width: ${tableStyles.width || 'auto'}; 
                                    border-collapse: ${tableStyles.borderCollapse || 'collapse'}; 
                                    margin-bottom: ${tableStyles.marginBottom || '10px'};">`;

    // ✅ Use the extracted caption
    if (caption) {
        tableHTML += `<caption class="table-caption">${caption}</caption>`;
    }

    // Generate headers
    if (tableData.headers && Array.isArray(tableData.headers)) {
        tableHTML += "<thead><tr>";
        tableData.headers.forEach(header => {
            let styleStr = `background-color: ${thStyles.backgroundColor || 'transparent'}; 
                            color: ${thStyles.color || 'black'}; 
                            font-size: ${thStyles.fontSize || '1rem'};
                            font-weight: ${thStyles.fontWeight || 'normal'}; 
                            text-align: ${header.textAlign || thStyles.textAlign || 'left'}; 
                            padding: ${thStyles.padding || '5px'};`;
            tableHTML += `<th style="${styleStr}">${header.text}</th>`;
        });
        tableHTML += "</tr></thead>";
    }

    // Generate rows
    tableHTML += "<tbody>";
    tableData.rows.forEach((row, rowIndex) => {
        if (!Array.isArray(row)) {
            console.error(`Error: Row ${rowIndex} is not an array`, row);
            return;
        }

        tableHTML += "<tr>";
        row.forEach((cell, colIndex) => {
            let defaultStyle = colIndex === 0 ? td1Styles : tdStyles;

            let styleStr = `background-color: ${cell.backgroundColor || defaultStyle.backgroundColor || 'transparent'}; 
                            color: ${cell.color || defaultStyle.color || 'black'}; 
                            font-size: ${cell.fontSize || defaultStyle.fontSize || '1rem'};
                            font-weight: ${cell.fontWeight || defaultStyle.fontWeight || 'normal'}; 
                            text-align: ${cell.textAlign || defaultStyle.textAlign || 'left'}; 
                            padding: ${cell.padding || defaultStyle.padding || '5px'};`;

            let colspan = cell.colSpan ? `colspan="${cell.colSpan}"` : "";
            let rowspan = cell.rowSpan ? `rowspan="${cell.rowSpan}"` : "";

            let cellText = "";

            // Handle text parts
            if (cell.textParts && Array.isArray(cell.textParts)) {
                cellText = cell.textParts.map(part => {
                    let formattedText = part.text;

                    if (part.bold) formattedText = `<b>${formattedText}</b>`;
                    if (part.superscript) formattedText = `<sup>${formattedText}</sup>`;
                    if (part.subscript) formattedText = `<sub>${formattedText}</sub>`;
                    if (part.italic) formattedText = `<i>${formattedText}</i>`;
                    if (part.underline) formattedText = `<u>${formattedText}</u>`;
                    if (part.strikethrough) formattedText = `<del>${formattedText}</del>`;
                    if (part.color) formattedText = `<span style="color: ${part.color}">${formattedText}</span>`;

                    return formattedText;
                }).join(""); // Join formatted text parts
            } else if (cell.text) {
                cellText = cell.text.replace(/\n/g, "<br>"); // Ensure line breaks are preserved
            }

            tableHTML += `<td ${colspan} ${rowspan} style="${styleStr}">${cellText}</td>`;
        });
        tableHTML += "</tr>";
    });
    tableHTML += "</tbody></table>";

    return tableHTML;
}
