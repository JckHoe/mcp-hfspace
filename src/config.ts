import minimist from "minimist";
import path from "path";

// Export types enum
export enum ExportMode {
  FileBased = "FileBased", // Default
  None = "None",
}

function isExportMode(value: unknown): value is ExportMode {
  return (
    typeof value === "string" &&
    Object.values(ExportMode).includes(value as ExportMode)
  );
}

export interface Config {
  claudeDesktopMode: boolean;
  exportMode: ExportMode;
  workDir: string;
  spacePaths: string[];
  hfToken?: string;
  debug: boolean;
}

export const config = parseConfig();

export function parseConfig(): Config {
  const argv = minimist(process.argv.slice(2), {
    string: ["work-dir", "hf-token", "export-mode"],
    boolean: ["desktop-mode", "debug"],
    default: {
      "desktop-mode": process.env.CLAUDE_DESKTOP_MODE !== "false",
      "export-mode": process.env.MCP_HF_EXPORT_MODEL || ExportMode.FileBased,
      "work-dir": process.env.MCP_HF_WORK_DIR || process.cwd(),
      "hf-token": process.env.HF_TOKEN,
      debug: false,
    },
    "--": true,
  });

  const rawExportMode = argv["export-mode"];
  const exportMode = isExportMode(rawExportMode)
    ? rawExportMode
    : ExportMode.FileBased;
  return {
    claudeDesktopMode: argv["desktop-mode"],
    exportMode: exportMode,
    workDir: path.resolve(argv["work-dir"]),
    hfToken: argv["hf-token"],
    debug: argv["debug"],
    spacePaths: (() => {
      const filtered = argv._.filter((arg) => arg.toString().trim().length > 0);
      return filtered.length > 0 ? filtered : ["evalstate/FLUX.1-schnell"];
    })(),
  };
}
