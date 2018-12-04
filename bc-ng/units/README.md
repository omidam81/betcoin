# Important Information About Units

All paths like /UNIT/SOME_PATH/SOME_FILE.EXT are valid (except README.md)
	
**So don't put no api secrets and ish like that in /units, that goes in config**

All folders and files in a unit are optional.  The system knows how to build them if they are present.  There is no problem if they are missing.  Some units may only need a little js and a few templates.  Some may be more elaborate like the __common unit and other heavily depended on units.

## Manifests

You can use manifest files to append or prepend js/css from any directory, see /units/__common/manifest.js for example.