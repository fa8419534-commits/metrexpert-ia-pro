from pathlib import Path

root = Path('/home/ubuntu/metrexpert-ia-pro')

# Schema
p = root/'drizzle/schema.ts'
s = p.read_text()
s = s.replace('  lastWhatsAppContactAt: timestamp("lastWhatsAppContactAt"),\n  updatedAt:', '  lastWhatsAppContactAt: timestamp("lastWhatsAppContactAt"),\n  consentedAt: timestamp("consentedAt"),\n  unsubscribedAt: timestamp("unsubscribedAt"),\n  updatedAt:')
p.write_text(s)

# Security types and persistence
p = root/'server/security.ts'
s = p.read_text()
s = s.replace('lastWhatsAppContactAt: Date | null; updatedAt: Date };', 'lastWhatsAppContactAt: Date | null; consentedAt: Date | null; unsubscribedAt: Date | null; updatedAt: Date };')
s = s.replace('export async function reserveFreeTrial(\n  clientName: string | undefined,\n  phoneInput: string | undefined,\n  emailInput: string | undefined,\n): Promise<FreeTrialReservation> {', 'export async function reserveFreeTrial(\n  clientName: string | undefined,\n  phoneInput: string | undefined,\n  emailInput: string | undefined,\n  consentedAt = new Date(),\n): Promise<FreeTrialReservation> {')
s = s.replace('const contactConditions = [phoneHash ? eq(freeTrialContacts.phoneHash, phoneHash) : undefined, emailHash ? eq(freeTrialContacts.emailHash, emailHash) : undefined, phone ? eq(freeTrialContacts.phone, phone) : undefined, email ? eq(freeTrialContacts.email, email) : undefined].filter((condition): condition is NonNullable<typeof condition> => Boolean(condition));', 'const contactConditions = [phoneHash ? eq(freeTrialContacts.phoneHash, phoneHash) : undefined, emailHash ? eq(freeTrialContacts.emailHash, emailHash) : undefined, phone ? eq(freeTrialContacts.phone, phone) : undefined, email ? eq(freeTrialContacts.email, email) : undefined].filter((condition): condition is NonNullable<typeof condition> => Boolean(condition));')
s = s.replace('db.insert(freeTrialContacts).values({ clientName: clientName || null, phone: phone || null, phoneHash: phoneHash || null, email: email || null, emailHash: emailHash || null })', 'db.insert(freeTrialContacts).values({ clientName: clientName || null, phone: phone || null, phoneHash: phoneHash || null, email: email || null, emailHash: emailHash || null, consentedAt })')
s = s.replace('const contact = { id: nextMemoryFreeTrialId++, clientName: clientName || null, phone: phone || null, phoneHash: phoneHash || null, email: email || null, emailHash: emailHash || null, trialAt: now, convertedAt: null, lastWhatsAppContactAt: null, updatedAt: now };', 'const contact = { id: nextMemoryFreeTrialId++, clientName: clientName || null, phone: phone || null, phoneHash: phoneHash || null, email: email || null, emailHash: emailHash || null, trialAt: now, convertedAt: null, lastWhatsAppContactAt: null, consentedAt, unsubscribedAt: null, updatedAt: now };')
s = s.replace('lastWhatsAppContactAt: record.lastWhatsAppContactAt }));', 'lastWhatsAppContactAt: record.lastWhatsAppContactAt, consentedAt: record.consentedAt, unsubscribedAt: record.unsubscribedAt }));')
s += '''\nexport async function unsubscribeFreeTrialContact(phoneInput?: string, emailInput?: string) {\n  const phone = normalizeTrialPhone(phoneInput);\n  const email = normalizeTrialEmail(emailInput);\n  const phoneHash = phone ? hashTrialContact(phone) : undefined;\n  const emailHash = email ? hashTrialContact(email) : undefined;\n  if (!phoneHash && !emailHash) throw new Error("Un renseignez un téléphone ou un e-mail.");\n  const now = new Date();\n  const db = isTestRuntime || forceMemoryForTests ? null : await getDb();\n  const conditions = [phoneHash ? eq(freeTrialContacts.phoneHash, phoneHash) : undefined, emailHash ? eq(freeTrialContacts.emailHash, emailHash) : undefined].filter((condition): condition is NonNullable<typeof condition> => Boolean(condition));\n  if (db) {\n    const result = await db.update(freeTrialContacts).set({ unsubscribedAt: now }).where(conditions.length === 1 ? conditions[0] : or(...conditions));\n    return { updated: Number(result[0]?.affectedRows ?? 0) > 0 };\n  }\n  const records = Array.from(memoryFreeTrialContacts.values()).filter((record) => (phoneHash && record.phoneHash === phoneHash) || (emailHash && record.emailHash === emailHash));\n  records.forEach((record) => { record.unsubscribedAt = now; record.updatedAt = now; });\n  return { updated: records.length > 0 };\n}\n\nexport async function markFreeTrialUnsubscribed(id: number) {\n  const now = new Date();\n  const db = isTestRuntime || forceMemoryForTests ? null : await getDb();\n  if (db) { await db.update(freeTrialContacts).set({ unsubscribedAt: now }).where(eq(freeTrialContacts.id, id)); return; }\n  const record = memoryFreeTrialContacts.get(id);\n  if (record) { record.unsubscribedAt = now; record.updatedAt = now; }\n}\n'''
p.write_text(s)

# Router
p = root/'server/routers.ts'
s = p.read_text()
s = s.replace('markFreeTrialConverted, markFreeTrialWhatsAppContacted,', 'markFreeTrialConverted, markFreeTrialWhatsAppContacted, markFreeTrialUnsubscribed, unsubscribeFreeTrialContact,')
s = s.replace('  trialEmail: z.string().trim().max(160).optional(),', '  trialEmail: z.string().trim().max(160).optional(),\n  trialConsent: z.literal(true).optional(),')
s = s.replace('adminMarkFreeTrialConverted: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => markFreeTrialConverted(input.id).then(() => ({ success: true as const }))),', 'adminMarkFreeTrialConverted: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => markFreeTrialConverted(input.id).then(() => ({ success: true as const }))),\n    adminMarkFreeTrialUnsubscribed: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => markFreeTrialUnsubscribed(input.id).then(() => ({ success: true as const }))),')
s = s.replace('  }),\n  auth: router({', '    requestUnsubscribe: publicProcedure.input(z.object({ phone: z.string().trim().max(32).optional(), email: z.string().trim().max(160).optional() })).mutation(({ input }) => unsubscribeFreeTrialContact(input.phone, input.email)),\n  }),\n  auth: router({')
s = s.replace('if (!input.trialPhone?.trim() && !input.trialEmail?.trim()) throw new TRPCError({ code: "BAD_REQUEST", message: "Renseignez votre téléphone ou votre e-mail pour utiliser l’essai gratuit." });', 'if (!input.trialPhone?.trim() && !input.trialEmail?.trim()) throw new TRPCError({ code: "BAD_REQUEST", message: "Renseignez votre téléphone ou votre e-mail pour utiliser l’essai gratuit." });\n          if (input.trialConsent !== true) throw new TRPCError({ code: "BAD_REQUEST", message: "Votre consentement est requis pour enregistrer vos coordonnées d’essai gratuit." });')
s = s.replace('reserveFreeTrial(extractTrialClientName(input.description), input.trialPhone, input.trialEmail)', 'reserveFreeTrial(extractTrialClientName(input.description), input.trialPhone, input.trialEmail, new Date())')
p.write_text(s)

# Shared theme utility
p = root/'client/src/components/ThemeToggle.tsx'
p.write_text('''import { Moon, Sun } from "lucide-react";\nimport { useTheme } from "@/contexts/ThemeContext";\n\nexport default function ThemeToggle() {\n  const { theme, toggleTheme } = useTheme();\n  if (!toggleTheme) return null;\n  return <button type="button" onClick={toggleTheme} className="theme-toggle" aria-label={`Activer le mode ${theme === "light" ? "sombre" : "clair"}`}>{theme === "light" ? <Moon className="h-4 w-4" aria-hidden="true" /> : <Sun className="h-4 w-4" aria-hidden="true" />}<span>{theme === "light" ? "Sombre" : "Clair"}</span></button>;\n}\n''')

# Home: consent state, payload, checkbox, theme root and Excel notice
p = root/'client/src/pages/Home.tsx'
s = p.read_text()
s = s.replace('import { toast } from "sonner";', 'import { toast } from "sonner";\nimport ThemeToggle from "@/components/ThemeToggle";')
s = s.replace('  const [trialEmail, setTrialEmail] = useState("");', '  const [trialEmail, setTrialEmail] = useState("");\n  const [trialConsent, setTrialConsent] = useState(false);')
s = s.replace('        trialEmail: trialEmail.trim() || undefined,', '        trialEmail: trialEmail.trim() || undefined,\n        trialConsent: trialConsent || undefined,')
s = s.replace('<main className="min-h-screen', '<main className="internal-page min-h-screen', 1)
s = s.replace('<p className="repere">PROTECTION', '<div className="mb-4 flex justify-end"><ThemeToggle /></div><p className="repere">PROTECTION', 1)
s = s.replace('</div></div>\n              <div className="mt-4 grid', '</div><label className="mt-4 flex items-start gap-3 text-xs leading-5 text-[#AEB7B0]"><input type="checkbox" checked={trialConsent} onChange={(event) => setTrialConsent(event.target.checked)} className="mt-1 accent-[#C9A15A]" />J’accepte que MÉTREXPERT IA PRO conserve mes coordonnées pour traiter cet essai et me recontacter au sujet du service. Je peux me désinscrire à tout moment depuis l’accueil.</label></div>\n              <div className="mt-4 grid', 1)
s = s.replace('{download && !generate.isPending && <div className="result-download', '{download && !generate.isPending && <><div className="excel-compatibility-notice" role="note"><strong>Compatibilité Excel Desktop.</strong> Le classeur est généré au format XLSX standard avec formules natives. Ouvrez-le de préférence dans Microsoft Excel Desktop et utilisez « Activer la modification » si Excel affiche un avertissement de sécurité. Les hypothèses et contrôles restent à relire.</div><div className="result-download')
s = s.replace('</div>}\n            </div>', '</div></>}\n            </div>', 1)
p.write_text(s)

# Admin: theme toggle, unsubscribe status/action, hide relaunch for unsubscribed
p = root/'client/src/pages/Admin.tsx'
s = p.read_text()
s = s.replace('import { toast } from "sonner";', 'import { toast } from "sonner";\nimport ThemeToggle from "@/components/ThemeToggle";')
s = s.replace('<main className="min-h-screen bg-[#0F1613]', '<main className="internal-page min-h-screen bg-[#0F1613]', 2)
s = s.replace('<header className="mb-8 border-b', '<div className="mb-4 flex justify-end"><ThemeToggle /></div><header className="mb-8 border-b', 1)
s = s.replace('const markTrialConverted = trpc.adminMarkFreeTrialConverted.useMutation', 'const markTrialUnsubscribed = trpc.adminMarkFreeTrialUnsubscribed.useMutation({ onSuccess: () => void trials.refetch() });\n  const markTrialConverted = trpc.adminMarkFreeTrialConverted.useMutation') if 'const markTrialConverted = trpc.adminMarkFreeTrialConverted.useMutation' in s else s
s = s.replace('trial.lastWhatsAppContactAt ? new Date(trial.lastWhatsAppContactAt).toLocaleDateString("fr-FR") : "Jamais"}</td>', 'trial.unsubscribedAt ? "Désinscrit" : trial.lastWhatsAppContactAt ? new Date(trial.lastWhatsAppContactAt).toLocaleDateString("fr-FR") : "Jamais"}</td>')
s = s.replace('trial.phone !== "À compléter" && <a href={buildWhatsAppUrl', 'trial.phone !== "À compléter" && !trial.unsubscribedAt && <a href={buildWhatsAppUrl')
s = s.replace('{!trial.convertedAt && <Button', '{!trial.convertedAt && !trial.unsubscribedAt && <Button')
s = s.replace('</td></tr>)}</tbody>', '<Button type="button" variant="outline" size="sm" className="border-[#9d554b] text-[#d98472]" onClick={() => markTrialUnsubscribed.mutate({ id: trial.id })} disabled={markTrialUnsubscribed.isPending}>{trial.unsubscribedAt ? "Désinscrit" : "Désinscrire"}</Button></td></tr>)}</tbody>')
p.write_text(s)

# Landing: unsubscribe form and theme wrapper class
p = root/'client/src/pages/Landing.tsx'
s = p.read_text()
s = s.replace('import { toast } from "sonner";', 'import { toast } from "sonner";')
# add hooks/state if not already present
if 'requestUnsubscribe' not in s:
    s = s.replace('export default function Landing() {', 'export default function Landing() {\n  const unsubscribe = trpc.requestUnsubscribe.useMutation();\n  const [unsubscribeContact, setUnsubscribeContact] = useState("");\n  const [unsubscribeMessage, setUnsubscribeMessage] = useState("");')
    s = s.replace('<footer className="border-t', '<section id="desinscription" className="border-t border-[#CBD0C8] bg-[#F4F0E8] py-10"><div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12"><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#A8792F]">Gestion de vos coordonnées</p><div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end"><label className="flex-1 text-sm text-[#526159]">Téléphone ou e-mail<input value={unsubscribeContact} onChange={(event) => setUnsubscribeContact(event.target.value)} className="mt-2 h-11 w-full border border-[#B9C0B8] bg-transparent px-3" placeholder="+225… ou vous@exemple.ci" /></label><button type="button" onClick={() => { const value = unsubscribeContact.trim(); const isEmail = value.includes("@"); unsubscribe.mutate(isEmail ? { email: value } : { phone: value }, { onSuccess: (result) => setUnsubscribeMessage(result.updated ? "Votre demande de désinscription a été enregistrée." : "Aucun contact correspondant n’a été trouvé."), onError: () => setUnsubscribeMessage("Vérifiez le téléphone ou l’e-mail renseigné.") }); }} disabled={!unsubscribeContact.trim() || unsubscribe.isPending} className="h-11 border border-[#17221D] px-4 font-mono text-[10px] uppercase">{unsubscribe.isPending ? "Traitement…" : "Me désinscrire"}</button></div>{unsubscribeMessage && <p className="mt-3 text-sm text-[#526159]" role="status">{unsubscribeMessage}</p>}</div></section>\n      <footer className="border-t')
p.write_text(s)
'''}_saved = True
