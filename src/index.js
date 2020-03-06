#!/usr/local/bin/node
const vm = require('vm');
const fs = require('fs');
const os = require('os');
const path = require('path');

const Repl = require('./core/repl');
const exec = require('./core/exec');
const config = require('./core/config');
const context = require('./core/context');

const sandbox = vm.createContext(context);

process.on('unhandledRejection', (e) => { throw e });
process.on('uncaughtException', console.log);
process.on('SIGINT', () => {});

try {
    vm.runInContext(fs.readFileSync(path.join(os.homedir(), '.freshrc.js')).toString(), context);
} catch (e) { }

const repl = new Repl({
    hardPrompt: config.prompt,
    softPrompt: 'ƒ`',
    transformer: (text) => {
        if (/ƒ`([^`]|\\[.])+$/.test(text)) {
            text += '`';
        }
        text = text.replace(/\\ /g, '\\\\ ');
        return text;
    },
    formatter: config.colorizeCommand,
    executor: (cmd) => {
        const isInteractive = /^ƒ`([^`]|\\[.])+`$/.test(cmd);
        sandbox.ƒ = exec.bind(null, isInteractive);
        try {
            let result = vm.runInContext(cmd, sandbox);
            if (isInteractive) {
                repl.hardPrompt = config.prompt.bind(null, result.status);
            } else {
                console.log('>', config.colorizeOutput(result));
            }
        } catch (e) {
            console.error(e);
        }
        process.stdout.write('\n');
    }
}, {
    removeHistoryDuplicates: true,
    completer: config.complete
});