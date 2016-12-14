#!/usr/local/bin/node

'use strict';

/**
 * DOTFILE BACKUP SCRIPT
 *
 * Dependencies
 * ----------------------------------------------
 * node
 * openssl
 * rsync
 *
 * Libraries of Interest
 * -----------------------------------------------
 *  https://github.com/vndmtrx/awesome-nodejs
 */

const fs = require('fs');
const path = require('path');
const sys = require('util');
const exec = require('child_process').exec;
const execSync = require('child_process').execSync;
const gutil = require('gulp-util');
const inquirer = require('inquirer');
const del = require('del');

let child;

const HOME = process.env.HOME,
  XDG_CONFIG_DIR = path.join(HOME, '.config/'),
  OUTPUT_DIR = path.join(process.cwd(), 'phew/'),
  ARCHIVE_EXT = '.aes256.tar.gz';

console.log(
  HOME,
  XDG_CONFIG_DIR,
  OUTPUT_DIR
);

var files = {
  // CONFIGS
  configs: {
    items: [
      {
        dir: '.fonts',
        excludes: []
      },
      {
        dir: '.iterm',
        excludes: []
      },
      {
        dir: '.kwm',
        excludes: []
      },
      {
        dir: '.tern-config'
      },
      {
        dir: '.mpd',
        excludes: []
      },
      {
        dir: '.ncmpcpp',
        excludes: []
      },
      {
        dir: '.oh-my-zsh',
        excludes: ['.git']
      },
      {
        dir: '.terminfo',
        excludes: ['.git']
      },
      {
        dir: '.tmux',
        excludes: ['.git']
      },
      {
        dir: '.tmux.conf',
        excludes: ['.git']
      },
      {
        dir: '.vim',
        excludes: ['.git', 'bundle', 'tmp']
      },
      {
        dir: '.vimrc',
        excludes: []
      },
      {
        dir: '.weechat',
        excludes: ['.git', 'certs']
      },
      {
        dir: '.zsh',
        excludes: ['.git']
      },
      {
        dir: 'iterm',
        excludes: []
      },
      {
        dir: '.agignore',
        excludes: []
      },
      {
        dir: '.aliases',
        excludes: ['.git']
      },
      {
        dir: '.bashrc',
        excludes: []
      },
      {
        dir: '.ctags',
        excludes: []
      },
      {
        dir: '.functions',
        excludes: []
      },
      {
        dir: '.gitconfig',
        excludes: []
      },
      {
        dir: '.mailcap',
        excludes: []
      },
      {
        dir: '.multitailrc',
        excludes: []
      },
      {
        dir: '.zshrc',
        excludes: []
      },
      {
        dir: '.config/cmus',
        excludes: ['cache', 'lib.pl', 'playlist.pl', 'search-history']
      },
      {
        dir: '.config/configstore'
      },
      {
        dir: '.config/mps',
        excludes: ['cache*', 'input_history']
      },
      {
        dir: '.config/nvim',
        excludes: ['git', 'plugged']
      },
      {
        dir: '.config/powerline'
      },
      {
        dir: '.config/ranger',
        excludes: ['history']
      },
      {
        dir: '.config/rtv',
        excludes: ['history']
      }
    ]
  },

  // ENCRYPTED CONFIGS
  encrypt: [
    {
      input: XDG_CONFIG_DIR + 'filezilla/',
      output: OUTPUT_DIR + '.config/filezilla'
    },
    {
      input: HOME + '/.weechat',
      output: OUTPUT_DIR + '.weechat'
    }
  ]
};

interactivePrompt();

/**
 * Interactive Prompt
 */
function interactivePrompt() {
  inquirer.prompt([
    {
      type: 'checkbox',
      message: 'What do you want to do?',
      name: 'actions',
      choices: [
        {
          name: 'Backup dotfiles',
          value: 'backup_dotfiles'
        },
        {
          name: 'Encrypt',
          value: 'encrypt_files'
        }
      ],
      validate: function (answer) {
        if (answer.length < 1) {
          return 'Choose an action or quit with CTRL+C';
        }
        return true;
      }
    }
  ]).then(function (answers) {
    // console.log(JSON.stringify(answers, null, '  '));
    console.log(answers);

    if (answers.actions) {
      for (var i = 0; i < answers.actions.length; i++) {
        var action = answers.actions[i];

        if (action === 'clean_output_dir') {

        }
        if (action === 'backup_dotfiles') {
          runRsyncTasks(files.configs.items);
        }
        if (action == 'encrypt_files') {
          runEncryptionTasks(files.encrypt);
        }
      }
    }
  });
}

// runDecryptionTasks( files.encrypt )

/**
 * Run Shell Command
 * Run a string as a shell command (limited, does not work with input prompts atm)
 * @param {String} cmd
 */
function runShellCommand(cmd, cb) {
  gutil.log(gutil.colors.underline.yellow('exec'), gutil.colors.white.dim(cmd));

  child = exec(cmd, function (error, stdout, stderr) {
    // console.log( '\n' + stdout )

    if (stderr) {
      console.log('stderr: ' + stderr);
    }

    if (error !== null) {
      console.log('exec error: ' + error);
    }

    if (cb) {
      cb();
    }
  });
  child.on('exit', function () {

  });
}

function runSyncShellCommand(cmd, options, cb) {
  options = options || {};

  gutil.log(gutil.colors.underline.yellow('execSync'), gutil.colors.white.dim(cmd));
  return execSync(cmd, options);
}

//
// #<{(|*
//  * Run rsync tasks
//  * @param {Array} tasks
//  * @param {String} base_dir
//  * @param {String} output_dir
//  * @return null
//  |)}>#
// function runRsyncTasks(group) {
//   for ( var i=0; i<group.items.length; i++) {
//     var cmd = buildRsyncCmd(group.items[i], group.base_dir, group.output_dir)
//     runShellCommand(cmd)
//   }
// }
//

/**
 * @param {Array} tasks
 * @param {String} base_dir
 * @param {String} output_dir
 * @return null
 */
function runRsyncTasks(items) {
  for (var i = 0; i < items.length; i++) {
    var cmd = buildRsyncCmd(items[i]);

    // runSyncShellCommand(cmd)
    runShellCommand(cmd);
  }
}

/**
 * Build rsync command
 * @param {Object} options
 * @return {String} cmd
 */
function buildRsyncCmd(item) {
  if (item.length) {
    return;
  }

  var cmd = '';

  cmd += 'rsync -av ';

  // Check if dir to backup is at base or in XDG
  if (item.dir.split('/').length > 1) {
    cmd += path.join(HOME, item.dir) + ' ' + OUTPUT_DIR + item.dir.split('/')[0];
  } else {
    cmd += path.join(HOME, item.dir) + ' ' + OUTPUT_DIR;
  }

  if (item.excludes) {
    for (var k = 0; k < item.excludes.length; k++) {
      cmd += ' --exclude="' + item.excludes[k] + '"';
    }
  }

  return cmd;
}

/**
 * Run Encryption Tasks
 * @param {Array} items
 */
function runEncryptionTasks(items) {
  for (var i = 0; i < items.length; i++) {
    encryptArchive({
      input_dir: items[i].input,
      output_dir: items[i].output
    });
  }
}

/**
 * Encrypt Archive
 * @param {String} input
 * @param {String} output
 */
function encryptArchive(options) {
  options = options || {};

  var input_dir = options.input_dir,
    output_dir = options.output_dir;

  var filename = output_dir.split('/').pop();

  // console.log(input_dir, output_dir, path.join(__dirname, output_dir))

  runSyncShellCommand('mkdir -p ' + output_dir);
  runSyncShellCommand('cd ' + input_dir + ' && tar -czf - * | openssl enc -e -aes256 -out ' + output_dir + '/' + filename + '.tar.gz && cd ' + __dirname);
}

/**
 * Run Decryption Tasks
 * @param {Array}
 */
function runDecryptionTasks(items) {
  for (var i = 0; i < items.length; i++) {
    var dir_path = items[i].output,
      file_name = dir_path.split('/').pop(),
      file_path = path.join(dir_path, file_name) + '.tar.gz';

    decryptArchive(file_path, dir_path);
  }
}

/**
 * Decrypt Archive
 * @param {String} input
 */
function decryptArchive(in_path, out_path) {
  runSyncShellCommand(String('openssl enc -d -aes256 -in ' + in_path + ' | tar xz -C ' + out_path));
}

function Debug() {

}
