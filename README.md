# Substrate

literate programming with javascript, markdown, and explorables


## TODO

* importing a non-existent explorable crashes server.js
* importing an explorable with no default export throws a console error within editor.html
* generate table of contents from markdown header sections  http://play.witheve.com/#/examples/quickstart.eve
* support anchors within iframes http://shorts.jeffkreeftmeijer.com/2014/scroll-to-anchors-in-iframes/
* could we preserve approximate scroll position on reload?
  - some kind of detection in the editor and `scrollTo` that when the reload is complete?
* provide a way to specify javascript blocks as collapsed by default 
* move the rollup plugin to it's own repo
* enable build string replacement (e.g., `__MODULES_SUPPORTED__`)
