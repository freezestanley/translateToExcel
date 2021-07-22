const fs = require('fs-extra')
const Path = require('path')
var cheerio = require('cheerio')
const Https = require("https");
const Http = require("http")
const Url = require("url");
const Chalk = require("chalk");
const Figures = require("figures");
const Ora = require("ora");
const { ByteSize, RandomNum, RoundNum } = require("trample/node");
const { mkdir, deleteall, readfile, writeFile, getFolderImg, DownloadHtmlImg, merge, getImages} =  require('./utils/fs')
const { CompressImg, CompressImgs } = require('./utils/compress')
const { getSlicesBlock } = require('./utils/img')
const urlencode = require('urlencode');
const { createCanvas, loadImage } = require('canvas')

const spinner = Ora("Analysis folder html file ...").start();
global.spinner = spinner

const log4js = require("log4js");
log4js.configure({
  appenders: { cheese: { type: "file", filename: "logs/cheese.log" } },
  categories: { default: { appenders: ["cheese"], level: "error" } }
});
const logger = log4js.getLogger("cheese");
global.logger = logger

process.on('uncaughtException', function (err) {
  logger.error(err)
});

function splitImages(arr) {
  if (arr.length >= 300) {
    const length = Math.floor(arr.length / 6)
    for (var i = 0; i < 6; i++) {
      let arr_point = arr.splice(0, length)
      writeFile(Path.join(__dirname, `./collect/slice/slice_${i}.js`), JSON.stringify(arr_point))
    }
    writeFile(Path.join(__dirname, `./collect/slice/slice.js`), JSON.stringify(arr))
  } else {
    writeFile(Path.join(__dirname, `./collect/slice/slice.js`), JSON.stringify(arr))
  }
}

async function compress(target) {
  let aa = getImages(target)
  splitImages(aa)
}
async function cmpImg (recode, zip, origin, fun){
  let aafdf = await CompressImgs(recode, zip, origin, fun)
}

// compress('/Users/stanleyxu/Desktop/big5m/aaa')
let current = require('./collect/slice/slice').default
// cmpImg(
//   current,
//   '/Users/stanleyxu/Desktop/big5m/zip',
//   '/Users/stanleyxu/Desktop/big5m/aaa',
//   (obj) => {
//   }
// )
const sizeOf = require('image-size')
async function sliceToZip(entry, output) {
  let slice_result = []
  let imagesRecord = getImages(entry)
  imagesRecord.map(async (ele, idx, arr) => {
    console.log('==================')
    console.log(ele)
    const dimensions = sizeOf(ele)
    console.log(dimensions.width, dimensions.height)
    if ((dimensions.height / dimensions.width) > 3 || (dimensions.width === 790)) {
      let relative = Path.relative(entry, ele)
      let result = await getSlicesBlock(ele, Path.join(output,relative), { width: '100%', height: 600 }, 'v')
      if (!result) {
        mkdir(Path.join(output, '../Error', relative))
        logger.error(`slice fail: ${relative}`);
        fs.copySync(ele, Path.join(output, '../Error', relative))
      } else {
        let new_slice = result.slices.map((ele) => {
          return Path.relative(Path.join(output, '../'), ele)
        })
        slice_result.push({
          origin: ele,
          path: Path.join( Path.relative(Path.join(output, '../'),output), relative),
          children: [...new_slice]
        })
        writeFile(Path.join(output, `../collect/slice.js`), JSON.stringify(slice_result))
      }
      
    }
  })


}
sliceToZip(
  '/Users/stanleyxu/Desktop/big5m/sliceToZip/_supplier', // entry 
  '/Users/stanleyxu/Desktop/big5m/sliceToZip/supplier'   // output
)

process.on('SIGHUP', () => {
  console.log('收到 SIGHUP 信号');
});

setTimeout(() => {
  console.log('退出中');
  process.exit(0);
}, 100);

process.kill(process.pid, 'SIGHUP');