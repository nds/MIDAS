// Gruntfile.js
// jt6 20141202 WTSI
//
// build file for the HICF website. Based on an auto-generated grunt config
// built using generator-webapp 0.5.1

// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// If you want to recursively match all subfolders, use:
// 'test/spec/**/*.js'

// needed to make jshint happy
/*global require, module*/

module.exports = function (grunt) {
  'use strict';

  // time how long tasks take. Can help when optimizing build times
  require('time-grunt')(grunt);

  // load grunt tasks automatically (using the JIT loader)
  require('jit-grunt')(grunt, {
    useminPrepare: 'grunt-usemin'
  });

  // define the configuration for all the tasks
  grunt.initConfig({

    // project settings
    config: {
      app: 'app',
      dist: 'dist'
    },

    // clean up
    clean: {
      // removes the distribution and temp dirs
      dist: {
        files: [{
          dot: true,
          src: [
            '.tmp',
            '<%= config.dist %>/*',
            '!<%= config.dist %>/.git*'
          ]
        }]
      },
      // removes just the temp space
      server: '.tmp'
    },

    // lint all of the javascript code
    jshint: {
      options: {
        jshintrc: '.jshintrc',
        reporter: require('jshint-stylish-ex'),
        ignores: [ '<%= config.app %>/root/static/javascripts/vendor/**' ]
      },
      all: [
        'Gruntfile.js',
        '<%= config.app %>/root/static/javascripts/{,*/}*.js',
        'test/spec/{,*/}*.js'
      ]
    },

    // Mocha testing framework configuration options
    // mocha: {
    //   all: {
    //     options: {
    //       run: true,
    //       urls: ['http://<%= connect.test.options.hostname %>:<%= connect.test.options.port %>/index.html']
    //     }
    //   }
    // },

    // names assets with revision IDs
    filerev: {
      assets: {
        src: [
          '<%= config.dist %>/root/static/javascripts/{,*/}*.js',
          '<%= config.dist %>/root/static/styles/{,*/}*.css',
          '<%= config.dist %>/root/static/*.{ico,png}',
          '<%= config.dist %>/root/static/images/**/*'
        ]
      }
    },

    // reads the main page template to find files that can be minified and
    // renamed with version IDs
    useminPrepare: {
      options: {
        dest: '<%= config.dist %>/root/static'
      },
      all: {
        src: [ '<%= config.app %>/root/templates/wrapper.tt',
               '<%= config.app %>/root/templates/components/favicon.tt' ]
      }
      // html: '<%= config.app %>/root/templates/wrapper.tt'
      // html: '<%= config.app %>/root/templates/components/favicon.tt'
    },

    // rewrites and renames asset files
    usemin: {
      options: {
        assetsDirs: [
          '<%= config.dist %>/root/static',
          '<%= config.dist %>/root/static/javascripts',
          '<%= config.dist %>/root/static/images',
          '<%= config.dist %>/root/static/styles'
        ],
        blockReplacements: {
          ati: function(block) {
            grunt.log.debug('found an ati');
            var re = block.dest.match( /-(\d+x\d+)\./ );
            return '<link rel="apple-touch-icon" sizes="'+re[1]+'" href="'+block.dest+'">';
                 // <link rel="apple-touch-icon" sizes="57x57" href="/apple-touch-icon-57x57.png">
          },
          icon: function(block) {
            grunt.log.debug('found an icon');
            var re = block.dest.match( /-(\d+x\d+)\./ );
            return '<link rel="icon" type="image/png" href="'+block.dest+'" sizes="'+re[1]+'">';
                 // <link rel="icon" type="image/png" href="/favicon-192x192.png" sizes="192x192">
          },
          tile: function(block) {
            grunt.log.debug('found a tile');
            return '<meta name="msapplication-TileImage" content="'+block.dest+'">';
                 // <meta name="msapplication-TileImage" content="/mstile-144x144.png">
          }
        }
      },
      // html: ['<%= config.dist %>/root/{,*/}*.tt',
      html: ['<%= config.dist %>/root/templates/wrapper.tt',
             '<%= config.dist %>/root/templates/components/favicon.tt'],
      css: ['<%= config.dist %>/root/static/styles/{,*/}*.css']
    },

    // The following *-min tasks produce minified files in the dist folder
    imagemin: {
      dist: {
        files: [{
          expand: true,
          cwd: '<%= config.app %>/root/static/images',
          src: '{,*/}*.{gif,jpeg,jpg,png}',
          dest: '<%= config.dist %>/root/static/images'
        }]
      }
    },

    // not currently used
    // svgmin: {
    //   dist: {
    //     files: [{
    //       expand: true,
    //       cwd: '<%= config.app %>/images',
    //       src: '{,*/}*.svg',
    //       dest: '<%= config.dist %>/images'
    //     }]
    //   }
    // },

    // minifies HTML, doesn't work with some TT code though
    // htmlmin: {
    //   dist: {
    //     options: {
    //       collapseBooleanAttributes: true,
    //       collapseWhitespace: true,
    //       conservativeCollapse: true,
    //       removeAttributeQuotes: true,
    //       removeCommentsFromCDATA: true,
    //       removeEmptyAttributes: true,
    //       removeOptionalTags: true,
    //       removeRedundantAttributes: true,
    //       useShortDoctype: true
    //     },
    //     files: [{
    //       expand: true,
    //       cwd: '<%= config.dist %>/views',
    //       src: '{,*/}*.tt',
    //       dest: '<%= config.dist %>/views'
    //     }]
    //   }
    // },

    // build sprites
    glue: {
      images: {
        src:  '<%= config.app %>/root/static/images',
        options: '--css=.tmp/styles --img=.tmp/images --cachebuster --recursive'
      }
    },

    // Copies remaining files to places other tasks can use. The dist task
    // copies files from app to dist, adding the sprite image(s) generated by
    // glue explicitly
    copy: {
      dist: {
        options: {
          mode: true,
        },
        files: [
          {
            cwd: '<%= config.app %>',
            src: [
              'Changes',
              'Makefile.PL',
              'README',
              'lib/**/*',
              '{,*/}*.conf',
              'midas.psgi',
              'root/static/resources/**',
              'script/*',
              '!**/.*.sw?',
            ],
            dest: '<%= config.dist %>',
            expand: true,
            dot: true
          },
          // TODO really should rationalise all of these copy blocks
          {
            cwd: '<%= config.app %>/root/templates',
            src: '**/*.tt',
            dest: '<%= config.dist %>/root/templates',
            expand: true,
            dot: true
          },
          {
            cwd: '<%= config.app %>/root/static',
            src: [
              '*.png',
              'browserconfig.xml',
              'favicon.ico',
            ],
            dest: '<%= config.dist %>/root/static',
            expand: true,
            dot: true
          },
          {
            cwd: '<%= config.app %>/root/static/swf',
            src: '**/*',
            dest: '<%= config.dist %>/root/static/swf',
            expand: true,
            dot: true
          },
          {
            cwd: '.tmp/images',
            src: '**/*',
            dest: '<%= config.dist %>/root/static/images',
            expand: true,
            dot: true
          }
        ]
      },
      styles: {
        expand: true,
        dot: true,
        cwd: '<%= config.app %>/root/static/styles',
        src: '{,*/}*.css',
        dest: '.tmp/styles/'
      }
    },
              // 'public/*.{ico,png,txt}',

    // Compiles Sass to CSS and generates necessary files if requested
    sass: {
      dist: {
        files: [{
          expand: true,
          cwd: '<%= config.app %>/root/static/styles',
          src: ['{,*/}*.{scss,sass}'],
          dest: '.tmp/styles',
          ext: '.css'
        }]
      },
      server: {
        files: [{
          expand: true,
          cwd: '<%= config.app %>/root/static/styles',
          src: ['{,*/}*.{scss,sass}'],
          dest: '.tmp/styles',
          ext: '.css'
        }]
      }
    },

    // Add vendor prefixed styles
    autoprefixer: {
      options: {
        browsers: ['> 1%', 'last 2 versions', 'Firefox ESR', 'Opera 12.1']
      },
      dist: {
        files: [{
          expand: true,
          cwd: '.tmp/styles/',
          src: '{,*/}*.css',
          dest: '.tmp/styles/'
        }]
      }
    },

    nginx: {
      options: {
        config: 'test_server/nginx.conf',
        prefix: 'nginx'
      }
    },

    shell: {
      buildNginxConf: {
        command: 'sed "s:__CWD__:"`pwd`":" test_server/nginx.conf.template > test_server/nginx.conf',
        options: {
          execOptions: {
            cwd: '<%= config.app %>/..'
          }
        }
      },
      buildTestDB: {
        command: 'sqlite3 -batch testing.db < app/t/data/create_test_db.sql',
        options: {
          execOptions: {
            cwd: '<%= config.app %>/..'
          }
        }
      },
      backend: {
        command: function(option) {
          if ( option === 'start' ) {
            return '../../perl5/bin/starman --pid test_server/midas.pid --listen :8000 --daemonize --access-log test_server/midas_access.log --error-log test_server/midas_error.log app/midas.psgi';
          } else if ( option === 'stop' ) {
            return 'if [ -e test_server/midas.pid ]; then kill -TERM `cat test_server/midas.pid`; fi';
          } else if ( option === 'restart' ) {
            return 'kill -HUP `cat test_server/midas.pid`';
          }
        },
        options: {
          execOptions: {
            cwd: '<%= config.app %>/..',
            env: {
              PERL5LIB: '../../perl5/lib/perl5:../Bio-Metadata-Validator/lib:../Bio-HICF-Schema/lib:app/lib',
              CATALYST_CONFIG: '<%= config.app %>/midas.conf',
              CATALYST_CONFIG_LOCAL_SUFFIX: 'testing'
            }
          }
        }
      }

      // to run the backend under starman, listening on a socket
      // command: 'starman --pid test_server/midas.pid --listen :8000 --daemonize --access-log test_server/midas_access.log --error-log test_server/midas_error.log app/midas.psgi',

      // ideally we'd run the backend as a FastCGI process, listening on a socket, but
      // for some reason the script doesn't create a socket for nginx to listen to.
      // We should be running the production server under FastCGI though.
      // command: 'app/script/midas_fastcgi.pl --pidfile test_server/midas.pid --daemon --listen /Users/jt6/Work/HICF/modules/MIDAS/test_server/midas.socket'

      // dancer setup
      // command: 'starman --listen :8000 -E development --pid test_server/starman.pid --daemonize app/bin/app.pl'

    },

    // watch for changes to the static content, such as templates or images
    watch: {
      js: {
        files: ['<%= config.app %>/root/static/javascripts/{,*/}*.js'],
        tasks: ['jshint']
      },
      // jstest: {
      //   files: ['test/spec/{,*/}*.js'],
      //   tasks: ['test:watch']
      // },
      gruntfile: {
        files: ['Gruntfile.js']
      },
      sass: {
        files: ['<%= config.app %>/root/static/styles/{,*/}*.{scss,sass}'],
        tasks: [ 'sass:server', 'autoprefixer' ],
      },
      images: {
        files: [ '<%= config.app %>/root/static/images/**/*' ],
        tasks: [ 'glue' ]
      },
      // styles: {
      //   files: ['<%= config.app %>/public/styles/{,*/}*.css'],
      //   tasks: ['newer:copy:styles', 'autoprefixer']
      // },
      // templates: {
      //   files: [ '<%= config.app %>/views/**/*.tt' ],
      //   tasks: [ 'newer:copy:dist' ]
      // },
      livereload: {
        options: {
          livereload: 35729
        },
        files: [
          '<%= config.app %>/root/**/*.tt',
          '.tmp/styles/{,*/}*.css',
          '<%= config.app %>/root/static/javascripts/**/*',
          '<%= config.app %>/root/static/images/**/*'
        ]
      }
    },

    // watch for changes to the perl modules that generate dynamic content
    watchPerl: {
      perl: {
        files: [ '<%= config.app %>/lib/**/*.pm' ],
        tasks: [ 'shell:backend:restart' ],
      },
      livereload: {
        options: {
          livereload: 35729
        },
        files: [
          '<%= config.app %>/lib/**/*.pm'
        ]
      }
    },

    // Run some tasks in parallel to speed up build process
    concurrent: {
      startServers: {
        tasks: [
          'sass:server',
          'glue',
          'copy:styles',
          'shell:backend:start',
          'nginx:start'
        ],
        options: {
          limit: 8
        }
      },
      stopServers: [
        'shell:backend:stop',
        'nginx:stop'
      ],
      test: [
        'copy:styles'
      ],
      dist: {
        tasks: [
          'sass',
          'glue',
          'copy:styles',
          'imagemin'
          // 'svgmin'
        ],
        options: {
          limit: 4
        }
      }
    },

    // run tests using casper.
    // casper: {
    //   test: {
    //     src: [ 'test/*.js' ],
    //     options: {
    //       test: true,
    //       verbose: true,
    //       'fail-fast': true
    //     }
    //   }
    // }

  });

  // 1. create the test database with the default user credentials
  // 2. start the test server, pointing it at that test DB
  // 3. wait for the server to start
  // 4. run javascript tests that update user login credentials
  // 5. stop test server
  // 6. delete test DB

  // grunt.registerTask('testLogin', function() {
  //   grunt.task.run('shell:buildTestDB');
  //   grunt.task.run('shell:backend:start');
  //
  //   grunt.task.run('shell:backend:stop');
  //   grunt.file.delete('testing.db');
  // });

  // starts the perl backend (fastcgi script) and the nginx frontend
  grunt.registerTask('startServers', function() {

    // avoid an error if the servers are already running
    if ( grunt.file.exists('test_server/nginx.pid') ||
         grunt.file.exists('test_server/midas.pid') ) {
      grunt.log.warn( 'WARNING: servers are still running; stopping them before trying to start' );
      grunt.task.run('concurrent:stopServers');
    }
    grunt.task.run(
      'shell:buildNginxConf',
      'concurrent:startServers'
    );
  });

  // stops the backend and nginx
  grunt.registerTask('stopServers', [
    'concurrent:stopServers'
  ]);

  // starts the preview server and watches for changes to source files
  grunt.registerTask('serve', function() {
    grunt.log.subhead('preview the site at http://128.0.0.1:8001');
    grunt.task.run([
      'clean:server',
      'startServers',
      'watch'
    ]);
  });

  // grunt.registerTask('test', function (target) {
  //   if (target !== 'watch') {
  //     grunt.task.run([
  //       'clean:server',
  //       'concurrent:test',
  //       'autoprefixer'
  //     ]);
  //   }
  //
  //   grunt.task.run([
  //     'connect:test',
  //     'mocha'
  //   ]);
  // });

  // builds the distribution
  grunt.registerTask('build', [
    'clean:dist',
    'jshint',
    'sass:dist',
    'glue',
    'useminPrepare',
    'concurrent:dist',
    'autoprefixer',
    'concat:generated',
    'cssmin:generated',
    'uglify:generated',
    'copy:dist',
    'filerev',
    'usemin',
  ]);
  // this breaks with certain TT idioms
    // 'htmlmin'

  // alias the "build" task
  grunt.registerTask('dist', ['build']);

  // set the default task
  grunt.registerTask('default', [
    'newer:jshint',
    // 'test',
    'build'
  ]);
};
