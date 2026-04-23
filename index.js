'use strict';
const http = require('node:http');
const pug = require('pug');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const server = http.createServer(async (req, res) => {
  const path = req.url;

  // --- 削除の処理 ---
  if (path.endsWith('/delete') && req.method === 'POST') {
    const id = parseInt(path.split('/')[2]);
    try {
      await prisma.post.delete({
        where: { id: id }
      });
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('削除完了');
    } catch (error) {
      console.error(error);
      res.writeHead(500);
      res.end('削除失敗');
    }
    return; // ここで処理を終了。下の判定には進ませない。
  }

  // 1. （/）に来たら /posts へ誘導
  if (path === '/') {
    res.writeHead(303, { 'Location': '/posts' });
    res.end();
    return;
  }

  // 2. /posts 以外（間違い）はエラーを表示
  if (path !== '/posts') {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('お探しのページは見つかりません。');
    return;
  }

  // 3. 【メイン】/posts に来た時の処理
  if (req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', async () => {
      const params = new URLSearchParams(body);
      const title = params.get('title');
      const detail = params.get('detail');

      if (title && detail) {
        const combined = `[${title}] ${detail}`;
        await prisma.post.create({
          data: { content: combined }
        });
      }
      res.writeHead(303, { 'Location': '/posts' });
      res.end();
    });
  } else {
    // GET（表示処理）
    const posts = await prisma.post.findMany({
      orderBy: { content: 'asc' }
    });

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    const html = pug.renderFile('./views/posts.pug', {
      title: 'ZENボード',
      posts: posts
    });
    res.end(html);
  }
}); // サーバー全体の閉じ

// ※ ここにあった不要な app.post の塊を削除しました

const port = 8000;
server.listen(port, () => {
  console.info(`Listening on ${port}`);
});