module.exports = function start(args) {
  var app = require('./server')(args);
  var port = args.port || process.env.PORT || 8080;
  app.listen(port);
  console.log("server pid %s listening on port %s in %s mode", process.pid, port, process.env.NODE_ENV);
};

if (require.main === module) {
  var args = require('subarg')(process.argv.slice(2));
  module.exports(args);
}
