import mammoth from "mammoth";
import pdfParse from "pdf-parse";

export async function parseResume(buffer: Buffer, mimeType: string, originalName: string) {
  if (mimeType.includes("pdf") || originalName.toLowerCase().endsWith(".pdf")) {
    const parsed = await pdfParse(buffer);
    return cleanExtractedText(parsed.text, originalName);
  }
  if (
    mimeType.includes("wordprocessingml") ||
    mimeType.includes("msword") ||
    originalName.toLowerCase().endsWith(".docx")
  ) {
    const parsed = await mammoth.extractRawText({ buffer });
    return cleanExtractedText(parsed.value, originalName);
  }
  if (originalName.toLowerCase().endsWith(".doc")) {
    throw new Error("Legacy .doc files are not supported. Please save the resume as PDF or DOCX and upload it again.");
  }
  return cleanExtractedText(buffer.toString("utf8"), originalName);
}

function cleanExtractedText(value: string, originalName: string) {
  const text = value.replace(/\u0000/g, " ").replace(/\s+/g, " ").trim();
  const readableCharacters = text.match(/[A-Za-z0-9]/g)?.length ?? 0;
  if (readableCharacters < 80) {
    throw new Error(`${originalName} contains too little selectable text. If it is a scanned PDF, upload a text-based PDF or DOCX.`);
  }
  return text;
}
