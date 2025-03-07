-- Removes first 3 blocks from docx file to remove title page of the document
-- Removes images from docx file based on metadata.keep_images

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
    local processed_blocks = pandoc.walk_block(pandoc.Div(doc.blocks), { Image = Image }).content
    debug_log("DEBUG: Number of blocks after image filtering:", #processed_blocks)

    -- Now remove the first three blocks AFTER processing images
    local new_blocks = {}
    for i, block in ipairs(processed_blocks) do
        if i > 3 then -- Skip the first 3 blocks
            table.insert(new_blocks, block)
        else
            debug_log("DEBUG: Removing block", i)
        end
    end

    debug_log("DEBUG: Final number of blocks:", #new_blocks)

    doc.blocks = new_blocks
    return doc
end
