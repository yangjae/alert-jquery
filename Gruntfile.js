module.exports = function( grunt ) {
  'use strict';

  /**
    Start the web server on port 8080
  */
  grunt.registerTask('server', 'Start express server', function() {
    require('./server.js').listen(8080, function () {
      grunt.log.writeln('Web server running at http://localhost:8080.');
    }).on('close', this.async());
  });

  /**
    Set the server task as our default.
  */
  grunt.registerTask('default', ['server']);
};
