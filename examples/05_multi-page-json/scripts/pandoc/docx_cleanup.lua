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
    debug_log("DEBUG: Raw metadata content:", pandoc.utils.stringify(doc.meta))

    local meta_keep = doc.meta.keep_images

    local function add_to_keep(val)
        if type(val) == "string" then
            keep_set[val] = true
            debug_log("DEBUG: Adding image src to keep_set:", val)
        end
    end

    if not meta_keep then
        debug_log("DEBUG: No keep_images field found in metadata")
    else
        -- Case 1: MetaList
        if meta_keep.t == "MetaList" then
            for _, item in ipairs(meta_keep) do
                add_to_keep(pandoc.utils.stringify(item))
            end

        -- Case 2: MetaInlines (stringified JSON array)
        elseif meta_keep.t == "MetaInlines" then
            local text = pandoc.utils.stringify(meta_keep)
            debug_log("DEBUG: MetaInlines detected, trying to parse:", text)
            if text:sub(1, 1) == "[" then
                local ok, result = pcall(function() return assert(load("return " .. text))() end)
                if ok and type(result) == "table" then
                    for _, val in ipairs(result) do add_to_keep(val) end
                else
                    debug_log("DEBUG: Failed to parse MetaInlines string as Lua table")
                end
            end

        -- Case 3: Already a stringified Lua table (like your input)
        elseif type(meta_keep) == "string" then
            debug_log("DEBUG: keep_images is a raw string, trying to parse:", meta_keep)
            if meta_keep:sub(1, 1) == "[" then
                -- Convert JSON-style brackets to Lua-style
                local lua_expr = meta_keep:gsub("^%[", "{"):gsub("%]$", "}")
                local ok, result = pcall(function() return assert(load("return " .. lua_expr))() end)
                if ok and type(result) == "table" then
                    for _, val in ipairs(result) do add_to_keep(val) end
                else
                    debug_log("DEBUG: Failed to parse string as Lua table")
                end
            else
                debug_log("DEBUG: String does not look like an array")
            end
        end
    end
    

    -- Process all blocks
    local filtered = pandoc.walk_block(pandoc.Div(doc.blocks), {
        Image = function(el)
            if keep_set[el.src] then
                debug_log("DEBUG: Keeping image with source:", el.src)
                return el
            else
                debug_log("DEBUG: Removing image with source:", el.src)
                return {}
            end
        end,
        Figure = function(el)
            if el.caption and el.caption.long and el.caption.long[1] then
                debug_log("DEBUG: Preserving figure caption:", pandoc.utils.stringify(el.caption.long))
            end
            return el
        end
    }).content

    -- Remove first 5 blocks
    local new_blocks = {}
    for i, block in ipairs(filtered) do
        if i > 5 then
            table.insert(new_blocks, block)
        else
            debug_log("DEBUG: Removing block", i)
        end
    end

    debug_log("DEBUG: Final number of blocks:", #new_blocks)
    doc.blocks = new_blocks
    return doc
end

