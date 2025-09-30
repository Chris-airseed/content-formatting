from bs4 import Tag, NavigableString
import re
import html
from pathlib import Path
import json

INLINE_TAGS = {
    "b": "bold",
    "strong": "bold",
    "i": "italic",
    "em": "italic",
    "u": "underline",
    "sup": "superscript",
    "sub": "subscript"
}


def tokenize_text(text):
    """
    Split text into normal text and variable placeholders like {varName}
    Returns a list of dicts like {"type": "text", "text": "..."} or {"type": "var", "name": "..."}
    """
    tokens = []
    pattern = re.compile(r'({\w+})')  # match {...}

    parts = pattern.split(text)
    for part in parts:
        if part.startswith("{") and part.endswith("}"):
            tokens.append({ "type": "var", "name": part[1:-1] })  # strip curly braces
        elif part.strip():
            tokens.append({ "type": "text", "text": part })
    return tokens


def clean_text(text):
    # Decode HTML entities like &quot;, &rsquo;, etc.
    text = html.unescape(text)

    # Normalize curly/smart quotes to plain quotes
    replacements = {
        '‘': "'", '’': "'",
        '“': '"', '”': '"',
        '„': '"', '«': '"', '»': '"'
    }
    for orig, repl in replacements.items():
        text = text.replace(orig, repl)

    # Replace non-breaking space and odd encodings
    text = text.replace('\u00A0', ' ').replace('\u00C2', '')

    # Collapse multiple spaces and newlines
    text = re.sub(r'\s+', ' ', text)

    return text


def extract_text_with_links(tag):
    """Extract text and inline tags like <a>, <b>, etc., preserving clean formatting."""
    result = []


    def handle_node(node):
        if isinstance(node, NavigableString):
            text = clean_text(str(node))
            return tokenize_text(text)

        elif isinstance(node, Tag):
            # Handle anchor tags
            if node.name == "a":
                return [{
                    "type": "link",
                    "href": node.get("href"),
                    "text": clean_text(node.get_text()),
                    "class": node.get("class")
                }]
            
            # Handle <b>, <i>, etc.
            elif node.name in INLINE_TAGS:
                return [{
                    "type": INLINE_TAGS[node.name],
                    "content": extract_text_with_links(node)
                }]

            # Handle <div class="icon"> as inline
            elif node.name == "div" and "icon" in node.get("class", []):
                print(f"Found icon div: {node}")
                return [{
                    "type": "icon",
                    "caption": node.get("data-caption"),
                    "text": "",
                    "iconName": node.get("data-icon-name"),
                    "iconType": node.get("data-icon-type")
                }]

            # Ignore other divs (especially inside paragraphs)
            elif node.name == "div":
                print(f"Skipping div: {node}")
                return []  # skip generic divs in inline parsing

            # Fallback
            else:
                print(f"Unknown tag: {node.name}. Skipping.")
                print(f"Node: {node}")
                return [{
                    "type": node.name,
                    "attributes": dict(node.attrs),
                }]

        return []


    for child in tag.contents:
        item = handle_node(child)
        if item:
            if isinstance(item, list):
                result.extend(item)  # multiple tokens (text + var)
            else:
                result.append(item)


    return result




def html_convert(soup):
    stack = []
    root = []

    def create_section(tag):
        return {
            "title": tag.get_text(strip=True),
            "level": int(tag.name[1]),
            "content": [],
            "children": []
        }

    # Step 1: Identify the footnotes section so we can exclude its children
    footnotes_section = soup.find("section", class_="footnotes")
    footnote_ids = set()
    if footnotes_section:
        footnote_ids = {id_tag.get("id") for id_tag in footnotes_section.find_all(True) if id_tag.get("id")}

    # Step 2: Get all top-level elements (not inside footnotes)
    elements = []
    for tag in soup.find_all(['h1', 'h2', 'h3', 'p', 'div', 'ul', 'ol']):
        parent = tag.find_parent("section", class_="footnotes")
        if not parent and tag.get("id") not in footnote_ids:
            if not tag.find_parent(["ol", 'ul', 'dl']): ## Skip if inside a list as this duplicates the content
                elements.append(tag)



    # Step 3: Parse normal content
    for elem in elements:
        if elem.name in ['h1', 'h2', 'h3']:
            section = create_section(elem)
            while stack and stack[-1]['level'] >= section['level']:
                stack.pop()
            if stack:
                stack[-1]['children'].append(section)
            else:
                root.append(section)
            stack.append(section)

        elif elem.name == 'p':
            if stack:
                stack[-1]['content'].append({
                    "type": "paragraph",
                    "content": extract_text_with_links(elem)
                })

        elif elem.name == 'div':
            div_class = elem.get("class", [])
            attrs = elem.attrs

            # Handle div[data-sub-navigation]
            if 'data-sub-navigation' in attrs:
                nav_data = {
                    "type": "subNavigation",
                    "parent": attrs.get("data-parent")
                }
                if stack:
                    stack[-1]['content'].append(nav_data)
                continue
            
            # Skip div.icon here (already handled inline)
            if "icon" in div_class:
                continue

            div_type = div_class[0] if div_class else "other"
            div_content = {
                "type": div_type,
                **{key: value for key, value in elem.attrs.items() if key != "class"},
                "text": elem.get_text(strip=True)
            }
            div_content = {key.replace("data-", ""): value for key, value in div_content.items()}

            # camelCase keys
            for key in list(div_content.keys()):
                if "-" in key:
                    parts = key.split("-")
                    new_key = parts[0] + "".join(part.capitalize() for part in parts[1:])
                    div_content[new_key] = div_content.pop(key)

            if stack:
                stack[-1]['content'].append(div_content)


        elif elem.name in ['ul', 'ol']:
            items = []
            for li in elem.find_all("li", recursive=False):
                p = li.find("p")
                if p:
                    items.append({
                        "content": extract_text_with_links(p)
                    })
                else:
                    items.append({
                        "content": extract_text_with_links(li)
                    })
            if stack:
                stack[-1]['content'].append({
                    "type": "list",
                    "ordered": elem.name == "ol",
                    "items": items
                })

    # Step 4: Parse footnotes separately
    footnotes = []
    if footnotes_section:
        for i, li in enumerate(footnotes_section.find_all("li"), start=1):
            fn_id = li.get("id", f"fn{i}")
            p = li.find("p")
            if p:
                backlink = p.find("a", class_="footnote-back")
                if backlink:
                    backlink.extract()
                footnotes.append({
                    "id": fn_id,
                    "number": i,
                    "content": extract_text_with_links(p)
                })

    return {
        "content": root,
        "footnotes": footnotes
    }


def clean_string(text):
    """
    Clean string fields by replacing multiple newlines with a single space.
    """
    if not isinstance(text, str):
        return text
    return re.sub(r'\n{2,}', ' ', text)

def clean_nested_json(data):
    """
    Recursively traverse and clean all string values in the JSON structure.
    """
    if isinstance(data, dict):
        return {k: clean_nested_json(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [clean_nested_json(item) for item in data]
    elif isinstance(data, str):
        return clean_string(data)
    return data