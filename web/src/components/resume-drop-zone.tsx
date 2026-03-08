"use client";

import { useState, useRef } from "react";
import { getApiUrl } from "@/lib/api";

export function ResumeDropZone({
  onSuccess,
  successMessage = "Resume parsed. Taking you to dashboard…",
}: {
  onSuccess?: () => void;
  successMessage?: string;
} = {}) {
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const accept = "application/pdf,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx";

  const upload = async (file: File) => {
    if (!file) return;
    const allowed = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowed.includes(file.type)) {
      setStatus("error");
      setMessage("Please use a PDF or DOCX file.");
      return;
    }
    setStatus("uploading");
    setMessage("");
    const formData = new FormData();
    formData.append("resume", file);
    try {
      const res = await fetch(getApiUrl("/api/resume/upload"), {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || `Upload failed (${res.status})`);
        return;
      }
      setStatus("success");
      setMessage(successMessage);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        else window.location.href = "/dashboard";
      }, 800);
    } catch (err) {
      setStatus("error");
      setMessage("Could not reach the server. Is the API running?");
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer?.files?.[0];
    if (file) upload(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
    e.target.value = "";
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      className="group relative block overflow-hidden rounded-2xl border-[1.5px] border-dashed border-[var(--border2)] bg-[var(--surface)] p-[52px_40px] text-center transition-all duration-300 hover:border-[var(--accent)] hover:bg-[var(--surface2)] cursor-pointer"
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={onFileChange}
        className="hidden"
        aria-label="Upload resume"
      />
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: "radial-gradient(ellipse at center, var(--accent-glow) 0%, transparent 70%)",
        }}
      />
      <div className="relative z-10 mx-auto mb-5 flex h-[52px] w-[52px] items-center justify-center rounded-xl border border-[var(--border2)] bg-[var(--surface3)] transition-transform duration-200 group-hover:scale-105">
        {status === "uploading" ? (
          <span className="text-[var(--accent)] text-xs">…</span>
        ) : (
          <svg
            className="h-[22px] w-[22px]"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="var(--accent)"
          >
            <path d="M12 16V4m0 0L8 8m4-4l4 4M4 20h16" />
          </svg>
        )}
      </div>
      <div className="relative z-10 text-base font-medium text-[var(--text)]">
        {status === "uploading" && "Uploading…"}
        {status === "success" && message}
        {status === "error" && message}
        {status === "idle" && "Drop your resume here"}
      </div>
      <div className="relative z-10 mt-1.5 text-[13px] text-[var(--text-muted)]">
        {status === "idle" && "PDF or DOCX · or click to browse files"}
        {status === "error" && "Try again or continue to dashboard below"}
      </div>
    </div>
  );
}
