Requires node 0.10.26+

## `npm install`

* the system will be waiting for you to type "yes" and press enter, because it asks you to verify an SSH fingerprint, but NPM acts weird. So if it's hanging, then stopping when you press enter, type "yes" and press Enter.

## `grunt`

### if you get this: Running "getBower" task \n Fatal error: `bower list' exited with status 1 
* ... It means there is some weird permissions error with bower; do one of these two things, one time:
1. If this is happening while you are logged in as root you need to create a user; don't run the project as root.
2. If this is happening while you are NOT logged in as root, you will need to do the bower install manually using sudo and use the flag --allow-root. 

## `cd web`
## `npm install optimist send`

## `node server`
### ( or node server --loc zh_CN --base-href <your-chinese-url> for Chinese )

## Browse http://localhost:3002/template

### Test minified DIST builds BEFORE you push!

### Don't use --force on anything you are submitting to the GIT server

