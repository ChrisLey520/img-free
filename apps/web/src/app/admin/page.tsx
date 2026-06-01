"use client";

import { useEffect, useRef, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CodeStatus = "UNUSED" | "USED" | "EXPIRED";

interface CodeRecord {
  id: string;
  code: string;
  status: CodeStatus;
  pddOrderId: string | null;
  createdAt: string;
  usedAt: string | null;
  expiresAt: string | null;
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ??
  (typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? "/api"
    : "http://localhost:3002");

const STATUS_LABEL: Record<CodeStatus, string> = {
  UNUSED: "未使用",
  USED: "已使用",
  EXPIRED: "已过期",
};

const STATUS_VARIANT: Record<CodeStatus, "default" | "secondary" | "destructive"> = {
  UNUSED: "default",
  USED: "secondary",
  EXPIRED: "destructive",
};

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");
  const [codes, setCodes] = useState<CodeRecord[]>([]);
  const [generateCount, setGenerateCount] = useState("1");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem("admin_key");
    if (saved) {
      setAdminKey(saved);
      loadCodes(saved);
    }
  }, []);

  async function loadCodes(key: string) {
    try {
      const res = await fetch(`${API_BASE}/admin/codes`, {
        headers: { "x-admin-key": key },
      });
      if (res.status === 403) {
        setAuthenticated(false);
        setAuthError("密钥错误");
        return;
      }
      const data = (await res.json()) as CodeRecord[];
      setCodes(data);
      setAuthenticated(true);
      sessionStorage.setItem("admin_key", key);
    } catch {
      setAuthError("网络错误");
    }
  }

  async function handleAuth() {
    setAuthError("");
    await loadCodes(adminKey);
  }

  async function handleGenerate() {
    const count = parseInt(generateCount, 10);
    if (!count || count < 1 || count > 200) {
      setError("数量须在 1-200 之间");
      return;
    }
    setBusy(true);
    setMsg("");
    setError("");
    try {
      const res = await fetch(`${API_BASE}/admin/codes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ count }),
      });
      if (!res.ok) throw new Error("生成失败");
      const newCodes = (await res.json()) as CodeRecord[];
      setCodes((prev) => [...newCodes, ...prev]);
      setMsg(`成功生成 ${newCodes.length} 个兑换码`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "未知错误");
    } finally {
      setBusy(false);
    }
  }

  function copyUnused() {
    const unused = codes.filter((c) => c.status === "UNUSED").map((c) => c.code);
    navigator.clipboard.writeText(unused.join("\n"));
    setMsg(`已复制 ${unused.length} 个未使用兑换码到剪贴板`);
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
  }

  const unusedCount = codes.filter((c) => c.status === "UNUSED").length;
  const usedCount = codes.filter((c) => c.status === "USED").length;

  if (!authenticated) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-base">🔐 管理员登录</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-key">管理员密钥 (ADMIN_KEY)</Label>
              <Input
                id="admin-key"
                ref={inputRef}
                type="password"
                placeholder="输入 ADMIN_KEY"
                value={adminKey}
                onChange={(e) => { setAdminKey(e.target.value); setAuthError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleAuth()}
              />
              {authError && <p className="text-sm text-destructive">{authError}</p>}
            </div>
            <Button onClick={handleAuth} className="w-full">登录</Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">🛠 兑换码管理后台</h1>
          <Button variant="outline" size="sm" onClick={() => { sessionStorage.removeItem("admin_key"); setAuthenticated(false); }}>
            退出
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold">{codes.length}</div>
              <div className="text-xs text-muted-foreground">总计</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold text-green-600">{unusedCount}</div>
              <div className="text-xs text-muted-foreground">未使用</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold text-muted-foreground">{usedCount}</div>
              <div className="text-xs text-muted-foreground">已使用</div>
            </CardContent>
          </Card>
        </div>

        {/* Generate */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">生成兑换码</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 items-end">
              <div className="space-y-1 flex-1">
                <Label htmlFor="gen-count">数量</Label>
                <Input
                  id="gen-count"
                  type="number"
                  min={1}
                  max={200}
                  value={generateCount}
                  onChange={(e) => setGenerateCount(e.target.value)}
                />
              </div>
              <Button onClick={handleGenerate} disabled={busy}>
                {busy ? "生成中…" : "生成"}
              </Button>
              <Button variant="outline" onClick={copyUnused} disabled={unusedCount === 0}>
                复制全部未使用 ({unusedCount})
              </Button>
            </div>
            {msg && <p className="text-sm text-green-600 mt-2">{msg}</p>}
            {error && <p className="text-sm text-destructive mt-2">{error}</p>}
          </CardContent>
        </Card>

        {/* Code list */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">兑换码列表</CardTitle>
          </CardHeader>
          <CardContent>
            {codes.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无兑换码</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left py-2 pr-4 font-medium">兑换码</th>
                      <th className="text-left py-2 pr-4 font-medium">状态</th>
                      <th className="text-left py-2 pr-4 font-medium">创建时间</th>
                      <th className="text-left py-2 pr-4 font-medium">使用时间</th>
                      <th className="text-left py-2 font-medium">过期时间</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {codes.map((c) => (
                      <tr key={c.id} className="border-b last:border-0">
                        <td className="py-2 pr-4 font-mono tracking-wider">{c.code}</td>
                        <td className="py-2 pr-4">
                          <Badge variant={STATUS_VARIANT[c.status]}>{STATUS_LABEL[c.status]}</Badge>
                        </td>
                        <td className="py-2 pr-4 text-muted-foreground">{new Date(c.createdAt).toLocaleString("zh-CN")}</td>
                        <td className="py-2 pr-4 text-muted-foreground">{c.usedAt ? new Date(c.usedAt).toLocaleString("zh-CN") : "—"}</td>
                        <td className="py-2 text-muted-foreground">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("zh-CN") : "—"}</td>
                        <td className="py-2 pl-2">
                          <Button variant="ghost" size="sm" onClick={() => copyCode(c.code)}>复制</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
