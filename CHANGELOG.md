# 9.4.1
* fix #27

# 9.4.0
* update ecma version from 2020 -> 2022

# 9.3.0
* improve readability by limiting max line width, other ergonomic improvements
* initial work on a built-in draggable element, `<substrate-draggable>`

# 9.2.0
* constrain rendered image widths in markdown
* update marked dep

# 9.1.0
* update substrate-build dep

# 9.0.0
* switch ecmaVersion from 2018 to 2020 for optional chaining support and nullish coalescing 
* update deps


# 8.2.0
* add `--port` and `--help` command line arguments
* update deps


# 8.1.0
* ignore all node_modules directories when watching


# 8.0.0
* update markdown parser and other deps


# 7.0.0
* update markdown parser and other deps


# 6.8.2
* update deps


# 6.8.1
* tweak margin on list page
* tweak padding on viewer page


# 6.8.0
* use pinned versions of modules from skypack for better performance
* centralize dependencies into deps.js
* fix postcss command line warning
* update highlight.js to 10.7.2, embed locally
* update several npm dependencies


# 6.7.3
* make table of contents stand out from document a bit more


# 6.7.2
* tweak padding on preview iframe


# 6.7.1
* scroll the table of contents when it's taller than viewport height


# 6.7.0
* indent table of contents items by heading level


# 6.6.3
* update deps


# 6.6.2
* update deps
* stop disabling touch-action in the viewer page


# 6.6.1
* send page data immediately rather than waiting for 1 second


# 6.6.0
* replace HTTP polling with Server Sent Events (sse)
* update deps


# 6.5.3
* fix windows support


# 6.5.2
* add some really basic, terrible documentation
* lightly tweak the tree view styles


# 6.5.1
* remove debug console statements


# 6.5.0
* generate table of contents from markdown header sections #4
* allow scrolling to sections in table of contents #5
* render the list of all explorables as a heierachical tree #15
* add placeholder icon


# 6.4.0
* implement hierarchical rendering in nav drawer #14


# 6.3.1
* re-publish npm module to remove some extraneous files that were included


# 6.3.0
* changed parser from espree to acorn


# 6.2.0
* render explorable blocks in collapsed <details> elements
* fix highlight.js font rendering
* update highlight.js to 10.3.2


# 6.1.1
* fix broken explorables


# 6.1.0
* support importing npm modules from explorable.md files
* update `author` field in `package.json`
* add this changelog


# 6.0.0
* initial commit after re-purposing `substrate` to literate programming.
