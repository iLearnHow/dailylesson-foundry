import { promises as fs } from 'fs';
import path from 'path';

export default async function handler(req, res) {
  const filePath = path.join(process.cwd(), 'public', 'ilearn-api-docs.html');
  const html = await fs.readFile(filePath, 'utf8');
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
} 