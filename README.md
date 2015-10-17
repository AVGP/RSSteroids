RSSteroids
======

Meteor.js based RSS reader. Responsive. Reactive. Juicy.


## Installation
To install RSSteroids, you need the following installed:

* node.js - the basis
* [meteorite](https://github.com/oortcloud/meteorite) - install via ```npm install -g meteorite```

## Install the node-feedparser module
Run the app with

    $ mrt
it will crash, because it misses the feedparser node.js module.  
Kill the running meteorite instance and go into the server subdirectory and install feedparser there:

    $ cd .meteor/local/build/server
    $ npm install feedparser
    $ cd ../../../../
    
## Run it!
To run it, you can now (again) use

    $ mrt
and see the app running at [http://localhost:3000](http://localhost:3000)

## Deploy
You can deploy it like any other meteor application.
Make sure to use ```mrt``` instead of ```meteor``` as RSSteroids uses meteorite packages.

For the full documentation of the process see [the meteor deployment docs](http://docs.meteor.com/#deploying).


