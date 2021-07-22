const fs = require('fs')
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
const spinner = Ora("Analysis folder html file ...").start();
global.spinner = spinner

const log4js = require("log4js");
log4js.configure({
  appenders: { cheese: { type: "file", filename: "logs/cheese.log" } },
  categories: { default: { appenders: ["cheese"], level: "error" } }
});
const logger = log4js.getLogger("cheese");
const {
  isMainThread, parentPort, workerData, threadId,
  MessageChannel, MessagePort, Worker
} = require('worker_threads');

// var imgrecode = require('./recode/imgRecode')


var picture = '/Users/stanleyxu/Desktop/talk/吞吞吐吐/OSS文件/kangman-public-prd/product/goods/SP20200927000001/content/详情页宣传内容/'
var picture_folder = '/Users/stanleyxu/Desktop/talk/吞吞吐吐/切图/images/'
var html_path = '/Users/stanleyxu/Desktop/talk/吞吞吐吐/OSS文件/kangman-public-prd'
// html_path = '/Users/stanleyxu/Desktop/talk/吞吞吐吐/tool/example/'

async function doit() {
  // 得到文件夹下的图片信息
  spinner.info('获取文件夹下html记录...')
  let folder = getFolderImg(html_path)
  spinner.succeed('获取文件夹下html记录...done!')
  writeFile(Path.join(__dirname, './collect/index.js'), JSON.stringify(folder))
  spinner.succeed(`html记录${Path.join(__dirname, './collect/index.js')}写入成功...success`)

  let imgRecode = []
  folder.map((em, idx) => {
    imgRecode = imgRecode.concat(em.src)
  })
  spinner.info('开始下载HTML内收集的所有图片...')
  let download_recode = await DownloadHtmlImg(imgRecode, './dist/download')
  writeFile(Path.join(__dirname, './collect/download_recode.js'), JSON.stringify(download_recode))
  
  spinner.succeed(`所有图片下载成功...`)
  spinner.info('开始对图片切片...')
  
  let download_slice = download_recode.map((ele) => {
    var url = new Url.URL(ele.from)
    return getSlicesBlock(ele.to, Path.join('./dist/slices', urlencode.decode(url.pathname)), { width: '100%', height: 600 }, 'v')
  })
  let slice_recode = await Promise.all(download_slice)
  spinner.succeed(`所有图片切片成功...`)
  spinner.stop()
  let info = merge(download_recode, slice_recode, folder, 'https://kangman-public-prd.oss-cn-shanghai.aliyuncs.com')
  writeFile(Path.join(__dirname, './collect/slice.js'), JSON.stringify(info))
}

// doit()
async function compress() {
  let aa = getImages('dist/slices')
  let aafdf = await CompressImgs(aa1, './dist/zip')
}
// compress()

var collect = require('./collect/download_recode')
var folder = require('./collect')

async function slice() {
  spinner.info('开始对图片切片...')
  let download_slice = collect.result.map((ele) => {
    var url = new Url.URL(ele.from)
    if (ele.to) {
      let result = getSlicesBlock(ele.to, Path.join('./dist/slices', urlencode.decode(url.pathname)), { width: '100%', height: 600 }, 'v')
      if (result) {
        return result
      }
    }
  })
  let slice_recode = await Promise.all(download_slice)
  writeFile(Path.join(__dirname, './collect/slice1.js'), JSON.stringify(slice_recode))
  spinner.succeed(`所有图片切片成功...`)
  let info = merge(collect.result, slice_recode, folder.result, 'https://kangman-public-prd.oss-cn-shanghai.aliyuncs.com')
  writeFile(Path.join(__dirname, './collect/slice.js'), JSON.stringify(info))
}

// slice()

// var replace = require('./collect/slice').result
function replaceHtml(ar, folder, split) {
  ar.map((ele) => {
    let file_content = fs.readFileSync(ele.path, 'utf-8')
    let $ = cheerio.load(file_content, {decodeEntities: false})
    let imgs = $('img')
    imgs.each((idx, img) => {
      let src = img.attribs.src
      let target = ele.child.find((elm) => {
        return elm.from === src
      })
      let slicstr = ''
      target.replace.map((e) => {
        slicstr += `<img src="${e}" style="margin:0 auto;padding:0;display:block;"/>`
      })
      $(img).replaceWith(slicstr)
      console.log(Path.join(process.cwd(), folder, Path.dirname(urlencode.decode(ele.path.split(split)[1])), Path.basename(ele.path)))
      writeFile(Path.join(process.cwd(), folder, Path.dirname(urlencode.decode(ele.path.split(split)[1])), Path.basename(ele.path)), $('body').html().toString(), 'utf8');
    })
  })
}
replaceHtml(replace, './dist/html', 'kangman-public-prd')


process.on('uncaughtException', function (err) {
  logger.error(err)
});