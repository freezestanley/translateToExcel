const {
  isMainThread, parentPort, workerData, threadId,
  MessageChannel, MessagePort, Worker
} = require('worker_threads');
 
// function mainThread() {
//   const worker = new Worker(__filename, { workerData: 0 });
//   worker.on('exit', code => { console.log(`main: worker stopped with exit code ${code}`); });
//   worker.on('message', msg => {
//     console.log(`main: receive ${msg}`);
//     worker.postMessage(msg + 1);
//   });
//   const worker1 = new Worker(__filename, { workerData: 0 });
//   worker1.on('exit', code => { console.log(`main: worker stopped with exit code ${code}`); });
//   worker1.on('message', msg => {
//     console.log(`main: receive ${msg}`);
//     worker1.postMessage(msg + 1);
//   });
// }
 
// function workerThread() {
//   console.log(`worker: threadId ${threadId} start with ${__filename}`);
//   console.log(`worker: workerDate ${workerData}`);
//   parentPort.on('message', msg => {
//     console.log(`worker: receive ${msg}`);
//     if (msg === 5) { process.exit(); }
//     parentPort.postMessage(msg);
//   }),
//   parentPort.postMessage(workerData);
// }
 
// if (isMainThread) {
//   mainThread();
// } else {
//   workerThread();
// }


// if (isMainThread) {
//   const worker1 = new Worker(__filename, { workerData: '111' });
//   const worker2 = new Worker(__filename, { workerData: '222' });
//   const subChannel = new MessageChannel();
//   worker1.postMessage({ hereIsYourPort: subChannel.port1 }, [subChannel.port1]);
//   worker2.postMessage({ hereIsYourPort: subChannel.port2 }, [subChannel.port2]);
//   worker1.on('message', msg => {
//         console.log(`main: receive ${msg}`);
//         worker.postMessage(msg + 1);
//   });
//   worker2.on('message', msg => {
//     console.log(`main: receive ${msg}`);
//     worker.postMessage(msg + 1);
//   });
//   worker1.postMessage('xxx');
//   worker2.postMessage('bbb');
//   worker1.on('exit', code => { console.log(`main: worker stopped with exit code ${code}`); });
//   worker2.on('exit', code => { console.log(`main: worker stopped with exit code ${code}`); });
// } else {
//   parentPort.once('message', (value) => {
//     value.hereIsYourPort.postMessage('hello');
//     value.hereIsYourPort.on('message', msg => {
//       console.log(`thread ${threadId}: receive ${msg} workData ${workerData}`);
//     });
//   });
//   parentPort.on('message', msg => {
//     console.log(`worker: receive ${msg}`);
//     parentPort.postMessage(msg);
//     // process.exit(); 
//   })
// }



if (isMainThread) {
  console.log('==========isMainThread==========')
  const worker1 = new Worker(__filename, { workerData: 'aaa' });
  const worker2 = new Worker(__filename, { workerData: 'bbb' });
  worker1.on('message', msg => {
    console.log(`main: receive ${msg}`);
    worker1.postMessage(msg + 1);
  });
  worker2.on('message', msg => {
    console.log(`main: receive ${msg}`);
    worker2.postMessage(msg + 1);
  });
  worker1.postMessage(1);
  worker2.postMessage(2);
} else {
  console.log('==========notisMainThread==========')
  parentPort.on('message', msg => {
    console.log(`worker: receive ${msg}`);
    parentPort.postMessage(msg);
    process.exit();
  })
}