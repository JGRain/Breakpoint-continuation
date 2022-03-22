const express = require('express');
const bodyParser = require('body-parser');
const multiparty = require('multiparty');
const fse = require('fs-extra');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(express.static(__dirname + '/public'));

app.use(bodyParser.urlencoded({ extended: true }));

app.use(bodyParser.json());

const UPLOAD_DIR = path.resolve(__dirname, 'public/upload');

app.post('/upload', function (req, res) {
  const form = new multiparty.Form({ uploadDir: 'temp' });
  form.parse(req);

  form.on('file', async (name, chunk) => {
    const chunkDir = `${UPLOAD_DIR}/${chunk.originalFilename.split('.')[0]}`;

    if (!fse.existsSync(chunkDir)) {
      await fse.mkdirs(chunkDir);
    }

    // 原文件名.index.ext
    const dPath = path.join(chunkDir, chunk.originalFilename.split('.')[1]);
    await fse.move(chunk.path, dPath, { overwrite: true })

    res.send('文件上传成功');
  });
});

app.post('/merge', async function (req, res) {
  const name = req.body.name;
  const fname = name.split('.')[0];

  const chunkDir = path.join(UPLOAD_DIR, fname);

  const chunks = await fse.readdir(chunkDir);

  chunks.sort((a, b) => a - b).map(chunkPath => {
    fs.appendFileSync(
      path.join(UPLOAD_DIR, name),
      fs.readFileSync(`${chunkDir}/${chunkPath}`)
    )
  })

  fse.removeSync(chunkDir);

  res.send({
    msg: '合并成功',
    url: `http:localhost:3002/upload/${name}`
  })
});

app.listen(3002, () => {
  console.log('server success');
});
