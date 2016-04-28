// Gruntfile for the JS build

module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    eslint: {
      options: {
        //configFile: 'eslint.json'
      },
      target: 'src'
    },
    webpack: {
      options: require('./webpack.config.js'),
      build: {
        // ??
      }
    },
    uglify: {
      build: {
        src: 'dist/AudioFeeder.js',
        dest: 'dist/AudioFeeder.min.js'
      }
    }
  });

  grunt.loadNpmTasks('grunt-eslint');
  grunt.loadNpmTasks('grunt-webpack');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask('default', ['eslint', 'webpack', 'uglify']);

};
