"use client";

import { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const STORAGE_KEY = "perspective_api_config";

const PROVIDERS = {
  groq: {
    id: "groq",
    label: "Groq (Free)",
    keyPlaceholder: "gsk_...",
    docsUrl: "https://console.groq.com/keys",
    instructions: "1. Go to console.groq.com  2. Sign up free  3. Click API Keys → Create API Key  4. Paste it above.",
    validateKey: (k: string) => k.startsWith("gsk_") && k.length > 20,
    models: [
      { value: "llama-3.3-70b-versatile", label: "Llama 3.3 70B" },
      { value: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant" },
      { value: "compound", label: "Compound" },
      { value: "compound-mini", label: "Compound Mini" },
      { value: "qwen/qwen3-32b", label: "Qwen3 32B" },
      { value: "moonshotai/kimi-k2-instruct-0905", label: "Kimi K2" },
      { value: "openai/gpt-oss-120b", label: "GPT OSS 120B" },
      { value: "openai/gpt-oss-20b", label: "GPT OSS 20B" },
    ],
    defaultModel: "llama-3.3-70b-versatile",
  },
};

export interface ApiConfig {
  activeProvider: string;
  activeModel: string;
  keys: Record<string, string>;
}

export function loadApiConfig(): ApiConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getActiveApiKey(): string | null {
  const config = loadApiConfig();
  if (!config) return null;
  return config.keys?.[config.activeProvider] ?? null;
}

export function getActiveModel(): string | null {
  const config = loadApiConfig();
  if (!config) return null;
  return config.activeModel ?? null;
}

function saveApiConfig(config: ApiConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

function isConfigured(): boolean {
  const config = loadApiConfig();
  return !!(config?.activeProvider && config?.keys?.[config.activeProvider]);
}

export function SettingsModal({ forceOpen = false }: { forceOpen?: boolean }) {
  const [open, setOpen] = useState(false);
  const [provider, setProvider] = useState("groq");
  const [keys, setKeys] = useState<Record<string, string>>({ groq: "" });
  const [model, setModel] = useState(PROVIDERS.groq.defaultModel);
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [firstRun, setFirstRun] = useState(false);

  useEffect(() => {
    const config = loadApiConfig();
    if (config) {
      // Fallback to groq if saved provider no longer exists (e.g. gemini was removed)
      const savedProvider = config.activeProvider in PROVIDERS ? config.activeProvider : "groq";
      setProvider(savedProvider);
      setModel(config.activeModel || PROVIDERS.groq.defaultModel);
      setKeys((prev) => ({ ...prev, ...config.keys }));
    }
    if (!isConfigured() || forceOpen) {
      setFirstRun(!isConfigured());
      setOpen(true);
    }
  }, [forceOpen]);

  useEffect(() => {
    const current = PROVIDERS[provider as keyof typeof PROVIDERS];
    setModel(current.defaultModel);
    setShowKey(false);
    setError("");
  }, [provider]);

  function handleSave() {
    setError("");
    const current = PROVIDERS[provider as keyof typeof PROVIDERS];
    const key = keys[provider] ?? "";
    if (!key) {
      setError("Please enter an API key.");
      return;
    }
    if (!current.validateKey(key)) {
      setError(`That doesn't look like a valid ${current.label} key. Check and try again.`);
      return;
    }
    saveApiConfig({ activeProvider: provider, activeModel: model, keys });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setOpen(false);
    }, 900);
  }

  const currentProvider = PROVIDERS[provider as keyof typeof PROVIDERS];

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => setOpen(true)}
        title="Configure AI provider"
      >
        <Settings className="w-4 h-4" />
        <span className="hidden sm:inline">API Settings</span>
      </Button>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v && firstRun && !isConfigured()) return;
          setOpen(v);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              AI Provider Settings
            </DialogTitle>
          </DialogHeader>

          {firstRun && (
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 p-3 text-sm text-blue-800 dark:text-blue-200">
              To use Perspective, select a free AI provider and paste your API key. Your key is stored only in your browser — never sent to our servers.
            </div>
          )}

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>AI Provider</Label>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(PROVIDERS).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>API Key</Label>
                {keys[provider] && (
                  <Badge variant="secondary" className="text-xs text-green-700 bg-green-100 dark:bg-green-900/40 dark:text-green-300">
                    Key saved
                  </Badge>
                )}
              </div>
              <div className="relative">
                <Input
                  type={showKey ? "text" : "password"}
                  placeholder={currentProvider.keyPlaceholder}
                  value={keys[provider] ?? ""}
                  onChange={(e) =>
                    setKeys((prev) => ({ ...prev, [provider]: e.target.value }))
                  }
                  className="pr-16 font-mono text-sm"
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowKey((v) => !v)}
                >
                  {showKey ? "Hide" : "Show"}
                </button>
              </div>
              <a
                href={currentProvider.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Get your {currentProvider.label} key →
              </a>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {currentProvider.instructions}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Model</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currentProvider.models.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}

            <Button
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0"
              onClick={handleSave}
            >
              {saved ? "Saved ✓" : "Save & Continue"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
