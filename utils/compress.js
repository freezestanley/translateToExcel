const Fs = require("fs");
const Https = require("https");
const Path = require("path");
const Url = require("url");
const Chalk = require("chalk");
const Figures = require("figures");
const { ByteSize, RandomNum, RoundNum } = require("trample/node");
const { mkdir, deleteall, readfile, writeFile, getFolderImg, DownloadHtmlImg, merge, getImages} =  require('./fs')

const TINYIMG_URL = [
	"tinyjpg.com",
	"tinypng.com"
];

function RandomHeader() {
	const ip = new Array(4).fill(0).map(() => parseInt(Math.random() * 255)).join(".");
	const index = RandomNum(0, 1);
	return {
		headers: {
			"Cache-Control": "no-cache",
			"Content-Type": "application/x-www-form-urlencoded",
			"Postman-Token": Date.now(),
			"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36",
			"X-Forwarded-For": ip
		},
		hostname: TINYIMG_URL[index],
		method: "POST",
		path: "/web/shrink",
		rejectUnauthorized: false
	};
}

function UploadImg(file) {
	const opts = RandomHeader();
	return new Promise((resolve, reject) => {
		const req = Https.request(opts, res => res.on("data", data => {
			const obj = JSON.parse(data.toString());
			obj.error ? reject(obj.message) : resolve(obj);
		}));
		req.write(file, "binary");
		req.on("error", e => reject(e));
		req.end();
	});
}

function DownloadImg(url) {
	const opts = new Url.URL(url);
	return new Promise((resolve, reject) => {
		const req = Https.request(opts, res => {
			let file = "";
			res.setEncoding("binary");
			res.on("data", chunk => file += chunk);
			res.on("end", () => resolve(file));
		});
		req.on("error", e => reject(e));
		req.end();
	});
}

async function CompressImg(link, path, arr, origin, fun) {
  const relative = Path.relative(origin, link)
	try {
    const file = Fs.readFileSync(link, "binary");
    let msg = ''
    if (file.length > 5000000) {
      let aa = Path.join(origin, '../_big5m', relative)
      mkdir(aa)
      Fs.writeFileSync(aa, file, "binary");
      msg = `${Figures.cross} Copy [${Chalk.yellowBright(link)}] to: ${Chalk.redBright(aa)}`;
      spinner.succeed(msg)
    } else {
      const obj = await UploadImg(file);
      const data = await DownloadImg(obj.output.url);
      const oldSize = Chalk.redBright(ByteSize(obj.input.size));
      const newSize = Chalk.greenBright(ByteSize(obj.output.size));
      const ratio = Chalk.blueBright(RoundNum(1 - obj.output.ratio, 2, true));
      const dpath = Path.join(path, relative)
      // const dpath = path ? Path.join(process.cwd(), path, link) : Path.join(process.cwd(), link);
      mkdir(dpath)
      msg = `${Figures.tick} Compressed [${Chalk.yellowBright(link)}] completed: Old Size ${oldSize}, New Size ${newSize}, Optimization Ratio ${ratio} progress ${arr.length}`;
      spinner.succeed(msg)
      Fs.writeFileSync(dpath, data, "binary");
      obj.output.url = dpath
      obj.relative = relative
      fun ? fun(obj) : null
    }
    writeFile(Path.join(__dirname, '../collect/current.js'), JSON.stringify(arr))
    return Promise.resolve(msg);
		
	} catch (err) {
    const msg = `${Figures.cross} Compressed [${Chalk.yellowBright(link)}] failed: ${Chalk.redBright(err)}`;
    logger.error(msg)
    spinner.fail(msg)
		return Promise.resolve(msg);
	}
}
exports.CompressImg = CompressImg

async function CompressImgs(arr, path, origin, fun, num = 0) {
  let ele_result = []
  function getEle(ar) {
    return new Promise((resolve, reject) => {
      async function single_task(ar) {
        if (num) {
          let task = ar.splice(0, num)
          task.map(async (ele) => {
            let result = await CompressImg(ele, path, arr, origin, fun)
            ele_result.push(result)
          })
        } else {
          let task_link = ar.shift()
          let result = await CompressImg(task_link, path, arr, origin, fun)
          ele_result.push(result)
        }
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
  return await getEle(arr)
}
exports.CompressImgs = CompressImgs