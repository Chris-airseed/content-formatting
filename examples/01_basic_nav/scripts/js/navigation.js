async function loadNavigation() {
    try {
        // Fetch navigation JSON
        const response = await fetch("data/navigation.json");
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const navData = await response.json();

        // Ensure navigation is inserted only after content.html is loaded
        await waitForContent();

        // Generate and insert navigation
        insertNavigation(navData);
    } catch (error) {
        console.error("Error loading navigation:", error);
    }
}

// Function to wait until content.html is loaded
async function waitForContent() {
    return new Promise((resolve) => {
        const checkExist = setInterval(() => {
            const navPlaceholder = document.querySelector("[data-navigation]");
            if (navPlaceholder) {
                clearInterval(checkExist);
                resolve();
            }
        }, 100);
    });
}

// Function to insert navigation into placeholder
function insertNavigation(navData) {
    const navPlaceholder = document.querySelector("[data-navigation]");
    if (!navPlaceholder) {
        console.error("Navigation placeholder not found in content.html");
        return;
    }

    // Generate navigation HTML
    navPlaceholder.innerHTML = generateNavigationHTML(navData);
}

// Function to generate navigation menu HTML
function generateNavigationHTML(navData) {
    let navHTML = `<nav><ul class="nav-h1">`;
    
    navData.forEach(h1 => {
        const cleanH1Text = sanitizeText(h1.text);
        navHTML += `<li class="nav-item">
                        <a href="#${h1.id}">${cleanH1Text}</a>`;

        if (h1.h2.length > 0) {
            navHTML += `<ul class="nav-h2">`;
            h1.h2.forEach(h2 => {
                const cleanH2Text = sanitizeText(h2.text);
                navHTML += `<li class="nav-item">
                                <a href="#${h2.id}">${cleanH2Text}</a>`;

                if (h2.h3.length > 0) {
                    navHTML += `<ul class="nav-h3">`;
                    h2.h3.forEach(h3 => {
                        const cleanH3Text = sanitizeText(h3.text);
                        navHTML += `<li><a href="#${h3.id}">${cleanH3Text}</a></li>`;
                    });
                    navHTML += `</ul>`;
                }

                navHTML += `</li>`;
            });
            navHTML += `</ul>`;
        }

        navHTML += `</li>`;
    });

    navHTML += `</ul></nav>`;
    return navHTML;
}

// Function to sanitize text (removes \r\n and trims spaces)
function sanitizeText(text) {
    return text.replace(/\r?\n/g, " ").trim();
}

// Call function to load navigation
loadNavigation();
