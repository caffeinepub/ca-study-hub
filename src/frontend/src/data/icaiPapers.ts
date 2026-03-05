export type CALevel = "foundation" | "intermediate" | "final";
export type PaperCategory =
  | "Question Papers"
  | "Study Material"
  | "Mock Test Papers"
  | "RTP"
  | "MTP";

export interface ICAIPaper {
  id: string;
  title: string;
  subject: string;
  level: CALevel;
  category: PaperCategory;
  year?: string;
  url: string;
}

export const ICAI_PAPERS: ICAIPaper[] = [
  // ─── CA FOUNDATION ───────────────────────────────────────────────────────────
  // Study Material
  {
    id: "f-sm-1",
    title: "Principles & Practice of Accounting",
    subject: "Paper 1",
    level: "foundation",
    category: "Study Material",
    url: "https://icmai.in/upload/Students/Syllabus2022/Foundation/Study_Notes_Foundation_Paper1.pdf",
  },
  {
    id: "f-sm-2",
    title: "Business Laws",
    subject: "Paper 2",
    level: "foundation",
    category: "Study Material",
    url: "https://resource.cdn.icai.org/77081bos62279.pdf",
  },
  {
    id: "f-sm-3",
    title: "Business Mathematics, LR & Statistics",
    subject: "Paper 3",
    level: "foundation",
    category: "Study Material",
    url: "https://resource.cdn.icai.org/77082bos62280.pdf",
  },
  {
    id: "f-sm-4",
    title: "Business Economics",
    subject: "Paper 4",
    level: "foundation",
    category: "Study Material",
    url: "https://resource.cdn.icai.org/77083bos62281.pdf",
  },
  // Question Papers
  {
    id: "f-qp-1",
    title: "Foundation Question Paper – May 2024",
    subject: "All Papers",
    level: "foundation",
    category: "Question Papers",
    year: "May 2024",
    url: "https://icai.org/post/ca-foundation-question-papers-may-2024",
  },
  {
    id: "f-qp-2",
    title: "Foundation Question Paper – Nov 2023",
    subject: "All Papers",
    level: "foundation",
    category: "Question Papers",
    year: "Nov 2023",
    url: "https://icai.org/post/ca-foundation-question-papers-nov-2023",
  },
  {
    id: "f-qp-3",
    title: "Foundation Question Paper – May 2023",
    subject: "All Papers",
    level: "foundation",
    category: "Question Papers",
    year: "May 2023",
    url: "https://icai.org/post/ca-foundation-question-papers-may-2023",
  },
  // RTP
  {
    id: "f-rtp-1",
    title: "Foundation RTP – May 2025",
    subject: "All Papers",
    level: "foundation",
    category: "RTP",
    year: "May 2025",
    url: "https://icai.org/post/revision-test-papers-may-2025-ca-foundation",
  },
  {
    id: "f-rtp-2",
    title: "Foundation RTP – Nov 2024",
    subject: "All Papers",
    level: "foundation",
    category: "RTP",
    year: "Nov 2024",
    url: "https://icai.org/post/revision-test-papers-nov-2024-ca-foundation",
  },
  // MTP
  {
    id: "f-mtp-1",
    title: "Foundation MTP – Series 1, 2025",
    subject: "All Papers",
    level: "foundation",
    category: "MTP",
    year: "2025",
    url: "https://icai.org/post/mock-test-papers-series-i-ca-foundation-2025",
  },
  {
    id: "f-mtp-2",
    title: "Foundation MTP – Series 2, 2024",
    subject: "All Papers",
    level: "foundation",
    category: "MTP",
    year: "2024",
    url: "https://icai.org/post/mock-test-papers-series-ii-ca-foundation-2024",
  },
  // Mock Test
  {
    id: "f-mt-1",
    title: "Foundation Mock Test Papers – 2024",
    subject: "All Papers",
    level: "foundation",
    category: "Mock Test Papers",
    year: "2024",
    url: "https://icai.org/post/mock-test-papers-ca-foundation-2024",
  },

  // ─── CA INTERMEDIATE ─────────────────────────────────────────────────────────
  // Study Material
  {
    id: "i-sm-1",
    title: "Advanced Accounting",
    subject: "Paper 1",
    level: "intermediate",
    category: "Study Material",
    url: "https://resource.cdn.icai.org/78001bos63001.pdf",
  },
  {
    id: "i-sm-2",
    title: "Corporate & Other Laws",
    subject: "Paper 2",
    level: "intermediate",
    category: "Study Material",
    url: "https://resource.cdn.icai.org/78002bos63002.pdf",
  },
  {
    id: "i-sm-3",
    title: "Taxation (Income Tax + GST)",
    subject: "Paper 3",
    level: "intermediate",
    category: "Study Material",
    url: "https://resource.cdn.icai.org/78003bos63003.pdf",
  },
  {
    id: "i-sm-4",
    title: "Cost & Management Accounting",
    subject: "Paper 4",
    level: "intermediate",
    category: "Study Material",
    url: "https://resource.cdn.icai.org/78004bos63004.pdf",
  },
  {
    id: "i-sm-5",
    title: "Auditing & Ethics",
    subject: "Paper 5",
    level: "intermediate",
    category: "Study Material",
    url: "https://resource.cdn.icai.org/78005bos63005.pdf",
  },
  {
    id: "i-sm-6",
    title: "Financial Management & Strategic Management",
    subject: "Paper 6",
    level: "intermediate",
    category: "Study Material",
    url: "https://resource.cdn.icai.org/78006bos63006.pdf",
  },
  // Question Papers
  {
    id: "i-qp-1",
    title: "Intermediate Question Paper – May 2024",
    subject: "All Papers",
    level: "intermediate",
    category: "Question Papers",
    year: "May 2024",
    url: "https://icai.org/post/ca-intermediate-question-papers-may-2024",
  },
  {
    id: "i-qp-2",
    title: "Intermediate Question Paper – Nov 2023",
    subject: "All Papers",
    level: "intermediate",
    category: "Question Papers",
    year: "Nov 2023",
    url: "https://icai.org/post/ca-intermediate-question-papers-nov-2023",
  },
  {
    id: "i-qp-3",
    title: "Intermediate Question Paper – May 2023",
    subject: "All Papers",
    level: "intermediate",
    category: "Question Papers",
    year: "May 2023",
    url: "https://icai.org/post/ca-intermediate-question-papers-may-2023",
  },
  // RTP
  {
    id: "i-rtp-1",
    title: "Intermediate RTP – May 2025",
    subject: "All Papers",
    level: "intermediate",
    category: "RTP",
    year: "May 2025",
    url: "https://icai.org/post/revision-test-papers-may-2025-ca-intermediate",
  },
  {
    id: "i-rtp-2",
    title: "Intermediate RTP – Nov 2024",
    subject: "All Papers",
    level: "intermediate",
    category: "RTP",
    year: "Nov 2024",
    url: "https://icai.org/post/revision-test-papers-nov-2024-ca-intermediate",
  },
  // MTP
  {
    id: "i-mtp-1",
    title: "Intermediate MTP – Series 1, 2025",
    subject: "All Papers",
    level: "intermediate",
    category: "MTP",
    year: "2025",
    url: "https://icai.org/post/mock-test-papers-series-i-ca-intermediate-2025",
  },
  {
    id: "i-mtp-2",
    title: "Intermediate MTP – Series 2, 2024",
    subject: "All Papers",
    level: "intermediate",
    category: "MTP",
    year: "2024",
    url: "https://icai.org/post/mock-test-papers-series-ii-ca-intermediate-2024",
  },
  // Mock Test
  {
    id: "i-mt-1",
    title: "Intermediate Mock Test Papers – 2024",
    subject: "All Papers",
    level: "intermediate",
    category: "Mock Test Papers",
    year: "2024",
    url: "https://icai.org/post/mock-test-papers-ca-intermediate-2024",
  },

  // ─── CA FINAL ────────────────────────────────────────────────────────────────
  // Study Material
  {
    id: "fn-sm-1",
    title: "Financial Reporting",
    subject: "Paper 1",
    level: "final",
    category: "Study Material",
    url: "https://resource.cdn.icai.org/79001bos64001.pdf",
  },
  {
    id: "fn-sm-2",
    title: "Strategic Financial Management",
    subject: "Paper 2",
    level: "final",
    category: "Study Material",
    url: "https://resource.cdn.icai.org/79002bos64002.pdf",
  },
  {
    id: "fn-sm-3",
    title: "Advanced Auditing & Professional Ethics",
    subject: "Paper 3",
    level: "final",
    category: "Study Material",
    url: "https://resource.cdn.icai.org/79003bos64003.pdf",
  },
  {
    id: "fn-sm-4",
    title: "Corporate & Economic Laws",
    subject: "Paper 4",
    level: "final",
    category: "Study Material",
    url: "https://resource.cdn.icai.org/79004bos64004.pdf",
  },
  {
    id: "fn-sm-5",
    title: "Strategic Cost Management & Performance Evaluation",
    subject: "Paper 5",
    level: "final",
    category: "Study Material",
    url: "https://resource.cdn.icai.org/79005bos64005.pdf",
  },
  {
    id: "fn-sm-6",
    title: "Direct Tax Laws & International Taxation",
    subject: "Paper 6A",
    level: "final",
    category: "Study Material",
    url: "https://resource.cdn.icai.org/79006bos64006.pdf",
  },
  {
    id: "fn-sm-7",
    title: "Indirect Tax Laws",
    subject: "Paper 6B",
    level: "final",
    category: "Study Material",
    url: "https://resource.cdn.icai.org/79007bos64007.pdf",
  },
  // Question Papers
  {
    id: "fn-qp-1",
    title: "Final Question Paper – May 2024",
    subject: "All Papers",
    level: "final",
    category: "Question Papers",
    year: "May 2024",
    url: "https://icai.org/post/ca-final-question-papers-may-2024",
  },
  {
    id: "fn-qp-2",
    title: "Final Question Paper – Nov 2023",
    subject: "All Papers",
    level: "final",
    category: "Question Papers",
    year: "Nov 2023",
    url: "https://icai.org/post/ca-final-question-papers-nov-2023",
  },
  {
    id: "fn-qp-3",
    title: "Final Question Paper – May 2023",
    subject: "All Papers",
    level: "final",
    category: "Question Papers",
    year: "May 2023",
    url: "https://icai.org/post/ca-final-question-papers-may-2023",
  },
  // RTP
  {
    id: "fn-rtp-1",
    title: "Final RTP – May 2025",
    subject: "All Papers",
    level: "final",
    category: "RTP",
    year: "May 2025",
    url: "https://icai.org/post/revision-test-papers-may-2025-ca-final",
  },
  {
    id: "fn-rtp-2",
    title: "Final RTP – Nov 2024",
    subject: "All Papers",
    level: "final",
    category: "RTP",
    year: "Nov 2024",
    url: "https://icai.org/post/revision-test-papers-nov-2024-ca-final",
  },
  // MTP
  {
    id: "fn-mtp-1",
    title: "Final MTP – Series 1, 2025",
    subject: "All Papers",
    level: "final",
    category: "MTP",
    year: "2025",
    url: "https://icai.org/post/mock-test-papers-series-i-ca-final-2025",
  },
  {
    id: "fn-mtp-2",
    title: "Final MTP – Series 2, 2024",
    subject: "All Papers",
    level: "final",
    category: "MTP",
    year: "2024",
    url: "https://icai.org/post/mock-test-papers-series-ii-ca-final-2024",
  },
  // Mock Test
  {
    id: "fn-mt-1",
    title: "Final Mock Test Papers – 2024",
    subject: "All Papers",
    level: "final",
    category: "Mock Test Papers",
    year: "2024",
    url: "https://icai.org/post/mock-test-papers-ca-final-2024",
  },
];

export const LEVEL_LABELS: Record<CALevel, string> = {
  foundation: "CA Foundation",
  intermediate: "CA Intermediate",
  final: "CA Final",
};

export const CATEGORY_COLORS: Record<PaperCategory, string> = {
  "Study Material": "var(--chart-1)",
  "Question Papers": "var(--chart-2)",
  "Mock Test Papers": "var(--chart-3)",
  RTP: "var(--chart-4)",
  MTP: "var(--chart-5)",
};

export const ALL_CATEGORIES: PaperCategory[] = [
  "Study Material",
  "Question Papers",
  "Mock Test Papers",
  "RTP",
  "MTP",
];
