# DOCX to HTML Table Rendering (Local Testing Guide)

## Overview

This project allows you to convert **DOCX content** into **HTML** while using **JSON for table data and styling**. The HTML file dynamically loads and replaces placeholders with styled tables.

## Project Structure

```plaintext
/docx-to-html-project/
│-- index.html        # Main file to open in a browser
│-- content.html      # Contains HTML content with table placeholders
│-- styles.json       # Defines global styles for tables and text
│-- tables.json       # Stores structured table data
```

## How It Works

- `content.html` contains **text and placeholders** (`<div data-table="table_id"></div>`) for tables.
- `tables.json` defines **table data** (headers, rows, formatting, colors, etc.).
- `styles.json` defines **default table styling** (border, alignment, colors, etc.).
- `index.html` loads `content.html` and dynamically **inserts tables** using JavaScript.

## How to Run Locally

Modern browsers block JavaScript `fetch()` calls for local files (`file://` URLs). To fix this, you need to run a **local web server**.

### **Method 1: Using Python** (Quickest)

1. Open a terminal or command prompt.
2. Navigate to the project folder:
   ```sh
   cd /path/to/docx-to-html-project
   Example:
   cd Airseed/repo/content-formatting/examples/02_floating_nav/app/grovia_Carbon-PRO_Template
   ```
3. Start a local server:
   - **Python 3:**
     ```sh
     python -m http.server 8000
     ```
   - **Python 2 (if applicable):**
     ```sh
     python -m SimpleHTTPServer 8000
     ```
4. Open your browser and visit:
   ```plaintext
   http://localhost:8000/index.html
   ```
5. Upon editing refresh and clear cache with:
   ```plaintext
   ctrl + shift + R
   ```

### **Method 2: Using Node.js (Alternative)**

1. Ensure **Node.js** is installed.
2. Navigate to the project folder:
   ```sh
   cd /path/to/docx-to-html-project
   ```
3. Run a local server using `http-server`:
   ```sh
   npx http-server
   ```
4. Open the displayed **localhost URL** in your browser.

## Releases
### Version 1 - 07/03/25
- Automatically detected styles applied from word doc and apply them to html for:
   - headings
   - body
- Tables with style changes to:
   - font size
   - weight
   - cell colour
   - alignment
   - horizontal cell merging
- Navigation automatically generated using headings (h1 main, h2 subnav) and placed at top of page


### Expected Output

Once the local server is running, `index.html` should:
✅ Load **content.html** dynamically.
✅ Replace `<div data-table="table_sales_q1"></div>` with a **styled table** from `tables.json`.
✅ Apply **global styles** from `styles.json`.
✅ Replace `<div navigation></div>` with a **styled navigation** from `navigation.json`.

## Troubleshooting

- If the page is **blank**, ensure you started the **local server**.
- If tables do not appear, check **console errors** (press `F12` → Console in Chrome/Firefox).
- If styling does not apply, verify `styles.json` is correctly formatted.

## Next Steps

You can extend this by:

- Adding more **tables** in `tables.json`.
- Defining new **themes/styles** in `styles.json`.
- Converting DOCX to structured HTML using a **Python script**.

Happy testing! 🚀

