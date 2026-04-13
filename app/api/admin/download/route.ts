import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
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

  // Strip leading "uploads/" if present (legacy paths stored as "uploads/sessionId/file")
  const storagePath = filePath.replace(/^uploads\//, '');

  const supabase = getSupabase();
  const { data, error } = await supabase.storage.from('uploads').download(storagePath);

  if (error || !data) {
    console.error('Download error:', error);
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  const buffer = Buffer.from(await data.arrayBuffer());
  const fileName = path.basename(storagePath);
  const ext = path.extname(fileName).toLowerCase();

  const mimeTypes: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.csv': 'text/csv',
    '.txt': 'text/plain',
  };

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': mimeTypes[ext] || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
  });
}
