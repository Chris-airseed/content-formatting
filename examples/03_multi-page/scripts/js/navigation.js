// Function to update the displayed section based on the URL hash
function updatePageFromHash() {
    const sections = document.querySelectorAll(".h1-section");
    let currentHash = window.location.hash.substring(1); // Get current hash (e.g., "planting-area")

    if (!currentHash) {
        currentHash = sections[0].id; // Default to first section
    }

    console.log(`🔄 Updating section: ${currentHash}`);

    let targetSection = document.getElementById(currentHash);

    if (!targetSection) {
        console.warn(`⚠ No section found with ID: ${currentHash}`);
        return;
    }

    // If the target is an H2, find its parent H1 section
    if (targetSection.tagName === "H2") {
        let parentH1Section = targetSection.closest(".h1-section");
        if (parentH1Section) {
            targetSection = parentH1Section;
        }
    }

    // Hide all sections first
    sections.forEach(section => {
        section.style.display = "none";
    });

    // Show the correct H1 section
    targetSection.style.display = "block";

    // Scroll to the exact element smoothly
    document.getElementById(currentHash)?.scrollIntoView({ behavior: "smooth" });

    // Update navigation highlight
    setActiveNavigation();

    // 🔹 Ensure sticky sub-navigation updates after changing sections
    initializeSubNavSticky();
}

// Function to highlight the active navigation link
function setActiveNavigation() {
    const currentHash = window.location.hash || `#${document.querySelector(".h1-section").id}`;
    document.querySelectorAll(".nav-h1 > .nav-item, .nav-h2 > .nav-item").forEach(item => {
        item.classList.remove("active");
    });

    const activeLink = document.querySelector(`.nav-h1 > .nav-item > a[href="${currentHash}"], .nav-h2 > .nav-item > a[href="${currentHash}"]`);
    if (activeLink) {
        activeLink.parentElement.classList.add("active");
    }
}

// Function to initialize navigation and page switching
async function loadNavigation() {
    try {
        const response = await fetch("data/navigation.json");
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const navData = await response.json();
        await waitForContent();

        insertNavigation(navData);
        insertSubNavigation(navData);

        setActiveNavigation();

        // 🔹 Ensure hash changes show the correct section
        window.addEventListener("hashchange", updatePageFromHash);

        // 🔹 Show the correct section on initial page load
        updatePageFromHash();

    } catch (error) {
        console.error("❌ Error loading navigation:", error);
    }
}

// Ensure navigation initializes on page load
document.addEventListener("DOMContentLoaded", loadNavigation);

// Function to make sub-navigation sticky & continue into the next parent div
function initializeSubNavSticky() {
    console.log("🚀 Initializing SubNav Sticky Behavior...");

    document.querySelectorAll("[data-sub-navigation]").forEach(subNavContainer => {
        const subNav = subNavContainer.querySelector(".sub-nav");
        if (!subNav) {
            console.warn("⚠ No `.sub-nav` found inside:", subNavContainer);
            return;
        }

        // Find the related H1 section using `data-parent`
        const parentID = subNavContainer.getAttribute("data-parent");
        let parentH1 = document.querySelector(`[id='${parentID}']`);

        if (!parentH1) {
            console.warn(`⚠ No H1 section found with ID: ${parentID}`);
            return;
        }

        // Track all relevant parent sections (current + next)
        let trackedSections = [parentH1];

        // Find the next parent section (if it exists)
        let nextParent = parentH1.nextElementSibling;
        while (nextParent && !nextParent.matches("[data-parent]")) {
            nextParent = nextParent.nextElementSibling; // Skip non-parent elements
        }

        if (nextParent) {
            trackedSections.push(nextParent);
            console.log(`🔄 Sub-nav will continue into next parent: ${nextParent.id}`);
        }

        const mainNavHeight = 80; // Fixed navigation height

        function updateSubNavPosition() {
            if (!subNav || !trackedSections[0]) return;

            const subNavRect = subNav.getBoundingClientRect();
            const firstSectionRect = trackedSections[0].getBoundingClientRect();
            const lastSectionRect = trackedSections[trackedSections.length - 1].getBoundingClientRect();

            console.log(
                `📌 Scroll Check: firstSectionRect.top=${firstSectionRect.top}, subNavRect.top=${subNavRect.top}, lastSectionRect.bottom=${lastSectionRect.bottom}`
            );

            // Fix sub-nav when entering the first tracked section
            if (firstSectionRect.top <= -mainNavHeight) {
                subNav.classList.add("fixed");
                console.log(`📌 FIXED: Sub-nav for ${parentID} is now fixed at top`);
            } else {
                subNav.classList.remove("fixed");
                console.log(`🔄 RESET: Sub-nav for ${parentID} is back to normal`);
            }

            // Allow navigation to follow into the next section
            if (lastSectionRect.bottom <= mainNavHeight) {
                subNav.classList.remove("fixed");
                console.log(`⬇️ Moving to the next section: ${nextParent ? nextParent.id : "None"}`);
            }
        }

        window.addEventListener("scroll", updateSubNavPosition);
        updateSubNavPosition(); // Run once on page load
    });
}

// Function to wait until content.html is loaded
async function waitForContent() {
    return new Promise((resolve) => {
        const checkExist = setInterval(() => {
            const navPlaceholder = document.querySelector("[data-navigation]");
            const subNavPlaceholders = document.querySelectorAll("[data-sub-navigation]");
            if (navPlaceholder && subNavPlaceholders.length > 0) {
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
                                <a href="#${h2.id}">${cleanH2Text}</a>
                            </li>`;
            });
            navHTML += `</ul>`;
        }

        navHTML += `</li>`;
    });

    navHTML += `</ul></nav>`;
    return navHTML;
}

// Function to insert sub-navigation buttons
function insertSubNavigation(navData) {
    navData.forEach(h1 => {
        document.querySelectorAll(`[data-sub-navigation][data-parent='${h1.id}']`).forEach(subNavContainer => {
            let subNavHTML = `<div class="sub-nav">`;
            h1.h2.forEach(h2 => {
                const cleanH2Text = sanitizeText(h2.text);
                subNavHTML += `<a class="sub-nav-item" href="#${h2.id}">${cleanH2Text}</a>`;
            });
            subNavHTML += `</div>`;
            subNavContainer.innerHTML = subNavHTML;
        });
    });
}

// Function to sanitize text (removes \r\n and trims spaces)
function sanitizeText(text) {
    return text.replace(/\r?\n/g, " ").trim();
}

// Call function to load navigation
loadNavigation();
