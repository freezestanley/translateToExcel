
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
const urlencode = require('urlencode');

const {
  isMainThread, parentPort, workerData, threadId,
  MessageChannel, MessagePort, Worker
} = require('worker_threads');
const { resolve } = require('path');

// 删除文件夹以及文件
function deleteall(path) {
  var files = [];
  if(fs.existsSync(path)) {
    files = fs.readdirSync(path);
    files.forEach(function(file, index) {
      var curPath = path + "/" + file;
      if(fs.statSync(curPath).isDirectory()) { // recurse
        deleteall(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};

exports.deleteall = deleteall

function readfile(path) {
  var folder = []
  if (fs.existsSync(path)) {
    // console.log(path)
    files = fs.readdirSync(path);
    files.forEach((file, index) => {
      if(file === '.DS_Store') return
      folder.push({ name: Path.basename(file).replace(Path.extname(file), ''), ext: Path.extname(file) })      
    })
    // console.log(folder)
    return folder

  } else {
    console.error(`error: ${path} 文件夹不存在`)
  }
}
exports.readfile = readfile

function mkdir(url) {
  url = Path.isAbsolute(url) ? url : Path.join(process.cwd(), url)
  let param = Path.extname(url) ? Path.dirname(url) : url
  let isWin = process.platform === 'win32'
  let pathArray =[]
  let pathLink = ''
  
  if (isWin){
    pathArray = param.split('\\')
    pathLink = pathArray[0]
    pathArray.splice(0,1)
    pathArray.map(function (ele, arr, idx) {
      if (!fs.existsSync(Path.join(pathLink, '\\' + ele))) {
        fs.mkdirSync(Path.join(pathLink, '\\' + ele))
      }
      pathLink += '\\'+ ele
    })
  
  } else {
    pathArray = param.split('/')
    pathArray.splice(0,1)
    pathArray.map(function (ele, arr, idx) {
      let dirpath = Path.join(pathLink, '/' + ele)
      // console.log(dirpath)
      if (!fs.existsSync(dirpath)) {
        fs.mkdirSync(dirpath)
      }
      pathLink += '/'+ ele
    })
  }
}
exports.mkdir = mkdir


function writeFile(filename, data, options) {
  mkdir(urlencode.decode(filename))
  fs.writeFileSync(urlencode.decode(filename), data, options);
}

exports.writeFile = writeFile

function getFolderImg(path) { // 获取文件夹内html文件图片
  var folder = []
  if (fs.existsSync(path)) {
    files = fs.readdirSync(path,{
      withFileTypes: true,
    });
    for (const dirent of files) {
      if (dirent.name === '.DS_Store') continue 
      if (dirent.isDirectory()) {
        let newArray = getFolderImg(Path.join(path, dirent.name))
        if (newArray) {
          folder = folder.concat(newArray)
        }
      } else {
        if (Path.extname(dirent.name) === '.html') {
          let file_content = fs.readFileSync(Path.join(path, dirent.name), 'utf-8')
          let $ = cheerio.load(file_content, {
            decodeEntities: false
          })
          let imgs = $('img')
          if (imgs.length <= 0) return
          let current = {
            path: Path.join(path, dirent.name),
            src: [],
            file: dirent.name,
            child: []
          }
          imgs.each((index, img) => {
            current.src.push(img.attribs.src)
          })
          folder.push(current)
        } else {
          continue
        }
      }
    }
    return folder
    // mkdir(Path.join(__dirname, './collect/index.js'))
    // fs.writeFileSync(Path.join(__dirname, './collect/index.js'), JSON.stringify(folder));
  } else {
    console.error(`error: ${path} 文件夹不存在`)
  }
}
exports.getFolderImg = getFolderImg

// 根据图片数组进行图片下载
async function DownloadHtmlImg(recode, downloaddir) { 
  let total = recode.length
  let current = 0
  let downloaded = []
  // 下载图片
  let k = 0
  function DownloadImg(url) {
    let re = {
      from: url,
      to: ''
    }
    const opts = new Url.URL(url);
    return new Promise((resolve, reject) => {
      let pro = opts.protocol === 'http:' ? Http : Https
      const req = pro.request(opts, res => {
        let file = "";
        res.setEncoding("binary");
        res.on("data", chunk => file += chunk);
        res.on("end", () => {
          k += 1
          
          let wfpath = Path.join(process.cwd(), downloaddir, urlencode.decode(opts.pathname))
          re.to = wfpath
          writeFile(wfpath, file, "binary")
          spinner.info(`${urlencode.decode(Path.basename(url))}  process = ${k}/${total} ${Math.round((k / total) * 100)}%`)
          return resolve(re)
        });
      });
      req.on("error", e => {
        console.error('error: ' + e)
        return reject(e)
      });
      req.end();
    });
  }

  let ele_result = []
  function getEle(ar) {
    return new Promise((resolve, reject) => {
      async function single_task(ar) {
        let task_link = ar.shift()
        let result = await DownloadImg(task_link)
        ele_result.push(result)
        if (ar.length <= 0) {
          resolve(ele_result)
        } else {
          return single_task(ar)
        }
      }
      let single_task_ele = single_task(ar)
      return single_task_ele
    })
  }

  return await getEle(recode)
}

exports.DownloadHtmlImg = DownloadHtmlImg

function jsonMerge(download, slice, collect, host) {
  let slice_group = slice.map((ele, idx, arr) => {
      let target = ele.path
      let dtarget = download.find((element, ix) => {
        return target === element.to
      })
      ele.from = dtarget.from
      ele.replace = ele.slices.map((point) => {
        let url = new Url.URL(ele.from)
        // console.log('replace:'+ host+Path.join(Path.dirname(urlencode.decode(url.pathname))))
        return host + Path.join(Path.dirname(urlencode.decode(url.pathname)), Path.basename(point))
      })
      return ele
  })
  collect.map((ele) => {
    ele.child = ele.child ? ele.child : []
    ele.src.map((element) => {
      let slice_point = slice_group.find((e) => {
        return element === e.from
      })
      ele.child.push(slice_point)
    })
  })
  return collect
}

exports.merge = jsonMerge

function getImages(path) {
  var folder = []
  if (fs.existsSync(path)) {
    files = fs.readdirSync(path,{
      withFileTypes: true,
    });
    for (const dirent of files) {
      if (dirent.name === '.DS_Store') continue 
      if (dirent.isDirectory()) {
        let newArray = getImages(Path.join(path, dirent.name))
        if (newArray) {
          folder = folder.concat(newArray)
        }
      } else {
        if (Path.extname(dirent.name) === '.jpg' ||
            Path.extname(dirent.name) === '.png' ||
            Path.extname(dirent.name) === '.jpeg')
        {
          folder.push(Path.join(path, dirent.name))
        }
      }
    }
    return folder
  } else {
    console.error(`error: ${path} 文件夹不存在`)
  }
}
exports.getImages = getImages