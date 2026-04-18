"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ExternalLink,
  Loader2,
  MoreVertical,
  Pencil,
  RefreshCw,
  Trash2,
  AlertCircle,
  CheckCircle2,
  PauseCircle,
  Layers,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

export interface TemplateCardData {
  id: string;
  slug: string;
  name: string;
  display_name: string;
  description: string | null;
  category: string | null;
  preview_image_url: string | null;
  demo_url: string | null;
  is_active: boolean;
  deploy_status: "draft" | "deploying" | "live" | "failed" | "taking_down" | "archived";
  deploy_error: string | null;
  price_setup_override: number | null;
  price_monthly_override: number | null;
}

const STATUS_BADGE: Record<
  TemplateCardData["deploy_status"],
  { label: string; className: string; Icon: typeof Loader2 }
> = {
  draft: {
    label: "Draft",
    className: "bg-gray-100 text-gray-600 border-gray-200",
    Icon: PauseCircle,
  },
  deploying: {
    label: "Deploying",
    className: "bg-blue-50 text-blue-700 border-blue-200",
    Icon: Loader2,
  },
  live: {
    label: "Live",
    className: "bg-green-50 text-green-700 border-green-200",
    Icon: CheckCircle2,
  },
  failed: {
    label: "Failed",
    className: "bg-red-50 text-red-700 border-red-200",
    Icon: AlertCircle,
  },
  taking_down: {
    label: "Removing",
    className: "bg-orange-50 text-orange-700 border-orange-200",
    Icon: Loader2,
  },
  archived: {
    label: "Archived",
    className: "bg-slate-100 text-slate-600 border-slate-200",
    Icon: PauseCircle,
  },
};

const formatRupiah = (n: number | null) =>
  n === null ? null : new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(n);

interface TemplateCardProps {
  template: TemplateCardData;
  screenshotError?: string | null;
  onEdit: (template: TemplateCardData) => void;
  onRedeploy: (template: TemplateCardData) => void;
  onTakedown: (template: TemplateCardData) => void;
  onToggleActive: (template: TemplateCardData) => void;
  onViewLogs: (template: TemplateCardData) => void;
}

export default function TemplateCard({
  template,
  screenshotError,
  onEdit,
  onRedeploy,
  onTakedown,
  onToggleActive,
  onViewLogs,
}: TemplateCardProps) {
  const status = STATUS_BADGE[template.deploy_status] ?? STATUS_BADGE.draft;
  const StatusIcon = status.Icon;
  const isLoadingState =
    template.deploy_status === "deploying" || template.deploy_status === "taking_down";

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      {/* Thumbnail */}
      <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 relative">
        {template.preview_image_url ? (
          <Image
            src={template.preview_image_url}
            alt={template.display_name}
            fill
            className="object-cover"
            sizes="(max-width:768px) 100vw, 33vw"
          />
        ) : screenshotError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-4 text-center">
            <AlertCircle className="w-8 h-8 text-red-300" />
            <p className="text-[11px] text-red-500 font-medium">Screenshot gagal</p>
            <p className="text-[10px] text-red-400 line-clamp-2">{screenshotError}</p>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Layers className="w-10 h-10 text-slate-300" />
          </div>
        )}

        {/* Status badge */}
        <div className="absolute top-3 left-3">
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${status.className}`}
          >
            <StatusIcon
              className={`w-3.5 h-3.5 ${isLoadingState ? "animate-spin" : ""}`}
            />
            {status.label}
          </span>
        </div>

        {/* Menu */}
        <div className="absolute top-3 right-3" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
            title="Menu"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-10 w-44 bg-white border border-gray-100 rounded-lg shadow-lg z-10 py-1 text-sm">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onEdit(template);
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700 cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit Detail
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onRedeploy(template);
                }}
                disabled={!template.id || template.deploy_status === "deploying"}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Redeploy
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onToggleActive(template);
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700 cursor-pointer"
              >
                {template.is_active ? "Nonaktifkan" : "Aktifkan"}
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onViewLogs(template);
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700 cursor-pointer"
              >
                Lihat Log
              </button>
              <div className="border-t border-gray-100 my-1" />
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onTakedown(template);
                }}
                className="w-full text-left px-3 py-2 hover:bg-red-50 flex items-center gap-2 text-red-600 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Hapus
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight">
            {template.display_name}
          </h3>
          {template.category && (
            <span className="text-[10px] uppercase tracking-wide text-slate-400 font-medium flex-shrink-0">
              {template.category}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mb-3 line-clamp-2 flex-1">
          {template.description || "Tanpa deskripsi"}
        </p>

        {/* Pricing override */}
        {(template.price_setup_override || template.price_monthly_override) && (
          <div className="text-[11px] text-slate-500 mb-3 flex gap-3">
            {template.price_setup_override && (
              <span>
                Setup:{" "}
                <span className="font-medium text-slate-700">
                  Rp {formatRupiah(template.price_setup_override)}
                </span>
              </span>
            )}
            {template.price_monthly_override && (
              <span>
                /bulan:{" "}
                <span className="font-medium text-slate-700">
                  Rp {formatRupiah(template.price_monthly_override)}
                </span>
              </span>
            )}
          </div>
        )}

        {template.deploy_status === "failed" && template.deploy_error && (
          <div className="text-[11px] text-red-600 bg-red-50 border border-red-100 rounded p-2 mb-3 line-clamp-2">
            {template.deploy_error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-auto">
          {template.demo_url ? (
            <Link
              href={template.demo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Buka Demo
            </Link>
          ) : (
            <button
              disabled
              className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium border border-gray-100 rounded-lg px-3 py-2 text-gray-300 cursor-not-allowed"
            >
              Belum tersedia
            </button>
          )}
          {template.deploy_status === "draft" && (
            <button
              onClick={() => onRedeploy(template)}
              className="px-3 py-2 text-xs font-medium bg-[#4169df] hover:bg-[#3458c8] text-white rounded-lg transition-colors cursor-pointer"
            >
              Deploy
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
