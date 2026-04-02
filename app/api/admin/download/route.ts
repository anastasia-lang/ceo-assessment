import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  const password = request.nextUrl.searchParams.get('password');
  const adminPassword = process.env.ADMIN_PASSWORD || 'payvio2024';

  if (password !== adminPassword) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const filePath = request.nextUrl.searchParams.get('file');
  if (!filePath) {
    return NextResponse.json({ error: 'Missing file path' }, { status: 400 });
  }

  const fullPath = path.join(process.cwd(), 'data', filePath);
  const resolved = path.resolve(fullPath);
  const dataDir = path.resolve(path.join(process.cwd(), 'data'));

  // Prevent path traversal
  if (!resolved.startsWith(dataDir)) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  if (!fs.existsSync(resolved)) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  const buffer = fs.readFileSync(resolved);
  const fileName = path.basename(resolved);
  const ext = path.extname(fileName).toLowerCase();

  const mimeTypes: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.csv': 'text/csv',
  };

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': mimeTypes[ext] || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
  });
}
