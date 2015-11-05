# page-auth

# note

> This Module is part of [glintcms](http://glintcms.com/).
> Please see the [documentation](https://github.com/glintcms/glintcms) for more info.io:node_modules andineck$

This Authentication Module is mainly extracted from the great [Hackathon Starter Project](https://github.com/sahat/hackathon-starter).
It is a server only implementation.

 > Authentication is the process of ascertaining that somebody really is who he claims to be.

## usage
```js
var pageAuth = require('page-auth');
// add as middleware to the main express app.
app.use(pageAuth);
```


## usage notes
 - `wrap-layout` it depends on `wrap-layout`, but doesn't have it declared as `dependencies`.
 - `express-flash` needs to be setup on the main express app.
