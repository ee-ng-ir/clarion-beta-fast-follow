// @ts-nocheck — vendored from Picasso by scripts/sync-picasso.mjs; checked in the Picasso repo.
import * as React from "react";
import { File as FileIcon, X } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../button/button";

/**
 * FileUpload — Figma's `File upload` set (40000625:568): the field reads the chosen
 * file's name (or the placeholder), with a Secondary sm "Browse" button inside
 * on the right (4px end padding, per Figma).
 *
 * FileUploadItem — Figma "File upload item" (717:2086): a chosen file's row —
 * icon tile, name, size, progress, remove.
 *
 * The native file input is kept (visually hidden, not display:none) so the
 * browser's own picker, `accept` filtering, drag onto the button and form
 * submission all still work. The visible box is a <label> for it, so clicking
 * anywhere in the field opens the picker, and the Browse button is the same
 * label's visual — one control, not two.
 */
export interface FileUploadProps extends Omit<
  React.ComponentProps<"input">,
  "type" | "size" | "value" | "onChange"
> {
  onFilesChange?: (files: File[]) => void;
  size?: "sm" | "md";
  browseLabel?: string;
  groupClassName?: string;
}

export const FileUpload = React.forwardRef<HTMLInputElement, FileUploadProps>(
  (
    {
      onFilesChange,
      size = "md",
      browseLabel = "Browse",
      placeholder = "No file chosen",
      groupClassName,
      className,
      disabled,
      multiple,
      ...props
    },
    ref,
  ) => {
    const [files, setFiles] = React.useState<File[]>([]);
    const summary =
      files.length === 0
        ? null
        : files.length === 1
          ? files[0].name
          : `${files.length} files`;
    return (
      <label
        data-slot="file-upload"
        className={cn(
          "flex w-full min-w-0 cursor-pointer items-center gap-2 rounded-md border bg-surface-input-default border-line-input-default " +
            "transition-colors hover:border-line-input-hovered " +
            "has-[input:focus-visible]:border-line-input-focused has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-line-focused " +
            "has-[input:focus-visible]:ring-offset-2 has-[input:focus-visible]:ring-offset-surface-app " +
            "has-[[aria-invalid=true]]:border-line-input-invalid " +
            "has-[input:disabled]:cursor-not-allowed has-[input:disabled]:bg-surface-input-disabled has-[input:disabled]:border-line-input-disabled",
          size === "sm"
            ? "h-8 ps-2.5 pe-1 text-body-sm"
            : "h-9 ps-3 pe-1 text-body-md",
          groupClassName,
        )}
      >
        <input
          ref={ref}
          type="file"
          data-slot="file-upload-control"
          disabled={disabled}
          multiple={multiple}
          className={cn("sr-only", className)}
          onChange={(e) => {
            const list = Array.from(e.target.files ?? []);
            setFiles(list);
            onFilesChange?.(list);
          }}
          {...props}
        />
        <span
          className={cn(
            "min-w-0 flex-1 truncate",
            summary
              ? "text-content-neutral-emphasis"
              : "text-content-neutral-subtle",
            disabled && "text-content-disabled",
          )}
        >
          {summary ?? placeholder}
        </span>
        <Button asChild variant="secondary" size="xs" aria-hidden>
          <span
            className={cn(
              disabled && "pointer-events-none text-content-disabled",
            )}
          >
            {browseLabel}
          </span>
        </Button>
      </label>
    );
  },
);
FileUpload.displayName = "FileUpload";

/** 840 KB, 1.2 MB — binary units, one decimal above KB. */
export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let n = bytes / 1024,
    i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${i === 0 ? Math.round(n) : n.toFixed(1)} ${units[i]}`;
}

export interface FileUploadItemProps extends React.ComponentProps<"div"> {
  name: string;
  /** Bytes. Rendered with formatBytes. */
  size?: number;
  /** 0–100 while uploading; omit when done. */
  progress?: number;
  onRemove?: () => void;
  removeLabel?: string;
  icon?: React.ReactNode;
}

export function FileUploadItem({
  className,
  name,
  size,
  progress,
  onRemove,
  removeLabel,
  icon,
  ...props
}: FileUploadItemProps) {
  const uploading = progress !== undefined && progress < 100;
  return (
    <div
      data-slot="file-upload-item"
      className={cn(
        "flex w-full min-w-0 items-center gap-3 rounded-md border border-line-neutral-muted bg-surface-card py-3 ps-3.5 pe-3",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden
        className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-neutral-muted text-content-neutral-muted [&>svg]:size-6"
      >
        {icon ?? <FileIcon />}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex min-w-0 items-baseline gap-2">
          <span className="truncate text-body-sm text-content-neutral-emphasis">
            {name}
          </span>
          {size !== undefined ? (
            <span className="shrink-0 text-body-xs text-content-neutral-subtle">
              {formatBytes(size)}
            </span>
          ) : null}
        </div>
        {progress !== undefined ? (
          <div
            role="progressbar"
            aria-label={`Uploading ${name}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
            className="h-1.5 w-full overflow-hidden rounded-sm bg-surface-layer-emphasis"
          >
            <div
              className="h-full w-full rounded-sm bg-surface-primary-emphasis transition-transform ease-linear motion-reduce:transition-none translate-x-(--upload-offset) rtl:-translate-x-(--upload-offset)"
              // Same pattern as Progress: the offset travels as a custom
              // property. An inline width is refused by no-inline-styles and
              // transition-[width] by no-arbitrary-values — both correctly.
              style={
                {
                  "--upload-offset": `-${100 - Math.min(100, Math.max(0, progress))}%`,
                } as React.CSSProperties
              }
            />
          </div>
        ) : null}
      </div>
      {onRemove ? (
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={
            removeLabel ?? `${uploading ? "Cancel" : "Remove"} ${name}`
          }
          onClick={onRemove}
        >
          <X aria-hidden />
        </Button>
      ) : null}
    </div>
  );
}
