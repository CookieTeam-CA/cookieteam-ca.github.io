"use client";

import { useEffect, useEffectEvent, useState } from "react";
import Link from "next/link";
import { EyeOff, Globe, LoaderCircle, LockKeyhole, Shield, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useTranslations } from "@/app/cookiecapes/i18n/client";
import type { MessageKey } from "@/app/cookiecapes/i18n/messages";
import { deleteCosmetic, editCosmetic, equipCosmetics, loadAccountCosmetics, setPlayerHidden } from "@/app/actions/cosmetic-actions";
import { actionValue } from "../lib/account-types";
import { COSMETIC_SLOTS, type AccountCosmetics, type CosmeticSlot, type CosmeticSummary } from "../lib/cosmetic-types";
import { privateCosmeticUrls } from "../lib/cosmetic-urls";
import CosmeticCard, { SLOT_LABELS } from "../components/CosmeticCard";
import CapeViewer from "../components/CapeViewer";

const STATUS_LABELS: Record<CosmeticSummary["status"], MessageKey> = { pending: "In review", approved: "Approved", rejected: "Rejected" };
const input = "min-h-11 w-full rounded-lg border border-white/10 bg-zinc-950 px-3 text-sm text-white outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/15 disabled:opacity-50";

function UploadForm({ uuid, disabled, onUploaded }: { uuid: string; disabled: boolean; onUploaded: () => void }) {
    const { t } = useTranslations();
    const [slot, setSlot] = useState<CosmeticSlot>("head");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    async function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const element = event.currentTarget;
        const form = new FormData(element);
        form.set("minecraft_name", uuid);
        form.set("shareable", form.get("shareable") === "on" ? "true" : "false");
        if (slot === "aura") {
            form.set("particles", JSON.stringify(Object.fromEntries(["rate", "lifetime", "size", "spread", "gravity", "vy", "emitter"]
                .map(key => [key, key === "emitter" ? form.get(key) : Number(form.get(key))]))));
        }
        setBusy(true);
        setError("");
        try {
            const response = await fetch("/api/cookiecapes/cosmetics", { method: "POST", body: form });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.error || t("Upload failed."));
            toast.add({ title: t("Cosmetic uploaded. Only you can see it until a moderator approves it."), type: "success" });
            element.reset();
            onUploaded();
        } catch (failure) {
            setError(failure instanceof Error ? failure.message : t("Upload failed."));
        } finally {
            setBusy(false);
        }
    }

    const number = (name: string, label: string, min: number, max: number, step: number, value: number) => (
        <label className="space-y-1 text-sm text-zinc-300">{label}
            <input name={name} type="number" min={min} max={max} step={step} defaultValue={value} className={input} disabled={busy || disabled} />
        </label>
    );

    return (
        <form onSubmit={submit} className="grid gap-4 rounded-2xl border border-border bg-card p-6 sm:grid-cols-2">
            <h3 className="font-bold sm:col-span-2">{t("Upload a cosmetic")}</h3>
            <label className="space-y-1 text-sm text-zinc-300">{t("Name")}
                <input name="name" required maxLength={48} className={input} disabled={busy || disabled} />
            </label>
            <label className="space-y-1 text-sm text-zinc-300">{t("Type")}
                <select name="slot" value={slot} onChange={event => setSlot(event.target.value as CosmeticSlot)} className={input} disabled={busy || disabled}>
                    {COSMETIC_SLOTS.map(value => <option key={value} value={value}>{t(SLOT_LABELS[value])}</option>)}
                </select>
            </label>
            {slot !== "aura" ? (
                <label className="space-y-1 text-sm text-zinc-300">{t("Blockbench model (.bbmodel)")}
                    <input name="model" type="file" accept=".bbmodel,application/json" required className={input + " py-2"} disabled={busy || disabled} />
                </label>
            ) : null}
            <label className="space-y-1 text-sm text-zinc-300">{slot === "aura" ? t("Particle sprite (PNG, GIF or WebP)") : t("Texture (optional, replaces the embedded texture; GIF/WebP animate)")}
                <input name="texture" type="file" accept="image/png,image/gif,image/webp" required={slot === "aura"} className={input + " py-2"} disabled={busy || disabled} />
            </label>
            {slot === "aura" && (
                <fieldset className="grid gap-3 sm:col-span-2 sm:grid-cols-4">
                    <legend className="mb-2 text-sm text-zinc-400">{t("Particle settings")}</legend>
                    {number("rate", t("Particles per second"), 0.5, 20, 0.5, 4)}
                    {number("lifetime", t("Lifetime (s)"), 0.2, 4, 0.1, 1.5)}
                    {number("size", t("Size (px)"), 1, 8, 0.5, 2)}
                    {number("spread", t("Spread (blocks)"), 0, 1.5, 0.1, 0.5)}
                    {number("vy", t("Rise speed"), -1, 1, 0.05, 0.2)}
                    {number("gravity", t("Gravity"), -1, 1, 0.05, 0)}
                    <label className="space-y-1 text-sm text-zinc-300">{t("Emitter")}
                        <select name="emitter" defaultValue="body" className={input} disabled={busy || disabled}>
                            <option value="feet">{t("Feet")}</option><option value="body">{t("Body")}</option><option value="head">{t("Head")}</option>
                        </select>
                    </label>
                </fieldset>
            )}
            <label className="flex items-center gap-2 text-sm text-zinc-300 sm:col-span-2">
                <input name="shareable" type="checkbox" className="size-4 accent-orange-500" disabled={busy || disabled} />
                {t("Allow other players to equip this cosmetic")}
            </label>
            <p className="text-xs leading-relaxed text-zinc-500 sm:col-span-2">
                {t("Only cubes are supported. Model the player standing at the origin facing north (−Z). Uploads count towards your daily limit and are reviewed by a moderator.")}
            </p>
            {error && <p role="alert" className="text-sm text-red-300 sm:col-span-2">{error}</p>}
            <Button type="submit" className="min-h-11 sm:col-span-2" disabled={busy || disabled}>
                {busy ? <LoaderCircle className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Upload aria-hidden="true" />}{busy ? t("Uploading…") : t("Upload")}
            </Button>
        </form>
    );
}

export default function CosmeticsPanel({ uuid, minecraftName, disabled }: { uuid: string; minecraftName?: string; disabled: boolean }) {
    const { t } = useTranslations();
    const [data, setData] = useState<AccountCosmetics | null>(null);
    const [busy, setBusy] = useState(false);
    const [refresh, setRefresh] = useState(0);
    const [target, setTarget] = useState("");

    const reportLoadError = useEffectEvent((error: unknown) => {
        toast.add({ title: error instanceof Error ? error.message : t("Cosmetics could not be loaded."), type: "error" });
    });

    useEffect(() => {
        let active = true;
        loadAccountCosmetics(uuid).then(result => { if (active) setData(actionValue(result)); })
            .catch(error => { if (active) reportLoadError(error); });
        return () => { active = false; };
    }, [uuid, refresh]);

    async function run<T>(action: () => Promise<T>, message?: string) {
        setBusy(true);
        try {
            const value = await action();
            if (message) toast.add({ title: message, type: "success" });
            return value;
        } catch (error) {
            toast.add({ title: error instanceof Error ? error.message : t("The request failed. Please try again."), type: "error" });
        } finally {
            setBusy(false);
        }
    }

    const equipped = data?.equipped ?? [];
    const equippedIds = new Set(equipped.map(cosmetic => cosmetic.cosmetic_id));

    function toggle(cosmetic: CosmeticSummary) {
        let next = equipped.filter(item => item.cosmetic_id !== cosmetic.cosmetic_id);
        if (!equippedIds.has(cosmetic.cosmetic_id)) {
            // One cosmetic per type: equipping replaces the current one of that type.
            next = next.filter(item => item.slot !== cosmetic.slot);
            if (next.length >= (data?.limit ?? 3)) {
                toast.add({ title: t("You can wear at most {count} cosmetics. Take one off first.", { count: data?.limit ?? 3 }), type: "error" });
                return;
            }
            next.push(cosmetic);
        }
        void run(async () => {
            const value = actionValue(await equipCosmetics(uuid, next.map(item => item.cosmetic_id)));
            setData(current => current && { ...current, equipped: value.equipped });
        });
    }

    const locked = disabled || busy || !data;
    return (
        <section aria-labelledby="cosmetics-title" className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h2 id="cosmetics-title" className="font-nexa text-2xl sm:text-3xl">{t("Cosmetics")}</h2>
                    <p className="mt-2 max-w-2xl text-sm text-zinc-400">{t("Wear up to three cosmetics at once, one per type. Your cape stays separate.")}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline" size="sm"><Link href="/cookiecapes/cosmetics">{t("Browse cosmetics")}</Link></Button>
                    {data?.moderator && <Button asChild variant="outline" size="sm"><Link href="/cookiecapes/admin/cosmetics"><Shield aria-hidden="true" />{t("Moderation")}</Link></Button>}
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
                <div className="relative h-96 overflow-hidden rounded-2xl border border-border bg-card" role="group" aria-label={t("Preview of your equipped cosmetics")}>
                    <CapeViewer minecraftName={minecraftName} cosmetics={equipped.map(privateCosmeticUrls)} animation="idle" />
                    <ul className="pointer-events-none absolute top-4 left-4 flex flex-col gap-1 text-xs">
                        {equipped.map(item => <li key={item.cosmetic_id} className="rounded-lg border border-white/10 bg-black/50 px-2 py-1 text-zinc-300">{t(SLOT_LABELS[item.slot])}: {item.name}</li>)}
                    </ul>
                </div>
                <UploadForm uuid={uuid} disabled={locked} onUploaded={() => setRefresh(value => value + 1)} />
            </div>

            {data && (data.owned.length ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                    {data.owned.map(cosmetic => {
                        const worn = equippedIds.has(cosmetic.cosmetic_id);
                        return (
                            <CosmeticCard key={cosmetic.cosmetic_id} cosmetic={privateCosmeticUrls(cosmetic)}>
                                <p className={`text-xs ${cosmetic.status === "rejected" ? "text-red-300" : cosmetic.status === "pending" ? "text-orange-300" : "text-emerald-300"}`}>{t(STATUS_LABELS[cosmetic.status])}</p>
                                <div className="mt-2 grid gap-2">
                                    <Button size="sm" variant={worn ? "default" : "outline"} disabled={locked || cosmetic.status === "rejected"} aria-pressed={worn} onClick={() => toggle(cosmetic)}>{worn ? t("Take off") : t("Wear")}</Button>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button size="sm" variant="outline" disabled={locked} title={cosmetic.shareable ? t("Only I can wear it") : t("Others can wear it")}
                                            onClick={() => run(async () => { actionValue(await editCosmetic(cosmetic.cosmetic_id, { shareable: !cosmetic.shareable })); setRefresh(value => value + 1); }, t("Cosmetic updated."))}>
                                            {cosmetic.shareable ? <Globe aria-hidden="true" /> : <LockKeyhole aria-hidden="true" />}<span className="sr-only">{cosmetic.shareable ? t("Only I can wear it") : t("Others can wear it")}</span>
                                        </Button>
                                        <Button size="sm" variant="destructive" disabled={locked}
                                            onClick={() => { if (window.confirm(t("Delete this cosmetic? It is taken off from everyone."))) void run(async () => { actionValue(await deleteCosmetic(cosmetic.cosmetic_id)); setRefresh(value => value + 1); }, t("Cosmetic deleted.")); }}>
                                            <Trash2 aria-hidden="true" /><span className="sr-only">{t("Delete")}</span>
                                        </Button>
                                    </div>
                                </div>
                            </CosmeticCard>
                        );
                    })}
                </div>
            ) : <div className="rounded-2xl border border-dashed border-white/15 py-10 text-center text-sm text-zinc-400">{t("You have not uploaded any cosmetics yet. Equip shared cosmetics from the gallery or upload your own.")}</div>)}

            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                <div>
                    <h3 className="font-bold flex items-center gap-2"><EyeOff size={18} aria-hidden="true" />{t("Hidden players")}</h3>
                    <p className="mt-1 text-sm text-zinc-400">{t("You will not see the cosmetics of these players in the mod. The list is shared by all your linked Minecraft accounts.")}</p>
                </div>
                <form className="flex flex-col gap-2 sm:flex-row" onSubmit={event => {
                    event.preventDefault();
                    if (!target.trim()) return;
                    void run(async () => {
                        const value = actionValue(await setPlayerHidden(uuid, target, true));
                        setData(current => current && { ...current, hidden_players: value.hidden_players });
                        setTarget("");
                    }, t("Player hidden."));
                }}>
                    <label htmlFor="hide-player" className="sr-only">{t("Minecraft name or UUID")}</label>
                    <input id="hide-player" value={target} onChange={event => setTarget(event.target.value)} placeholder={t("Minecraft name or UUID")} maxLength={36} className={input} disabled={locked} />
                    <Button type="submit" className="min-h-11" disabled={locked || !target.trim()}>{t("Hide")}</Button>
                </form>
                {data && (data.hidden_players.length ? (
                    <ul className="flex flex-wrap gap-2">
                        {data.hidden_players.map(player => (
                            <li key={player} className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/30 py-1 pl-3 pr-1 text-xs text-zinc-300">
                                <span className="font-mono">{player}</span>
                                <button type="button" disabled={locked} aria-label={t("Show cosmetics of {name} again", { name: player })} className="rounded-full p-1 hover:bg-white/10"
                                    onClick={() => run(async () => {
                                        const value = actionValue(await setPlayerHidden(uuid, player, false));
                                        setData(current => current && { ...current, hidden_players: value.hidden_players });
                                    })}><X size={14} aria-hidden="true" /></button>
                            </li>
                        ))}
                    </ul>
                ) : <p className="text-sm text-zinc-500">{t("No hidden players.")}</p>)}
            </div>
        </section>
    );
}
