import prisma from './prisma';
import { extractVariables } from './template-engine';

const DEFAULT_BRIEF = `CONTENT BRIEF

Klien: {{client}}
Proyek: {{project}}
Judul: {{content_title}}
Platform: {{platform}}
Deadline: {{deadline}}
PIC: {{pic}}

📌 OBJECTIVE:
[Tuliskan tujuan konten]

🎯 KEY MESSAGE:
[Pesan utama yang ingin disampaikan]

📸 VISUAL REFERENCE:
[Link folder Drive]

📝 CAPTION DRAFT:
[Draft caption]

✅ APPROVAL:
[ ] Creative Director
[ ] Manajemen`;

const DEFAULT_REPORT = `LAPORAN BULANAN {{month}} {{year}}
Klien: {{client}}

📊 RINGKASAN
Total Konten Published: {{total_content}}
Total Engagement: {{engagement}}
Total Reach: {{reach}}
Growth vs Bulan Lalu: {{growth}}%

🏆 TOP PERFORMING CONTENT
{{top_content}}

📈 REKOMENDASI
[Insights & rekomendasi]
`;

export async function seedDefaultTemplates(workspaceId: string) {
  const existing = await prisma.docTemplate.count({ where: { workspaceId } });
  if (existing > 0) return;

  await prisma.docTemplate.createMany({
    data: [
      {
        workspaceId,
        name: 'Brief Konten Default',
        type: 'brief',
        content: DEFAULT_BRIEF,
        variables: extractVariables(DEFAULT_BRIEF)
      },
      {
        workspaceId,
        name: 'Laporan Bulanan Default',
        type: 'report',
        content: DEFAULT_REPORT,
        variables: extractVariables(DEFAULT_REPORT)
      }
    ]
  });
}
