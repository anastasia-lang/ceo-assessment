import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET(request: NextRequest) {
  const password = request.nextUrl.searchParams.get('password');
  const adminPassword = process.env.ADMIN_PASSWORD || 'payvio2024';

  if (password !== adminPassword) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cwd = process.cwd();
  const dbDir = path.join(cwd, 'data');
  const dbPath = path.join(dbDir, 'assessment.db');

  const info: Record<string, unknown> = {
    cwd,
    dbDir,
    dbPath,
    dbDirExists: fs.existsSync(dbDir),
    dbFileExists: fs.existsSync(dbPath),
  };

  if (fs.existsSync(dbPath)) {
    const stat = fs.statSync(dbPath);
    info.dbFileSize = stat.size;
    info.dbFileModified = stat.mtime.toISOString();
    info.dbFileCreated = stat.birthtime.toISOString();
  }

  // Check if /app/data exists (Railway volume mount point)
  info.appDataExists = fs.existsSync('/app/data');
  if (fs.existsSync('/app/data')) {
    try {
      info.appDataContents = fs.readdirSync('/app/data');
    } catch (e) {
      info.appDataError = String(e);
    }
  }

  // List data dir contents
  if (fs.existsSync(dbDir)) {
    try {
      info.dataDirContents = fs.readdirSync(dbDir);
    } catch (e) {
      info.dataDirError = String(e);
    }
  }

  // Check environment hints
  info.railwayVolumeMountPath = process.env.RAILWAY_VOLUME_MOUNT_PATH || 'not set';
  info.railwayEnvironment = process.env.RAILWAY_ENVIRONMENT || 'not set';

  // Check for any .db files anywhere in the app directory
  try {
    const appContents = fs.readdirSync(cwd);
    info.cwdContents = appContents;
  } catch (e) {
    info.cwdError = String(e);
  }

  return NextResponse.json(info);
}
