"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { PreviewStage } from "./PreviewStage";
import { PromptPanel } from "./PromptPanel";
import { SetupWizard } from "./SetupWizard";
import { UnlockSheet } from "./UnlockSheet";
import { CompletedView, mergeStudioPageTabs, type StudioPageRow } from "./CompletedView";
import { EmailGate } from "./EmailGate";
import { ThemeToggle } from "@/components/ThemeToggle";
import { APP_NAME } from "@/lib/config";
import type { PublicProject } from "@/lib/public-project";

type Me = {
  user: { email: string; membership: boolean; hostedLogin?: boolean; deployPlan?: boolean } | null;
  project: PublicProject | null;
  pages: StudioPageRow[];
  needsEmail?: boolean;
  resumeUrl?: string | null;
  guestEmail?: string | null;
};

export function StudioApp() {
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState("");
  const [unlock, setUnlock] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [openingPages, setOpeningPages] = useState(false);

  async function clearSession() {
    if (clearing) return;
    setClearing(true);
    const response = await fetch("/api/auth/logout", { method: "POST" });
    if (!response.ok) {
      setClearing(false);
      setError("Could not clear the session.");
      return;
    }
    window.location.assign("/studio");
  }

  const load = useCallback(async () => {
    const response = await fetch("/api/me");
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Could not open the studio.");
      return;
    }
    if (data.needsEmail || !data.project) {
      setMe({
        user: data.user,
        project: null,
        pages: [],
        needsEmail: true,
        resumeUrl: data.resumeUrl,
        guestEmail: data.guestEmail,
      });
      return;
    }
    const listed = (data.pages as StudioPageRow[] | undefined) ?? [];
    const current = {
      id: data.project.id,
      name: data.project.pageName,
      step: data.project.step,
      loginFeature: data.project.loginFeature,
      publishedSlug: data.project.publishedSlug,
    };
    setMe((prev) => ({
      user: data.user,
      project: data.project,
      pages: mergeStudioPageTabs(prev?.pages ?? [], listed, [current]),
      needsEmail: false,
      resumeUrl: data.resumeUrl,
      guestEmail: data.guestEmail,
    }));
  }, []);

  useEffect(() => {
    void (async () => {
      const token = new URLSearchParams(window.location.search).get("resume");
      if (token) {
        await fetch("/api/guest/resume", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        window.history.replaceState({}, "", "/studio");
      }
      await load();
    })();
  }, [load]);

  const completedPages = mergeStudioPageTabs(me?.pages ?? []).sort((a, b) =>
    (b.updatedAt || "").localeCompare(a.updatedAt || ""),
  );
  const showYourPages = !!me?.user?.membership && completedPages.length > 0;

  async function openYourPages() {
    if (openingPages || !me?.user?.membership) return;
    const target = completedPages.find((page) => page.id !== me.project?.id) ?? completedPages[0];
    if (!target) return;
    if (
      target.id === me.project?.id &&
      me.project.step === "complete" &&
      me.project.wizard === "done"
    ) {
      return;
    }
    setOpeningPages(true);
    const response = await fetch("/api/pages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: target.id, view: "complete" }),
    });
    setOpeningPages(false);
    if (!response.ok) {
      setError("Could not open your pages.");
      return;
    }
    await load();
  }

  if (!me) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <p className="serif text-2xl">Setting the press…</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between gap-3 border-b border-ink/10 bg-paper px-4 py-3 text-sm sm:px-5">
        <Link href="/" className="display text-lg">
          {APP_NAME}
        </Link>
        <div className="flex items-center gap-3 text-xs text-muted">
          <span className="hidden sm:inline">
            {me.user
              ? me.user.email
              : me.guestEmail
                ? `${me.guestEmail} · guest`
                : "Guest"}
            {me.user?.membership ? " · member" : ""}
          </span>
          <ThemeToggle />
          <button
            type="button"
            disabled={clearing}
            onClick={() => void clearSession()}
            className="text-ink disabled:opacity-40"
          >
            {clearing ? "Clearing…" : "Clear session"}
          </button>
          <Link href="/account" className="text-ink">
            Account
          </Link>
        </div>
      </header>
      {me.needsEmail || !me.project ? (
        <EmailGate onReady={() => load()} />
      ) : (
        <StudioStage
          project={me.project}
          pages={me.pages}
          error={error}
          signedIn={!!me.user}
          memberView={!!me.user?.membership}
          resumeUrl={me.resumeUrl}
          showYourPages={showYourPages}
          openingPages={openingPages}
          onYourPages={() => void openYourPages()}
          onProject={(project) =>
            setMe((current) =>
              current
                ? {
                    ...current,
                    project,
                    pages: mergeStudioPageTabs(current.pages, [
                      {
                        id: project.id,
                        name: project.pageName,
                        step: project.step,
                        loginFeature: project.loginFeature,
                        publishedSlug: project.publishedSlug,
                      },
                    ]),
                  }
                : current,
            )
          }
          onUnlock={() => setUnlock(true)}
          onAuth={() => load()}
          onRefresh={() => load()}
        />
      )}
      <UnlockSheet
        open={unlock}
        signedIn={!!me.user}
        onClose={() => setUnlock(false)}
        onRefresh={() => void load()}
      />
    </div>
  );
}

function StudioStage({
  project,
  pages,
  error,
  signedIn,
  memberView,
  resumeUrl,
  showYourPages,
  openingPages,
  onYourPages,
  onProject,
  onUnlock,
  onAuth,
  onRefresh,
}: {
  project: PublicProject;
  pages: StudioPageRow[];
  error: string;
  signedIn: boolean;
  memberView: boolean;
  resumeUrl?: string | null;
  showYourPages: boolean;
  openingPages: boolean;
  onYourPages: () => void;
  onProject: (project: PublicProject) => void;
  onUnlock: () => void;
  onAuth: () => Promise<void> | void;
  onRefresh: () => Promise<void> | void;
}) {
  const onStudio = project.wizard === "done";
  const [canAnimate, setCanAnimate] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const wizardSnapshot = useRef(project);

  if (project.wizard !== "done") {
    wizardSnapshot.current = project;
  }

  const wizardProject = wizardSnapshot.current;
  const showWizard = wizardProject.wizard !== "done";

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(motion.matches);
    const onChange = () => setReduceMotion(motion.matches);
    motion.addEventListener("change", onChange);
    const frame = requestAnimationFrame(() => setCanAnimate(true));
    return () => {
      motion.removeEventListener("change", onChange);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="min-h-0 flex-1 overflow-clip">
      <div
        className={`flex h-full ${
          canAnimate && !reduceMotion
            ? "transition-transform duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
            : ""
        }`}
        style={{ transform: onStudio ? "translateX(-100%)" : "translateX(0)" }}
      >
        <div
          className="flex h-full w-full shrink-0 flex-col"
          aria-hidden={onStudio}
          inert={onStudio}
        >
          {showWizard ? (
            <SetupWizard
              project={wizardProject}
              onProject={onProject}
              showYourPages={showYourPages}
              openingPages={openingPages}
              onYourPages={onYourPages}
            />
          ) : null}
        </div>
        <div
          className="flex h-full w-full shrink-0 flex-col sm:flex-row"
          aria-hidden={!onStudio}
          inert={!onStudio}
        >
          {project.step === "complete" ? (
            <CompletedView
              project={project}
              pages={pages}
              signedIn={signedIn}
              memberView={memberView}
              resumeUrl={resumeUrl}
              onProject={onProject}
              onUnlock={onUnlock}
              onAuth={onAuth}
              onRefresh={onRefresh}
            />
          ) : (
            <>
              <PromptPanel
                project={project}
                error={error}
                onProject={onProject}
                signedIn={signedIn}
                onAuth={onAuth}
                showYourPages={showYourPages}
                openingPages={openingPages}
                onYourPages={onYourPages}
              />
              <PreviewStage
                revision={project.previewRevision}
                locked={!project.entitlements.exportUnlocked}
                empty={!project.pattern}
                onUnlock={onUnlock}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
