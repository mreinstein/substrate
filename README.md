# Substrate

literate programming with javascript, markdown, and explorables


## TODO

* implement directory scanning prototype
  - given an input directory, look for all `*.explorable.md` files
  - watch them for changes and for new files
  - reload the page when the viewed file changes
  - build a directory of browsable files
  - render that directory in a nav menu

* move the example files into `examples/`
* generate table of contents from markdown header sections  http://play.witheve.com/#/examples/quickstart.eve
* support anchors within iframes http://shorts.jeffkreeftmeijer.com/2014/scroll-to-anchors-in-iframes/
* provide a way to specify javascript blocks as collapsed by default
* could we preserve approximate scroll position on reload?
  - some kind of detection in the editor and `scrollTo` that when the reload is complete?   
* importing a non-existent explorable crashes server.js
* importing an explorable with no default export throws a console error within editor.html
* move the rollup plugin to it's own repo
* enable build string replacement (e.g., `__MODULES_SUPPORTED__`)

