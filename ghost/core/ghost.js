/**
 * Internal CLI Placeholder
 *
 * If we want to add alternative commands, flags, or modify environment vars, it should all go here.
 * Important: This file should not contain any requires, unless we decide to add pretty-cli/commander type tools
 *
 **/

// Don't allow NODE_ENV to be null
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const argv = process.argv;
let mode = argv[2];

if (process.env.GHOST_NO_FRONTEND) {
    mode = 'no-frontend';
}

if (process.env.GHOST_NEW_FRONTEND) {
    mode = 'new-frontend';
}

if (process.env.GHOST_NEW_ROUTER) {
    mode = 'new-router';
}

const command = require('./core/cli/command');

// Switch between boot modes
switch (mode) {
case 'repl':
case 'timetravel':
case 'generate-data':
case 'record-test':
    command.run(mode);
    break;
case 'no-frontend':
    // Boot sequence without frontend
    require('./core/boot')({frontend: false});
    break;
case 'new-frontend':
    // Boot sequence with new frontend
    require('./core/boot')({frontend: false, newFrontend: true});
    break;
case 'new-router':
    // Boot sequence with new router
    require('./core/boot')({frontend: true, newRouter: true});
    break;

default:
    // Standard boot sequence
    require('./core/boot')();
}
