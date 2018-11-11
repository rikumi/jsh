const util = require('util')
const path = require('path')
const chalk = require('chalk')
const git = require('git-state')
const moment = require('moment')
const tokens = require('js-tokens')
const stringArgv = require('string-argv')
const pathComplete = require('lib-pathcomplete')
const expandHomeDir = require('expand-home-dir')

const config = {
  env: [
    require('./shell'),
    require('./exec'),
    require
  ],
  git() {
    let cwd = process.cwd()
    if (!git.isGitSync(cwd)) return ''
    let { branch, ahead, dirty, untracked } = git.checkSync(cwd)
    let str = ' ' + branch
    if (untracked) str += '*'
    if (dirty) str += '+'
    if (ahead > 0) str += '↑'
    if (ahead < 0) str += '↓'
    return str
  },
  cwd() {
    return path.basename(process.cwd())
  },
  prompt() {
    return chalk.blue('\n' + config.cwd() + chalk.gray(config.git()) + ' ❯ ')
  },
  complete(line, callback) {
    let last = expandHomeDir(/\s$/.test(line) ? '' : (stringArgv(line).slice(-1)[0] || ''))
    pathComplete(last, (err, data) => {
      callback(err, [data, path.basename(last)])
    })
  },
  colorizeToken(token) {
    return {
      string:     chalk.green,
      comment:    chalk.gray,
      regex:      chalk.cyan,
      number:     chalk.yellow,
      name:       chalk.reset,
      punctuator: chalk.gray,
      whitespace: chalk.reset,
      invalid:    chalk.red,
    }[token.type](token.value)
  },
  colorizeCode(code) {
    if (!code) return ''
    let result = ''
    let match = tokens.default.exec(code)
    while (match) {
      let token = tokens.matchToToken(match)
      result += config.colorizeToken(token)
      match = tokens.default.exec(code)
    }
    return result
  },
  colorizeCommand(command) {
    return config.colorizeCode(command.trim()) + chalk.gray(' - ' + moment().format('H:mm:ss'))
  },
  colorizeOutput(output) {
    return config.colorizeCode(util.inspect(output))
  }
}

module.exports = config