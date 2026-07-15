'use client';

import { useRef, useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n-context';

export interface CandidateCardData {
  memberId: string;
  fullName: string;
  regionCity: string;
  dateOfIssue: string;
}

// ─── IMPORTANT ───────────────────────────────────────────────────────────────
// These coordinates were measured directly off the two actual template PNGs
// (pixel-diff analysis against the background color, not eyeballed), so they
// should already be accurate. If you ever replace either template image,
// re-measure — do NOT just reuse the other language's numbers, because:
//   1. The two templates are NOT the same pixel size (see TEMPLATES below).
//   2. The Amharic title text wraps to 2 lines instead of 1, which shifts
//      every field down by ~14px relative to the English layout.
//   3. Label/value text lengths differ per language, which can change label
//      row heights.
//
// Positioning model: each field's `centerY`/`left` is the pixel CENTER of
// where the value text should sit (not the top-left corner). We anchor with
// `top: %` + `transform: translateY(-50%)` and `lineHeight: 1`, which avoids
// the old bug class where font ascent/line-height math silently shifted text
// away from where you measured it.
//
// To DEBUG: pass showDebug={true} — red dots mark the measured center point
// for each field so you can see immediately if a future template edit has
// drifted out of alignment.
// ─────────────────────────────────────────────────────────────────────────────

const TEMPLATES = {
  EN: { src: '/english-candidate-card-template.png', w: 1024, h: 1536 },
  AM: { src: '/amharic-candidate-card-template.png', w: 1024, h: 1535 },
} as const;

type FieldConfig = {
  key: keyof CandidateCardData;
  centerY: number; // px, vertical center of the field's text
  left: number; // px, left edge of the field's text
  width: number; // px, max width before ellipsis
  color: string;
  fontSize: number; // cqw — percent of container inline width
};

const FIELDS: Record<'EN' | 'AM', FieldConfig[]> = {
  EN: [
    { key: 'memberId', centerY: 588, left: 420, width: 560, color: '#7a1015', fontSize: 4.1 },
    { key: 'fullName', centerY: 703, left: 420, width: 560, color: '#1a1a1a', fontSize: 3.9 },
    { key: 'regionCity', centerY: 827, left: 420, width: 560, color: '#1a1a1a', fontSize: 3.9 },
    { key: 'dateOfIssue', centerY: 939, left: 420, width: 560, color: '#1a1a1a', fontSize: 3.7 },
  ],
  AM: [
    { key: 'memberId', centerY: 559, left: 420, width: 560, color: '#7a1015', fontSize: 4.1 },
    { key: 'fullName', centerY: 678, left: 420, width: 560, color: '#1a1a1a', fontSize: 3.9 },
    { key: 'regionCity', centerY: 789, left: 420, width: 560, color: '#1a1a1a', fontSize: 3.9 },
    { key: 'dateOfIssue', centerY: 899, left: 420, width: 560, color: '#1a1a1a', fontSize: 3.7 },
  ],
};

export function CandidateCard({
  data,
  autoDownload = false,
  showDebug = false, // ← pass true to see red center-point markers
}: {
  data: CandidateCardData;
  autoDownload?: boolean;
  showDebug?: boolean;
}) {
  const { t, lang } = useI18n();
  const cardRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [downloaded, setDownloaded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [imageReady, setImageReady] = useState(false);

  const template = TEMPLATES[lang];
  const fields = FIELDS[lang];

  // Whichever language is active, the template <img> swaps src (and remounts,
  // via the key below) — reset readiness/download state so a stale "✓
  // Downloaded" or a premature capture from the previous language can't
  // leak into the new one.
  useEffect(() => {
    setImageReady(false);
    setDownloaded(false);
  }, [lang]);

  async function handleDownload() {
    if (!cardRef.current || downloading) return;
    setDownloading(true);
    try {
      // Guard against capturing before the (possibly just-swapped) template
      // image has actually finished decoding — this is what made downloads
      // unreliable when switching languages right before exporting.
      if (imgRef.current && !imgRef.current.complete) {
        await imgRef.current.decode().catch(() => {});
      }
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 3,
        cacheBust: true,
      });
      const link = document.createElement('a');
      link.download = `PC-CPE-Candidate-Card-${data.memberId}.png`;
      link.href = dataUrl;
      link.click();
      setDownloaded(true);
    } finally {
      setDownloading(false);
    }
  }

  useEffect(() => {
    if (autoDownload && imageReady) {
      const timer = setTimeout(handleDownload, 600);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoDownload, imageReady, lang]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        ref={cardRef}
        className="relative w-[900px] max-w-full rounded-2xl overflow-hidden shadow-2xl"
        style={{
          aspectRatio: `${template.w} / ${template.h}`,
          containerType: 'inline-size',
          fontFamily:
            lang === 'AM'
              ? "'Noto Sans Ethiopic', 'Inter', sans-serif"
              : "'Inter', 'Noto Sans Ethiopic', sans-serif",
        }}
      >
        {/*
          object-fit: fill is safe here ONLY because aspectRatio above now
          matches the source image's real ratio exactly — so "fill" never
          actually has to stretch anything non-uniformly.
        */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          key={template.src}
          src={template.src}
          alt="PC-CPE Candidate Member Card"
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: 'fill' }}
          crossOrigin="anonymous"
          onLoad={() => setImageReady(true)}
        />

        {/* ── Dynamic text fields ─────────────────────────────────────────── */}
        {/*
          NOTE: text-align:'left' below is set explicitly and is load-bearing.
          Screenshots showed every value centered on the exact same x
          coordinate (~68% across the card) regardless of field width or
          text length — that only happens when text-align:center is being
          inherited from an ancestor (e.g. a `text-center` class on whatever
          wraps the success/card view). The measured left/top numbers were
          already correct; only the alignment was fighting them. Setting it
          inline here overrides any inherited value no matter where it comes
          from.
        */}
        {fields.map((f) => (
          <div
            key={f.key}
            className="absolute font-bold whitespace-nowrap overflow-hidden text-ellipsis text-left"
            style={{
              top: `${(f.centerY / template.h) * 100}%`,
              left: `${(f.left / template.w) * 100}%`,
              width: `${(f.width / template.w) * 100}%`,
              transform: 'translateY(-50%)',
              color: f.color,
              fontSize: `${f.fontSize}cqw`,
              lineHeight: 1,
              textAlign: 'left',
              direction: 'ltr',
            }}
          >
            {data[f.key]}
          </div>
        ))}

        {/* ── Debug overlay (showDebug={true}) ────────────────────────────── */}
        {showDebug &&
          fields.map((f) => (
            <div
              key={`debug-${f.key}`}
              className="absolute pointer-events-none"
              style={{
                top: `${(f.centerY / template.h) * 100}%`,
                left: `${(f.left / template.w) * 100}%`,
                transform: 'translate(-4px, -4px)',
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#ff0000',
                zIndex: 50,
              }}
              title={`${f.key} → center(${f.centerY}, ${f.left})`}
            />
          ))}
      </div>

      <button
        onClick={handleDownload}
        disabled={downloading}
        className="rounded-lg bg-[#a30000] hover:bg-[#8a0000] disabled:opacity-60 text-white font-semibold px-6 py-2.5 text-sm transition-colors"
      >
        {downloading
          ? '…'
          : downloaded
            ? `✓ ${t('cardDownload')}`
            : t('cardDownload')}
      </button>
    </div>
  );
}