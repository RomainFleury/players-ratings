'use strict';

module.exports = function(grunt) {

    require('load-grunt-tasks')(grunt);
    // Time how long tasks take. Can help when optimizing build times
    require('time-grunt')(grunt);

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
		eslint: {
			all: ['bestPlayerApp/public/**/*.js']
		}
    });
	
	grunt.loadNpmTasks('eslint-grunt');
	
	grunt.registerTask('default',[
		'eslint'
	]);
}