function generateTable(tableData, globalStyles) {
    if (!tableData) return "<p>Table not found</p>";

    console.log("Generating table with data:", tableData);

    // Merge styles (tables.json should override styles.json)
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

    // Generate rows
    tableHTML += "<tbody>";
    tableData.rows.forEach(row => {
        tableHTML += "<tr>";
        row.forEach((cell, colIndex) => {
            let defaultStyle = colIndex === 0 ? td1Styles : tdStyles;
            let styleStr = `background-color: ${cell.backgroundColor || defaultStyle.backgroundColor}; 
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
