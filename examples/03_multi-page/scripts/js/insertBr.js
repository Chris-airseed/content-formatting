document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("p").forEach(paragraph => {
        let br = document.createElement("br");
        paragraph.insertAdjacentElement("afterend", br);
    });
});
