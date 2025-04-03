function wrapHeadings(container) {
    if (!container) return;
    const allHeadings = container.querySelectorAll("h1:not(.wrapped)");

    if (allHeadings.length === 0) {
        console.warn("⚠ No new H1 elements found.");
        return;
    }

    allHeadings.forEach((h1) => {
        console.log(`✅ Wrapping H1: ${h1.innerText}`);

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
        let nextElem = wrapper.nextSibling;
        while (nextElem && !(nextElem.tagName && nextElem.tagName.startsWith("H1"))) {
            const next = nextElem.nextSibling;
            wrapper.appendChild(nextElem);
            nextElem = next;
        }
    });

    console.log("🎉 H1 sections wrapped!");
}
