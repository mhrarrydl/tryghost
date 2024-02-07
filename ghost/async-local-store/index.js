const {AsyncLocalStorage} = require('async_hooks');

const asyncLocalStore = new AsyncLocalStorage();

module.exports = asyncLocalStore;
