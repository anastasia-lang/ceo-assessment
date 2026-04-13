import { NextRequest, NextResponse } from 'next/server';
import { getSession, saveResponse } from '@/lib/db';
import { getSupabase } from '@/lib/supabase';

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
      const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `${sessionId}/${safeName}`;
      const buffer = Buffer.from(fileData, 'base64');

      const supabase = getSupabase();
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(storagePath, buffer, {
          upsert: true,
          contentType: 'application/octet-stream',
        });

      if (uploadError) {
        console.error('File upload error:', uploadError);
        return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
      }

      filePath = storagePath;
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
