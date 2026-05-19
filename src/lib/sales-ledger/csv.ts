import type { SalesLedgerEntry, SalesLedgerType } from "./index";

const HEADERS = [
  "Tanggal",
  "Tipe",
  "Deskripsi",
  "Order ID",
  "Disbursement ID",
  "Jumlah (IDR)",
] as const;

const TYPE_LABELS: Record<SalesLedgerType, string> = {
  sale: "Penjualan",
  withdrawal: "Penarikan",
  refund: "Refund",
  adjustment: "Adjustment",
};

function escapeCSVField(value: string): string {
  if (value === "") return "";
  const needsQuote = /[",\n\r]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuote ? `"${escaped}"` : escaped;
}

function formatTimestamp(iso: string): string {
  // ISO 8601 — Excel-friendly. Output: 2026-05-18 10:30:00 WIB
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
}

export function buildCSVRow(entry: SalesLedgerEntry): string {
  const fields = [
    formatTimestamp(entry.created_at),
    TYPE_LABELS[entry.type] ?? entry.type,
    entry.description ?? "",
    entry.order_id ?? "",
    entry.disbursement_id ?? "",
    String(entry.amount),
  ].map(escapeCSVField);
  return fields.join(",");
}

export function buildCSVHeader(): string {
  return HEADERS.join(",");
}

export function buildCSV(entries: SalesLedgerEntry[]): string {
  const lines = [buildCSVHeader(), ...entries.map(buildCSVRow)];
  // BOM untuk Excel supaya kolom UTF-8 (rupiah, tilde) tampil benar
  return "﻿" + lines.join("\r\n");
}
