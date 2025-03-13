document.addEventListener("DOMContentLoaded", () => {
    console.log("🚀 Auto-wrapping script started...");

    function wrapHeadings(container) {
        const allHeadings = container.querySelectorAll("h1:not(.wrapped)");
    
        console.log(`🔍 Found ${allHeadings.length} new H1 elements.`);
    
        if (allHeadings.length === 0) {
            return;
        }
    
        // Disconnect observer temporarily to prevent unnecessary re-triggers
        observer.disconnect();
    
        allHeadings.forEach((h1) => {
            console.log(`✅ Wrapping H1: ${h1.innerText}`);
    
            // Create a wrapper
            const wrapper = document.createElement("div");
            wrapper.classList.add("h1-section");
    
            // Transfer H1 ID to the wrapper (if it has one)
            if (h1.id) {
                wrapper.id = h1.id;
                h1.removeAttribute("id"); // Prevent duplicate IDs
            }
    
            // Move H1 into the wrapper
            h1.parentNode.insertBefore(wrapper, h1);
            wrapper.appendChild(h1);
            h1.classList.add("wrapped"); // Mark as processed
    
            // Move all elements until the next H1
            let nextElem = wrapper.nextSibling; // Start with the next element
            while (nextElem && !(nextElem.tagName && nextElem.tagName.startsWith("H1"))) {
                console.log(`↪ Moving: ${nextElem.tagName || "TEXT_NODE"}`);
                const next = nextElem.nextSibling; // Store next sibling before moving
                wrapper.appendChild(nextElem); // Move the element inside wrapper
                nextElem = next; // Update nextElem for the loop
            }
        });
    
        console.log("🎉 H1 sections wrapped!");
    
        // Reconnect observer after modifications
        observer.observe(contentDiv, { childList: true, subtree: true });
    }
      
    

    const observer = new MutationObserver((mutations) => {
        let newContentAdded = false;

        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1 && node.tagName === "H1" && !node.classList.contains("wrapped")) {
                    newContentAdded = true;
                }
            });
        });

        if (newContentAdded) {
            console.log("🔄 Detected new H1 elements, wrapping...");
            wrapHeadings(contentDiv);
        }
    });

    const contentDiv = document.querySelector("#content");

    if (contentDiv) {
        // Run once for initial content
        setTimeout(() => wrapHeadings(contentDiv), 500);

        // Start observing for new H1 elements
        observer.observe(contentDiv, { childList: true, subtree: true });
    } else {
        console.error("❌ #content not found!");
    }
});
