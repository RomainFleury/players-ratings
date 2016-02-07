'use strict';

module.exports = function(grunt) {

    require('load-grunt-tasks')(grunt);
    // Time how long tasks take. Can help when optimizing build times
    require('time-grunt')(grunt);

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),


        eslint: {
            options:{
                rules:{
                    "no-undef":0,
                    "quotes": [
                        2,
                        "double"
                    ],
                    "no-extend-native":0,
                    "no-unused-vars":1,
                    "no-shadow":1
                }
            },
            target: ['<%= pkg.directories.scripts_dev %>']
        },

        copy: {
            main: {
                files: [
                    // includes files within path
                    {
                        expand: true,
                        cwd: '<%= pkg.directories.application_dev %>',
                        src: [
                            '<%= pkg.directories.scripts_dev %>/**/*',
                            '<%= pkg.directories.bower_files %>/**/*',
                            'index.html',
                            '<%= pkg.directories.styles_dev %>/**/*',
                            '<%= pkg.directories.images_dev %>/**/*',
                            'manifest.json',
                            'browserconfig.xml'
                        ],
                        dest: '<%= pkg.directories.application_prod %>',
                        filter: 'isFile'
                    }
                ]
            },
            fonts: {

                expand: true,
                flatten: true,
                src: ['<%= pkg.directories.application_dev %>/libs/bower_components/font-awesome/fonts/**'],
                dest: '<%= pkg.directories.application_prod %>/fonts/',
                filter: 'isFile'

            }
        },


        ngtemplates: {
            TplCache: {
                module: 'TplCache',
                cwd: '<%= pkg.directories.application_dev %>',
                src: 'app/templates/**.html',
                dest: '<%= pkg.directories.application_prod %>/scripts/app/cache/templates.js',
                url: function(url) {
                    return url.replace('<%= pkg.directories.application_prod %>/templates', '/templates');
                },
                options: {
                    bootstrap: function(module, script) {
                        return '(function () { angular.module("TplCache", []); angular.module("TplCache").run(["$templateCache", function($templateCache){' + script + '}]);  })();';
                    }
                }
            }
        },


        // Reads HTML for usemin blocks to enable smart builds that automatically
        // concat, minify and revision files. Creates configurations in memory so
        // additional tasks can operate on them

        useminPrepare: {
            html: [
                '<%= pkg.directories.application_prod %>/index.html'
            ],
            options: {
                dest: '<%= pkg.directories.application_prod %>',
                flow: {
                    html: {
                        steps: {
                            js: ['concat', 'uglifyjs'],
                            css: ['cssmin']
                        },
                        post: {}
                    }
                }
            }
        },

        // Performs rewrites based on filerev and the useminPrepare configuration
        usemin: {
            html: [
                '<%= pkg.directories.application_prod %>/index.html'
            ]
        },

        clean: {
            public: ['<%= pkg.directories.application_prod %>'],
            finishBuild: [
                '<%= pkg.directories.application_prod %>/scripts',
                '<%= pkg.directories.application_prod %>/styles/app.css',
                '<%= pkg.directories.tmp %>'
            ]
        }


    });


    grunt.registerTask('build', [
        'clean:public',
        'copy:main',
        'copy:fonts',
        // 'ngtemplates',
        'useminPrepare',
        'concat',
        'uglify',
        'cssmin',
        'usemin',
        // 'clean:finishBuild'
    ]);

    grunt.registerTask('dev',
        ['eslint']
    );

    grunt.registerTask('cleanBuild', [
        'clean:public'
    ]);
};
