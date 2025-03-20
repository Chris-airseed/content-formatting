-- Removes first 3 blocks from docx file to remove title page of the document
-- Removes images from docx file based on metadata.keep_images

-- Removes all page breaks that interfere with the conversion to HTML 
-- Works but didn't fix issue with figures with page breaks directly after them not being considered as figures
-- function Para (elem)
--     local new_content = {}

--     for i, item in ipairs(elem.content) do
--         -- Detect OpenXML page break tags and replace them with a newline
--         if item.t == "RawInline" and item.format == "openxml" and string.match(item.text, "<w:br w:type=[\"']page[\"']") then
--             table.insert(new_content, pandoc.RawInline("openxml", "<w:p></w:p>"))  -- Insert a new paragraph
--         else
--             table.insert(new_content, item)
--         end
--     end

--     -- Replace paragraph content with modified content
--     elem.content = new_content
--     return elem
-- end

local image_counter = 0
local keep_set = {} -- Lookup table of images to keep
local image_positions = {} -- Maps image index to element
local log_file = io.open("lua_log.txt", "w")

-- Custom debug print function to prevent HTML output
function debug_log(...)
    local args = {...}
    for i, v in ipairs(args) do
        if type(v) ~= "string" then
            args[i] = pandoc.utils.stringify(v) -- Convert Pandoc objects to strings
        end
    end
    local msg = table.concat(args, " ")
    log_file:write(msg .. "\n")
    log_file:flush()
end

-- First pass: Collect image positions
function CollectImages(el)
    image_counter = image_counter + 1
    image_positions[image_counter] = el
    debug_log("DEBUG: Found image at position", image_counter, "with source", el.src)
end

-- Second pass: Remove unwanted images
function Image(el)
    for index, img in pairs(image_positions) do
        if img == el then
            if keep_set[index] then
                debug_log("DEBUG: Keeping image at position", index, "with source", el.src)
                return el -- Keep image as is
            else
                debug_log("DEBUG: Removing image at position", index, "with source", el.src)
                return {} -- Remove image
            end
        end
    end
    debug_log("DEBUG: Image not found in collected positions, keeping by default:", el.src)
    return el
end

-- Ensure Pandoc does not strip caption numbers
function Figure(el)
    if el.caption and el.caption.long and el.caption.long[1] then
        debug_log("DEBUG: Preserving figure caption:", pandoc.utils.stringify(el.caption.long))
        return el
    end
end

-- Modify Pandoc document
function Pandoc(doc)
    debug_log("DEBUG: Raw metadata content:", doc.meta)

    local meta_keep_images = doc.meta.keep_images
    if not meta_keep_images then
        debug_log("DEBUG: keep_images metadata missing or incorrect format")
        return doc
    end

    for num in string.gmatch(meta_keep_images, "%d+") do
        num = tonumber(num)
        if num then
            keep_set[num] = true
            debug_log("DEBUG: Adding image to keep_set:", num)
        end
    end

    debug_log("DEBUG: Scanning for images...")
    pandoc.walk_block(pandoc.Div(doc.blocks), { Image = CollectImages })
    debug_log("DEBUG: Total images found:", image_counter)

    debug_log("DEBUG: Filtering images...")
    local processed_blocks = pandoc.walk_block(pandoc.Div(doc.blocks), { Image = Image, Figure = Figure }).content
    debug_log("DEBUG: Number of blocks after image filtering:", #processed_blocks)

    -- Now remove the first three blocks AFTER processing images
    local new_blocks = {}
    for i, block in ipairs(processed_blocks) do
        if i > 5 then -- Skip the first 3 blocks
            table.insert(new_blocks, block)
        else
            debug_log("DEBUG: Removing block", i)
        end
    end

    debug_log("DEBUG: Final number of blocks:", #new_blocks)

    doc.blocks = new_blocks
    return doc
end
