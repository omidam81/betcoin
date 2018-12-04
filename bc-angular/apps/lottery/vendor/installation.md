#Installation

* Copy SlotMachine.js to the root JS folder

`cp download/SlotMachine.js cryptoreels_path/htdocs/js/SlotMachine.js`

* Copy home.js to the theme JS directory

`cp download/home.js cryptoreels_path/htdocs/themes/cryptoreels/js/SlotMachine.js`

* Run the build software and minify the files

`cd cryptoreels_path/htdocs`

`ruby ../build/watch.rb` (leave this running in another screen)

Open in your favorite text editor SlotMachine.js and just save it, without making any modifications.

`vim cryptoreels_path/htdocs/js/SlotMachine.js` `:wq`

You'll see in the screen running the build script that changes have been detected and the script is currently minifying the files.

Once the script has finished running, you can check the changes in the web browser.