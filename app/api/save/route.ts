import { NextRequest, NextResponse } from 'next/server';
import { getSession, saveResponse } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, stage, questionKey, responseText, responseJson, fileData, fileName } = body;

    if (!sessionId || !stage || !questionKey) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    let filePath: string | null = null;

    if (fileData && fileName) {
      const uploadsDir = path.join(process.cwd(), 'data', 'uploads', sessionId);
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const fullPath = path.join(uploadsDir, safeName);
      const buffer = Buffer.from(fileData, 'base64');
      fs.writeFileSync(fullPath, buffer);
      filePath = `uploads/${sessionId}/${safeName}`;
    }

    await saveResponse(
      sessionId,
      stage,
      questionKey,
      responseText || null,
      responseJson ? JSON.stringify(responseJson) : null,
      filePath,
      false
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save error:', error);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}
