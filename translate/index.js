const fs = require('fs');
const { program } = require('commander');
const shell = require('shelljs');
const _ = require('lodash');

program
  .name('translate')
  .description('Translate files using google translate API')
  .version('0.0.1')
  .option('-d, --directory <string>')
  .option('-f, --file <string>')
  .option('-e, --extensions', 'Only translate files of these extensions', 'js|jsx|css|less|sass|html|txt|vue|ts|tsx');

program.parse();

const options = program.opts();
const { file, directory, extensions } = options;

const extRegexp = new RegExp((`(.${extensions})$`).split('|').join('|.'), 'i');

function translateFile(fileName) {
  if (!extRegexp.test(fileName)) {
    return;
  }

  const content = fs.readFileSync(fileName).toString();

  const translatedContent = content.replace(/[\u4e00-\u9fa5 ]+/g, (zhStr) => {
    if (!/[\u4e00-\u9fa5]+/g.test(zhStr)) {
      return zhStr;
    }

    let trimedZhStr = zhStr.replace(/ /g, '');

    let spaces = zhStr.split(/[\u4e00-\u9fa5]+/g);
    let leadingSpace = '';
    let tailSpace = '';
    if (spaces.length > 0) {
      leadingSpace = spaces[0];
      tailSpace = spaces.length > 1 ? spaces[spaces.length - 1] : '';
    }

    console.info(`#### translate: "${zhStr}". after trim: "${trimedZhStr}"`);

    const res = shell.exec(`../translate-shell/build/trans zh:en "${trimedZhStr}" -b`);
    if (res.code !== 0) {
      return zhStr;
    }

    let enStr = (res.stdout || '').trim();
    if (enStr.length > 0) {
      enStr = enStr.length <= 24 ? _.startCase(enStr) : _.upperFirst(enStr);
      enStr = leadingSpace + enStr + tailSpace;
      console.info(`: "${zhStr}" => "${enStr}" (in ...${fileName.substr(-30)})\n`);
      return enStr;
    }

    return zhStr;
  });

  fs.writeFileSync(fileName, translatedContent);
}

(function main() {
  if (file) {
    translateFile(file);
    return;
  }

  if (directory) {
    const res = shell.exec(`find ${directory} -type f`);
    if (res.code !== 0) {
      return;
    }

    shell.exec('sleep 2; clear;');

    (res.stdout || '').split('\n').forEach((file) => {
      if (!extRegexp.test(file)) {
        return;
      }
      console.info(`Translating ${file}`);
      translateFile(file);
    });

    return;
  }
})();
