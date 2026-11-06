// app/api/health/sample-documents/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const docDir = path.join(process.cwd(), '.document');
    if (!fs.existsSync(docDir)) {
      return NextResponse.json({ success: true, files: [] });
    }

    const fileNames = fs.readdirSync(docDir).filter((f) => f.endsWith('.pdf'));

    const sampleList = fileNames.map((name) => {
      let label = name.replace('.pdf', '');
      let category = 'Xét nghiệm';

      if (name.includes('Xét nghiệm')) {
        label = 'Xét nghiệm thường quy LIS (Sinh hóa & Nước tiểu)';
        category = 'Sinh hóa & Nước tiểu';
      } else if (name.includes('Huyết học')) {
        label = 'Huyết học & Truyền máu (Công thức máu)';
        category = 'Huyết học';
      } else if (name.includes('Thăm dò') && !name.includes('(1)')) {
        label = 'Điện tâm đồ (ECG) thường';
        category = 'Thăm dò chức năng';
      } else if (name.includes('Thăm dò chức năng (1)')) {
        label = 'Nội soi Tai - Mũi - Họng';
        category = 'Nội soi';
      } else if (name.includes('Siêu âm') && !name.includes('(1)')) {
        label = 'Siêu âm Tuyến giáp';
        category = 'Chẩn đoán hình ảnh';
      } else if (name.includes('chụp X-Quang')) {
        label = 'Chụp X-Quang tim phổi thẳng';
        category = 'Chẩn đoán hình ảnh';
      }

      return {
        fileName: name,
        label,
        category,
      };
    });

    return NextResponse.json({
      success: true,
      samples: sampleList,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { fileName } = await req.json();
    if (!fileName) {
      return NextResponse.json({ success: false, error: 'Thiếu fileName' }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), '.document', path.basename(fileName));
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy tệp' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const base64 = fileBuffer.toString('base64');

    return NextResponse.json({
      success: true,
      fileName,
      mimeType: 'application/pdf',
      fileBase64: `data:application/pdf;base64,${base64}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
