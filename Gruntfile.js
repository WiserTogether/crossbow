/*
 * assemble-bootstrap
 * http://github.com/assemble/assemble-bootstrap
 *
 * Copyright (c) 2013 Jon Schlinkert
 * MIT License
 */
"use strict";

module.exports = function(grunt) {

  var pretty = require('pretty');
  var vendor = grunt.file.readJSON('.bowerrc').directory;
  if(!grunt.file.exists(vendor + '/bootstrap/_config.yml')) {
    grunt.fail.fatal('>> Please run "bower install" before continuing.');
  }

  // Project configuration.
  grunt.initConfig({

    // Project metadata
    pkg   : grunt.file.readJSON('package.json'),
    site  : grunt.file.readYAML('_config.yml'),
    vendor: vendor,

    // Convenience
    bootstrap: '<%= vendor %>/bootstrap',

    // Run Bootstrap's own Gruntfile.
    subgrunt: {
      test: {
        options: {task: 'test'},
        src: ['<%= bootstrap %>']
      },
      js: {
        options: {task: 'concat'},
        src: ['<%= bootstrap %>']
      },
      css: {
        options: {task: 'less'},
        src: ['<%= bootstrap %>']
      },
      dist: {
        options: {task: 'dist'},
        src: ['<%= bootstrap %>']
      },
      all: {
        options: {task: 'default'},
        src: ['<%= bootstrap %>']
      }
    },

    watch: {
      assemble: {
        files: ['<%= site.templates %>/{,*/}*.{md,hbs,yml}'],
        tasks: ['assemble']
      },
      less: {
        files: ['/less/{,*/}*.less'],
        tasks: ['less']
      },
      img: {
        files: ['<%= site.dest %>/assets/{,*/}*.{png,jpg,jpeg,gif,webp,svg}'],
        tasks: ['copy:images']
      },
      livereload: {
        options: {
          livereload: '<%= connect.options.livereload %>'
        },
        files: [
          '<%= site.root %>/{,*/}*.html',
          '<%= site.root %>/assets/{,*/}*.css',
          '<%= site.root %>/assets/{,*/}*.js',
          '<%= site.root %>/assets/{,*/}*.{png,jpg,jpeg,gif,webp,svg}',
          '<%= site.templates %>/data/{,*/}*.{yaml,json}',
        ]
      }
    },

    // Regex for refactor task.
    replacements: require('./tasks/replacements'),

    // Refactor Liquid to Handlebars so we can
    // build with Assemble instead of Jekyll
    frep: {
      bootstrap: {
        options: {
          replacements: '<%= replacements.bootstrap %>'
        },
        files: [
          {expand: true, cwd: '<%= bootstrap %>/docs', src: ['*.html', '_layouts/*.html', '_includes/*.html'], dest: 'templates/', ext: '.hbs'}
        ]
      },
      examples: {
        options: {
          replacements: '<%= replacements.examples %>'
        },
        files: [
          {expand: true, filter: 'isFile', cwd: '<%= bootstrap %>/docs/examples', src: ['{*,**}/*.html'], dest: '<%= site.dest %>/examples/'}
        ]
      }
    },

    assemble: {
      options: {
        flatten: true,
        assets: '<%= site.assets %>',
        data: '<%= site.data %>/*.{json,yml}',

        // Metadata
        site: '<%= site %>',

        // Templates
        partials: '<%= site.includes %>',
        layoutdir: '<%= site.layouts %>',
        layout: '<%= site.layout %>',
      },
      site: {
        src: ['templates/*.hbs'],
        dest: '<%= site.dest %>/'
      }
    },


    // Compile LESS to CSS
    less: {
      options: {
        paths: [
          '<%= site.theme %>',
          '<%= site.theme %>/bootstrap',
          '<%= site.theme %>/components',
          '<%= site.theme %>/utils'
        ],
      },
      site: {
        src: ['<%= site.theme %>/site.less'],
        dest: '<%= site.assets %>/css/site.css'
      }
    },


    copy: {
      vendor: {
        files: {
          //'<%= site.assets %>/js/highlight.js': ['<%= vendor %>/highlightjs/highlight.pack.js'],
          //'<%= site.assets %>/css/github.css':  ['<%= vendor %>/highlightjs/styles/github.css']
        }
      },
      assets: {
        files: [
          {expand: true, cwd: '<%= bootstrap %>/docs/examples', src: ['**/*.css', '**/*.{jpg,png,gif}'], dest: '<%= site.dest %>/examples/'},
          {expand: true, cwd: '<%= bootstrap %>/docs/assets', src: ['**'], dest: '<%= site.assets %>/'},
          {expand: true, cwd: '<%= bootstrap %>/_data', src: ['**'], dest: '<%= site.data %>/'},
          {expand: true, cwd: '<%= bootstrap %>/dist', src: ['**'], dest: '<%= site.assets %>/'},
          //{expand: true, cwd: '<%= bootstrap %>/docs/examples', src: ['**'], dest: '<%= site.assets %>/'},
        ]
      },
      update: {
        files: [
          {expand: true, cwd: '<%= bootstrap %>/less', src: ['*', '!{var*,mix*,util*}'], dest: '<%= site.theme %>/bootstrap/'},
          {expand: true, cwd: '<%= bootstrap %>/less/mixins', src: ['**'], dest: '<%= site.theme %>/mixins'},
          {expand: true, cwd: '<%= bootstrap %>/less', src: ['{util*,mix*}.less'], dest: '<%= site.theme %>/utils'},
          {expand: true, cwd: '<%= bootstrap %>/less', src: ['variables.less'], dest: '<%= site.theme %>/'},
        ]
      }
    },

    clean: {
      dist: ['<%= site.dest %>/**/*', '!<%= site.dest %>/.{git,gitignore}'],
      update: ['<%= site.theme %>/bootstrap/{var*,mix*,util*}.less']
    },

    connect: {
      options: {
        port: 9000,
        livereload: 35729,
        // change this to '0.0.0.0' to access the server from outside
        hostname: 'localhost'
      },
      livereload: {
        options: {
          open: true,
          base: [
            '<%= site.dest %>'
          ]
        }
      }
    },

  });

  grunt.config.set('site.description', 'Generated by http://assemble.io');

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('assemble');
  grunt.loadNpmTasks('assemble-less');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-frep');
  grunt.loadNpmTasks('grunt-sync-pkg');
  grunt.loadNpmTasks('grunt-verb');

  // Load local "Subgrunt" task to run Bootstrap's Gruntfile.
  grunt.loadTasks('tasks');

  grunt.registerTask('server', [
    'clean',
    'subgrunt:js',
    'subgrunt:css',
    'copy',
    'frep',
    'assemble',
    'less',
    'sync',
    'connect:livereload',
    'watch'
  ]);

  // Tests task.
  grunt.registerTask('test', ['subgrunt:test']);

  grunt.registerTask('dev', ['clean', 'frep', 'assemble']);

  grunt.registerTask('update', ['copy:update', 'clean:update']);

  // Default task to be run with the "grunt" command.
  grunt.registerTask('default', [
    'clean',
    'subgrunt:js',
    'subgrunt:css',
    'copy',
    'frep',
    'assemble',
    'less',
    'sync',
    'connect:livereload',
    'watch'
  ]);
};
