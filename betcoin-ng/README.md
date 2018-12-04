# betcoin-ng #

## Building ##

1. Clone the repo `git clone git@bitbucket.org:betcn/betcoin-ng`
2. Install dependencies `cd betcoin-ng && npm install`
3. Build `make`
4. Start the server with `node node/server`
5. Go to http://localhost:3002 in your browser

### Build Options ###

You can specify a server to point to with the CONF variable. `make
CONF=dev` is the default. Using `make CONF=local` with point all API
traffic to `https://local.betcoin.tm`. `make CONF=foobar` will point to
`https://foobar.betcoin.tm`.

To test minification, run `make BUILD_ENV=prod`. The default is `dev`.

Locale building is dome with `make LOC=zh_CN`. The default is `en_US`.

Using `make watch` will load the gulp watch task, which will auto
update when you save files. However, it will not track new files. If
you add a new file, ^C the watch process and start it again.

## **IMPORTANT** ##

All of the locale files are being processed with pure ejs now, rather
than a i18n specific module. The old module used ejs like tags anyway,
so we are good there.

The issue is that `<%= %>` tags in ejs will *escape any HTML in the
string*. You need to use the `<%- %>` tags instead for anything that
will contain html fragments (or just everywhere, to get into the
habit).

If you are copying over a file from the old repo, or you notice html
being escaped when it renders, you can do a replace of all of these
easily with sed.

```sh
sed -i 's/<%=/<%-/g' input-file.html
```

## App Structure ##

```
src
├── apps - apps go here
│   └── account - each app has it's own assets similar to the main application
│       ├── html
│       ├── images
│       ├── js
│       │   └── controllers
│       │   └── directives
│       │   └── filters
│       │   └── services
│       │   └── resources
│       └── less
├── devapps
├── html - these are any html that is imported via angular, they are compiled to js templates
├── images - gets put into /img when built
├── index.html - main entry point for the application, the only html that is not put into a js template
├── js - common js files
│   ├── controllers
│   ├── directives
│   ├── filters
│   ├── services
│   ├── resources
│   └── modules - more submodules that are loaded in
├── less
├── locales
└── vendor - all 3rd party js
```
