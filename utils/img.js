const { createCanvas, loadImage } = require('canvas')
const Path = require('path')
const { mkdir, deleteall, readfile, writeFile, getFolderImg, DownloadHtmlImg } = require('./fs')
const Ora = require("ora");

function getSlice(rect, slice, type = 'v') { // h横 v竖
  let result = []
  let swidth = slice.width === '100%' ? rect.width : slice.width
  let sheight = slice.height === '100%' ? rect.height : slice.height
  let current = type === 'h' ? rect.width : rect.height
  let sle = type === 'h' ? swidth : sheight
  let num = Math.floor(current / sle)
  let remainder = current % sle

  if (num <= 0) {
    result.push({
      x: 0,
      y: 0,
      w: rect.width,
      h: rect.height
    })
  } else {
    for (var i = 0; i < num; i++) {
      result.push({
        x: (type === 'h') ? i === 0 ? i * swidth : i * swidth : 0,
        y: (type === 'h') ? 0 : i === 0 ? i * sheight : i * sheight,
        w: swidth,
        h: sheight
      })
    }
  
    if (remainder <= 200) {
      try {
        (type === 'h') ? result[result.length - 1].w += remainder : result[result.length - 1].h += remainder
      } catch (e) {
        // console.log('=================')
        // console.log(rect)
        // console.log(slice)
        // console.log(result)
        // console.log(remainder)
        // console.log(result[result.length - 1])
      }
    
    } else {
      result.push({
        x: (type === 'h') ? i * slice.width : 0,
        y: (type === 'h') ? 0 : i * slice.height,
        w: (type === 'h') ? remainder : swidth,
        h: (type === 'h') ? sheight : remainder
      })
    }
  }
  // console.log(result)
  return result
}

function writeImage(drawimg, path) {
  return new Promise((resolve, reject) => {
    const canvas = createCanvas(drawimg.w, drawimg.h)
    const ctx = canvas.getContext('2d')
    ctx.drawImage(drawimg.img, drawimg.x, drawimg.y, drawimg.w, drawimg.h, 0, 0, drawimg.w, drawimg.h)
    // ctx.drawImage(drawimg.img, drawimg.x, drawimg.y, drawimg.w, drawimg.h, drawimg.dx, drawimg.dy, drawimg.dwitch, drawimg.dheight)
    const fs = require('fs')
    const out = fs.createWriteStream(path)
    const stream = canvas.createJPEGStream()
    stream.pipe(out)
    out.on('finish', function () {
      resolve(path)
    })
  })
}


// var ss = getSlicesBlock('./src/pig.png', './slice/pig.jpg', { width: 100, height: '100%' }, 'h')
async function getSlicesBlock(path, output, slice, type = 'v', host) {
  if (!path) return
    spinner.info(`${path} sliceing...`)
  let myimg = null
  try {
    myimg = await loadImage(path)
  } catch (e) {
    return console.error(`error: ${path}`)
  }
    
    let slices = getSlice(myimg, { width: slice.width, height: slice.height }, type)
    
    let dirname = Path.dirname(output)
    let ext = Path.extname(output)
    let basename = Path.basename(output).replace(ext, '')
    let imgSliceInfo = {
      file:Path.basename(output),
      path,
      output,
      slice,
      type,
      slices: [],
      replace: []
    }

    mkdir(Path.join(process.cwd(), dirname))
    slices.map(async (e, idx) => {
      let tempPath = Path.join(process.cwd(), dirname, basename + `_${idx++}` + ext)
      
      imgSliceInfo.slices.push(tempPath)
      let wi_path = await writeImage({
        img: myimg,
        x: e.x,
        y: e.y,
        w: e.w,
        h: e.h,
        dx: 0,
        dy: 0,
        dwidth: e.w,
        dheight: e.h
      },
      tempPath
      )
    })
      return imgSliceInfo

}

exports.getSlicesBlock = getSlicesBlock