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
    console.info("ignoring unsupported file type for :", fileName);
    return;
  }

  console.info(`============================================> start translating for file:`);
  console.info('    ', fileName);

  const content = fs.readFileSync(fileName).toString();

  const translatedContent = content.replace(/[\u4e00-\u9fa5]+/g, (zhStr) => {
    console.info(`Translate ${zhStr}:`);
    const res = shell.exec(`../translate-shell/build/trans zh:en "${zhStr}" -b`);
    if (res.code !== 0) {
      shell.echo(`${fileName}: Translate failed`);
    }

    let enStr = (res.stdout || '').trim();
    if (enStr.length > 0) {
      return enStr.length <= 24 ? _.startCase(enStr) : _.upperFirst(enStr);
    }

    console.error(`error for ${zhStr}, ignoring`);
    return zhStr;
  });

  fs.writeFileSync(fileName, translatedContent);
}

(function main() {
  if (file) {
    translateFile(file);
  }
})();
