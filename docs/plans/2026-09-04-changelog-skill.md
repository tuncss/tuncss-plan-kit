# Changelog Skill — Implementation Plan

<!-- EXECUTION CONTRACT — read before touching any task -->
> When the user asks for a specific task (e.g. "do TASK-03"):
> 1. Read **only** that task's block. Do not preview other tasks.
> 2. Stay strictly inside its **Targets** — do not edit files outside that list.
> 3. Follow the **Implementation Notes**; do not invent extra scope.
> 4. When **Done When** and **Verification** are satisfied, **stop and report**. Wait for approval before moving to the next task.
> 5. If verification fails, report the failure and stop. Do not attempt fixes outside the task's Targets.

**Goal:** tuncss-plan-kit'e dördüncü bir skill eklemek — plan task'ı bittiğinde `docs/CHANGELOG.md` dosyasına yapılan işin özünü anlatan kısa, somut girişler yazan `changelog` skill'i.

**Architecture:** Kit saf talimattan oluşur; tetikleme de talimatla yapılır. `plan-universal`'ın ürettiği execution contract 5 maddeden 6'ya çıkar ve 6. madde ajanı `changelog` skill'ine yönlendirir. Skill giriş formatını tek kaynakta tutar, böylece format her plan dosyasında tekrarlanmaz. `bin/cli.js` skill'i ve iki wrapper'ı kurar, ayrıca `.gitattributes`'a `merge=union` satırını ekleyerek üç kişilik ekipte çakışmaları önler.

**Tech / dependencies:** Node.js >= 18, ES modules. Yeni bağımlılık yok. `bin/cli.js` yalnız `fs`, `path`, `os`, `child_process` kullanır ve bu değişmez.

**File map:**
- `skills/changelog/SKILL.md` — yeni skill: giriş formatı, madde yazım kuralları, dosyaya ekleme kuralı, plan dışı akış
- `commands/codex/changelog.md` — Codex slash wrapper
- `commands/opencode/changelog.md` — OpenCode slash wrapper
- `.opencode/plugins/tuncss-plan-kit.js` — OpenCode global kurulumu için komut tanımı
- `skills/plan-universal/SKILL.md` — ürettiği execution contract 5 → 6 madde
- `skills/handoff-plan/SKILL.md` — ürettiği briefing'deki kural listesi 5 → 6 madde
- `bin/cli.js` — `SKILLS`/`COMMANDS` dizileri + `.gitattributes` yazıcı
- `templates/instructions-block.md` — CLAUDE.md/AGENTS.md bloğuna `/changelog` satırı
- `README.md` — komut listesi, workflow şeması, contract açıklaması
- `package.json` — sürüm 0.1.1 → 0.2.0

---

### TASK-01: changelog skill dosyası

**Targets:**
- `skills/changelog/SKILL.md` (create)

**Model Tier:** T3

**Implementation Notes:**

Kitin dördüncü skill'i. Diğer üç SKILL.md gibi İngilizce yazılır ve aynı yapıyı izler: YAML frontmatter, `#` başlık, kısa amaç cümlesi, ardından bölümler.

Dosyanın tamamı aşağıdaki gibidir. Frontmatter'daki `description` skill'in otomatik çağrılmasını tetikleyen alandır; birebir korunmalıdır.

````markdown
---
name: changelog
description: Use when a plan task has just been completed, or when the user runs /changelog, to append a short entry describing what actually changed to docs/CHANGELOG.md.
---

# Changelog

Append a short, concrete record of what changed to `docs/CHANGELOG.md`. The reader is a teammate who did not do the work and wants to know what is different now. Commit messages already failed at this — do not write another one.

**Announce at start:** "Writing the changelog entry."

## Two ways in

**From a completed plan task.** Rule 6 of the plan's execution contract sends you here once Done When and Verification are satisfied. You have the task id, the task name, and the plan path.

**From `/changelog`.** The user invoked it directly for work done outside the plan flow. There is no task id and no plan path.

If a task's verification failed, do not write an entry at all. That work is usually not merged, and recording it would put a change that did not happen into the log.

## Gather the facts first

Run these before writing anything. Never write an entry from memory of what you set out to do — write it from what actually landed.

- `git diff` and `git diff --staged` — the real change
- `git config user.name` — the author name

The diff is your source, not your content: it tells you what to write about, and none of it is copied into the entry.

If both diffs are empty and nothing was just committed for this work, stop and tell the user there is nothing to record.

## How to write the bullets

This is the whole skill. Everything else is placement.

1. Every bullet names the thing that changed.
2. If a value changed, give **old → new**.
3. Banned: any phrasing that does not say what became what. "Improved", "refactored", "fixed issues", "optimized", "cleaned up", "enhanced" — and their equivalents in any language.
4. One to five bullets per entry. If you need more than five, say so in your report to the user: the task was too large. Write the entry anyway.
5. Write in the language the repository uses. This skill is in English; the entries it produces are not necessarily.

Good:
- `Read threshold lowered from -60 dB to -80 dB`
- `Token validation moved out of every handler into a single requireAuth middleware`
- `Session lifetime cut from 24 hours to 2 hours`

Bad:
- `Improved bluetooth reliability` — what became what?
- `Refactored auth` — same.
- `Various fixes` — same.

## Entry shape

For a plan task:

```markdown
### <task name> — TASK-NN · <author> · [plan](<plan path>)
- <bullet>
- <bullet>
```

For off-plan work:

```markdown
### <short name> — off-plan · <author>
- <bullet>
```

The `off-plan` label is written in the repository's language, like the bullets.

If `git config user.name` is empty, drop both the author and the `·` that separates it. Never invent a name.

## Where it goes

The file is `docs/CHANGELOG.md`. Create it if missing, with `# Changelog` as the first line.

Entries are grouped under date headings, newest first:

```markdown
# Changelog

## 2026-09-04

### Auth middleware — TASK-03 · Mustafa TUNÇ · [plan](docs/plans/2026-09-02-auth.md)
- Token validation moved out of every handler into a single requireAuth middleware
- Response on an invalid token changed from 200 with an empty body to 401
```

Placement rule — follow it exactly, so that three people's agents do not grow the file from three different places:

- If today's date heading already exists, append the entry at the end of that section.
- If it does not, insert a new date heading immediately after the `# Changelog` line.

## Do not commit

Leave the entry in the working tree next to the change. Whoever commits the work commits the entry with it, so `git log -p docs/CHANGELOG.md` always pairs a line with the change that produced it.
````

**Done When:**
- `skills/changelog/SKILL.md` mevcut ve YAML frontmatter'ında `name: changelog` ile yukarıdaki `description` satırı birebir yer alıyor
- Dosya şu altı bölümü içeriyor: "Two ways in", "Gather the facts first", "How to write the bullets", "Entry shape", "Where it goes", "Do not commit"
- Yasak ifade listesi ve iyi/kötü madde örnekleri dosyada mevcut
- Başarısız doğrulamada giriş yazılmayacağı açıkça belirtiliyor

**Verification:**
- Manual: `head -5 skills/changelog/SKILL.md` → `---`, `name: changelog`, `description: Use when a plan task...` satırlarını göstermeli
- Manual: `grep -c "^## [A-Z]" skills/changelog/SKILL.md` → `6` dönmeli (düz `^## ` kullanmayın: "Where it goes" bölümündeki örnek blokta `## 2026-09-04` tarih başlığı geçer ve sayımı şişirir)
- Manual: `grep -n "merge=union" skills/changelog/SKILL.md` → hiçbir şey dönmemeli (`.gitattributes` kurulumun işi, skill'in değil)

---

### TASK-02: slash wrapper'lar ve OpenCode plugin girdisi

**Targets:**
- `commands/codex/changelog.md` (create)
- `commands/opencode/changelog.md` (create)
- `.opencode/plugins/tuncss-plan-kit.js` (modify)

**Model Tier:** T1

**Implementation Notes:**

Kit üç platformda aynı slash komut deneyimini vermek için var. Claude Code skill adını otomatik `/changelog` yapar; Codex ve OpenCode yapmaz, bu yüzden wrapper dosyaları gerekir.

`commands/codex/changelog.md` — diğer üç codex wrapper'ıyla birebir aynı kalıp, tek satır, frontmatter yok:

```
Use the `changelog` skill to handle the user's request.
```

`commands/opencode/changelog.md` — diğer üç opencode wrapper'ıyla aynı kalıp:

```markdown
---
description: Record what changed in docs/CHANGELOG.md
---

$ARGUMENTS
```

`.opencode/plugins/tuncss-plan-kit.js` içinde `WRAPPERS` nesnesi var; `handoff-plan` girdisinden sonra dördüncüsü eklenir. Mevcut girdiler `{ description, template }` alanlarını taşır ve `template` yalnızca `"$ARGUMENTS\n"` değerindedir — bu kalıp korunur:

```js
  changelog: {
    description: "Record what changed in docs/CHANGELOG.md",
    template: "$ARGUMENTS\n",
  },
```

Dosyadaki başka hiçbir şeye dokunulmaz; `skillsDir` zaten `skills/` klasörünün tamamını `config.skills.paths`'e eklediği için yeni skill kendiliğinden bulunur.

**Done When:**
- `commands/codex/changelog.md` tek satırdan oluşuyor ve `changelog` skill'ine atıf yapıyor
- `commands/opencode/changelog.md` `description` frontmatter'ı ve `$ARGUMENTS` gövdesi taşıyor
- `.opencode/plugins/tuncss-plan-kit.js` içindeki `WRAPPERS` nesnesi dört anahtar içeriyor: `brainstorm`, `plan-universal`, `handoff-plan`, `changelog`
- Plugin dosyası hâlâ geçerli ES modülü

**Verification:**
- Manual: `node --check .opencode/plugins/tuncss-plan-kit.js` → hata vermemeli
- Manual: `node -e "import('./.opencode/plugins/tuncss-plan-kit.js').then(async m => { const c = {}; await (await m.TuncssPlanKitPlugin()).config(c); console.log(Object.keys(c.command).join(',')) })"` → `brainstorm,plan-universal,handoff-plan,changelog` yazmalı
- Manual: `cat commands/codex/changelog.md` → tek satır göstermeli

---

### TASK-03: execution contract 5 → 6 madde

**Targets:**
- `skills/plan-universal/SKILL.md` (modify)
- `skills/handoff-plan/SKILL.md` (modify)

**Model Tier:** T2

**Implementation Notes:**

İki skill de yürütücü ajana verilen kural listesini üretir ve ikisi birlikte değişmek zorundadır: yalnız `plan-universal` güncellenirse başka bir ajana devredilen iş kayıt dışı kalır ve changelog yalnız Claude Code'da yapılan işi gösterir.

Altıncı madde **sıralı bir adım değil, tanım maddesidir**. 4. madde ona referans verir. Bu önemli: 4 ve 5 zaten "stop and report" ile bitiyor, arkalarına eklenen bir adım "durduktan sonra yaz" diye okunurdu.

`skills/plan-universal/SKILL.md` içinde "Plan document structure" bölümündeki markdown blokta bulunan mevcut 5 maddelik alıntı bloğu şununla değiştirilir:

```markdown
> 1. Read **only** that task's block. Do not preview other tasks.
> 2. Stay strictly inside its **Targets** — do not edit files outside that list.
> 3. Follow the **Implementation Notes**; do not invent extra scope.
> 4. When **Done When** and **Verification** are satisfied, write the changelog entry (rule 6), then **stop and report**. Wait for approval before moving to the next task.
> 5. If verification fails, report the failure and stop. Do not attempt fixes outside the task's Targets, and do not write a changelog entry.
> 6. **Changelog entry:** use the `changelog` skill to append this task's entry to `docs/CHANGELOG.md`. Base it on the actual diff, not on what you set out to do.
```

`skills/handoff-plan/SKILL.md` içinde "Message template" bölümündeki `**How to execute...**` başlığı altındaki 5 maddelik numaralı liste 6'ya çıkarılır. Bu liste alıntı bloğu değil düz numaralı listedir, `>` öneki almaz:

```markdown
1. When I ask for a task ("do TASK-03"), read **only** that task's block in the plan.
2. Stay strictly inside its **Targets** — don't edit files outside that list.
3. Follow the **Implementation Notes**; don't invent extra scope.
4. When **Done When** and **Verification** are satisfied, write the changelog entry (rule 6), then **stop and report**. Wait for my approval before moving on.
5. If verification fails, report and stop. Don't attempt fixes outside the task's Targets, and don't write a changelog entry.
6. **Changelog entry:** use the `changelog` skill to append this task's entry to `docs/CHANGELOG.md`. Base it on the actual diff, not on what you set out to do.
```

Aynı dosyanın "Rules" bölümündeki `Don't reformat the execution contract beyond the 5 numbered rules above` cümlesinde `5` → `6` yapılır.

Bu planın kendi başlığındaki contract'a **dokunulmaz**; o 5 maddeli kalır, çünkü `changelog` skill'i bu plan yürütülürken TASK-01'e kadar mevcut değildi.

**Done When:**
- `skills/plan-universal/SKILL.md` içindeki contract bloğu 6 madde içeriyor ve 6. madde `changelog` skill'ine adıyla atıf yapıyor
- Aynı bloğun 5. maddesi başarısız doğrulamada giriş yazılmayacağını söylüyor
- `skills/handoff-plan/SKILL.md` içindeki briefing kural listesi 6 madde içeriyor
- `skills/handoff-plan/SKILL.md` "Rules" bölümü artık "6 numbered rules" diyor

**Verification:**
- Manual: `grep -c "^> [0-9]\." skills/plan-universal/SKILL.md` → `6` dönmeli
- Manual: `grep -n "changelog" skills/plan-universal/SKILL.md skills/handoff-plan/SKILL.md` → her iki dosyada da eşleşme dönmeli
- Manual: `grep -n "6 numbered rules" skills/handoff-plan/SKILL.md` → bir satır dönmeli

---

### TASK-04: CLI kurulumu ve .gitattributes

**Targets:**
- `bin/cli.js` (modify)

**Model Tier:** T2

**Implementation Notes:**

İki tür değişiklik var: dizilere yeni skill adını eklemek, ve `.gitattributes` için yeni bir yazma biçimi eklemek.

**1. Diziler.** Dosyanın başındaki iki sabit dördüncü elemanı alır. Sıra kullanıcıya basılan çıktıyı belirler; `changelog` sona eklenir:

```js
const SKILLS = ["brainstorm", "plan-universal", "handoff-plan", "changelog"];
const COMMANDS = ["brainstorm", "plan-universal", "handoff-plan", "changelog"];
```

**2. `.gitattributes` yazıcısı.** CLI bugün iki yazma biçimi tanıyor: `copyFile` (dosya kopyalama) ve `upsertMarkerBlock` (işaretçi bloğu güncelleme). Bu üçüncüsü. Mevcut `upsertMarkerBlock` fonksiyonunun hemen ardına eklenir ve dosyada zaten tanımlı olan `exists()` ile `ensureDir()` yardımcılarını kullanır:

```js
const GITATTRIBUTES_LINE = "docs/CHANGELOG.md merge=union";

function ensureGitattributes(baseRoot) {
  const filePath = path.join(baseRoot, ".gitattributes");
  let existing = "";
  if (exists(filePath)) existing = fs.readFileSync(filePath, "utf8");
  if (existing.split(/\r?\n/).some((l) => l.trim() === GITATTRIBUTES_LINE)) {
    return { status: "unchanged", dest: filePath };
  }
  const sep = existing.length === 0 || existing.endsWith("\n") ? "" : "\n";
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, existing + sep + GITATTRIBUTES_LINE + "\n");
  return { status: existing.length === 0 ? "written" : "updated", dest: filePath };
}
```

Satırın amacı: üç kişi ayrı branch'lerde `docs/CHANGELOG.md`'ye giriş eklediğinde git iki tarafı da korusun, elle çözülecek çakışma çıkmasın.

**3. Çağrı yeri.** `init()` fonksiyonunda platform döngüsünün **dışında**, döngü bittikten sonra bir kez çağrılır — her platform için tekrar çağrılırsa aynı iş üç kez yapılır. Yalnız proje kapsamlı kurulumda çalışır; `--global` kurulumda ortada depo yoktur. `console.log("Done. Restart your coding agent(s)...")` satırından önce:

```js
  if (!args.global) {
    const r = ensureGitattributes(cwd);
    console.log(`[git]`);
    console.log(`  ${statusTag(r.status)} .gitattributes (${GITATTRIBUTES_LINE})`);
    console.log("");
  }
```

`statusTag(status)` dosyada zaten tanımlıdır ve `"unchanged"` için `·`, `"updated"` için `↻`, diğerleri için `✓` döndürür.

`installPlatform`, `installOpenCodeGlobal` ve `detectTargets` fonksiyonlarına dokunulmaz.

**Done When:**
- `SKILLS` ve `COMMANDS` dizileri dört eleman içeriyor, sonuncusu `"changelog"`
- `ensureGitattributes(baseRoot)` fonksiyonu tanımlı ve satır zaten varsa `{ status: "unchanged" }` döndürüyor
- `init()` proje kapsamlı kurulumda `.gitattributes`'a `docs/CHANGELOG.md merge=union` satırını ekliyor, `--global` kurulumda eklemiyor
- Satır zaten varsa dosya değiştirilmiyor (idempotent)

**Verification:**
- Manual: `node --check bin/cli.js` → hata vermemeli
- Manual: `rm -rf .smoketest && mkdir -p .smoketest/p && cd .smoketest/p && git init -q && node ../../bin/cli.js init --target=claude && cat .gitattributes` → `docs/CHANGELOG.md merge=union` göstermeli
- Manual: aynı dizinde kurulumu ikinci kez çalıştır → çıktıda `·  .gitattributes` görünmeli, `wc -l < .gitattributes` `1` dönmeli
- Manual: `grep -n "args.global" bin/cli.js` → `.gitattributes` çağrısını saran koşulu göstermeli (bu doğrulama için `--global` kurulumu çalıştırmayın; ev dizinine yazar)

---

### TASK-05: dokümantasyon ve sürüm

**Targets:**
- `templates/instructions-block.md` (modify)
- `README.md` (modify)
- `package.json` (modify)

**Model Tier:** T2

**Implementation Notes:**

`templates/instructions-block.md` kurulum sırasında hedef projenin `CLAUDE.md` / `AGENTS.md` dosyasına işaretçiler arasına yazılan bloktur. Dosyanın tamamı şu hale gelir (işaretçi satırları korunur):

```markdown
<!-- tuncss-plan-kit:start -->
## Plan Kit

This project uses tuncss-plan-kit. Four slash commands are available:

- `/brainstorm` — turn an idea into an approved spec (writes to `docs/specs/`)
- `/plan-universal` — turn a spec into an executable plan (writes to `docs/plans/`)
- `/handoff-plan` — generate a paste-ready handoff for another LLM agent (writes to `docs/handoffs/`)
- `/changelog` — record what changed, in plain sentences (writes to `docs/CHANGELOG.md`)

Plans contain an execution contract at the top. When asked for a specific task ("do TASK-03"), read only that task's block, stay inside its Targets, write the changelog entry, then stop and report when Done When + Verification are satisfied.
<!-- tuncss-plan-kit:end -->
```

`README.md` içinde dört yer güncellenir:

1. Açılış cümlesi `Three skills for spec-driven development` → `Four skills for spec-driven development`, ve altındaki madde listesine dördüncü satır eklenir: `- **/changelog** — record what changed, in plain sentences (docs/CHANGELOG.md)`
2. Aynı bölümdeki `Just three skills that get you from idea → spec → plan → handoff.` cümlesi dört skill'i yansıtacak şekilde güncellenir
3. "Workflow" bölümündeki şemada `do TASK-01` adımının açıklaması şu hale getirilir:

```
You:     do TASK-01
Agent:   reads only TASK-01's block, stays inside its Targets, writes the
         changelog entry to docs/CHANGELOG.md, stops for approval when done
```

4. "What's in a plan" bölümündeki 5 maddelik alıntı bloğu, TASK-03'te `skills/plan-universal/SKILL.md`'ye yazılan altı maddeyle **birebir aynı** hale getirilir:

```markdown
> 1. Read **only** that task's block. Do not preview other tasks.
> 2. Stay strictly inside its **Targets** — do not edit files outside that list.
> 3. Follow the **Implementation Notes**; do not invent extra scope.
> 4. When **Done When** and **Verification** are satisfied, write the changelog entry (rule 6), then **stop and report**. Wait for approval before moving to the next task.
> 5. If verification fails, report the failure and stop. Do not attempt fixes outside the task's Targets, and do not write a changelog entry.
> 6. **Changelog entry:** use the `changelog` skill to append this task's entry to `docs/CHANGELOG.md`. Base it on the actual diff, not on what you set out to do.
```

"What gets written where" tablosunun altındaki `Claude Code automatically exposes any skill named foo as /foo` paragrafı doğruluğunu koruyor; değiştirilmez.

`package.json` içinde yalnız `"version": "0.1.1"` → `"version": "0.2.0"` yapılır. `files` dizisi `skills/` ve `commands/` klasörlerini bütün olarak yayınladığı için yeni dosyalar zaten kapsam içindedir; `keywords`, `main`, `bin` alanlarına dokunulmaz.

**Done When:**
- `templates/instructions-block.md` dört komutu listeliyor ve changelog girişinin raporlamadan önce yazıldığını söylüyor
- `README.md` "four skills" diyor ve `/changelog` komutunu listeliyor; "three skills" ifadesi hiçbir yerde kalmıyor
- `README.md`'deki contract alıntısı 6 madde içeriyor ve `skills/plan-universal/SKILL.md`'deki metinle birebir aynı
- `package.json` sürümü `0.2.0`

**Verification:**
- Manual: `grep -c "^- " templates/instructions-block.md` → `4` dönmeli
- Manual: `grep -in "three skills" README.md` → hiçbir şey dönmemeli
- Manual: `grep -c "^> [0-9]\." README.md` → `6` dönmeli
- Manual: `grep "^> [0-9]\." README.md > /tmp/a; grep "^> [0-9]\." skills/plan-universal/SKILL.md > /tmp/b; diff /tmp/a /tmp/b` → fark üretmemeli
- Manual: `node -p "require('./package.json').version"` → `0.2.0` yazmalı

---

### TASK-06: uçtan uca kurulum doğrulaması

**Targets:**
- `.smoketest/` (create — geçici; `.gitignore` tarafından zaten yok sayılıyor, task sonunda silinir)

**Model Tier:** T2

**Implementation Notes:**

Kaynak dosyalara dokunulmaz. Bu task yalnız `npx tuncss-plan-kit init`'in üç platform için de dördüncü skill'i doğru yerlere koyduğunu ve `.gitattributes` satırını yazdığını kanıtlar.

`bin/cli.js` paket kökünü kendi konumundan (`bin/`'in üstü) çözer, kurulum hedefini ise `process.cwd()`'den alır. Bu yüzden başka bir dizinden çağırmak güvenlidir.

Temiz bir kurulum çalıştır:

```bash
rm -rf .smoketest
mkdir -p .smoketest/p
cd .smoketest/p
git init -q
node ../../bin/cli.js init --target=all
```

Ardından beklenen dosyaların hepsini tek döngüyle kontrol et:

```bash
for f in \
  .claude/skills/changelog/SKILL.md \
  .agents/skills/changelog/SKILL.md \
  .codex/prompts/changelog.md \
  .opencode/skills/changelog/SKILL.md \
  .opencode/commands/changelog.md \
  CLAUDE.md AGENTS.md .gitattributes
do [ -f "$f" ] && echo "OK   $f" || echo "MISS $f"; done
```

Sekiz satırın tamamı `OK` olmalı. `MISS` çıkarsa TASK-01/02/04'ten hangisinin eksik kaldığını raporla ve dur — düzeltme bu task'ın Targets'ı dışındadır.

İdempotanlığı da doğrula: aynı dizinde kurulumu ikinci kez çalıştır, `.gitattributes` tek satır kalmalı ve marker bloğu `CLAUDE.md`'de bir kez bulunmalı.

Bitince depo köküne dönüp `rm -rf .smoketest` ile temizle.

**Done When:**
- `--target=all` kurulumu hata vermeden tamamlanıyor
- Yukarıdaki sekiz yolun hepsi oluşuyor
- `.gitattributes` tek satır içeriyor: `docs/CHANGELOG.md merge=union`
- `CLAUDE.md` ve `AGENTS.md` içinde `<!-- tuncss-plan-kit:start -->` işaretçisi tam bir kez geçiyor ve blok dört komutu listeliyor
- İkinci kurulum yeni satır veya ikinci marker bloğu üretmiyor
- `.smoketest/` silinmiş

**Verification:**
- Manual: yukarıdaki kurulum ve kontrol döngüsü → sekiz `OK` satırı
- Manual: `grep -c "tuncss-plan-kit:start" .smoketest/p/CLAUDE.md` → `1`
- Manual: `wc -l < .smoketest/p/.gitattributes` → `1`
- Manual: `grep -c "^- " .smoketest/p/AGENTS.md` → `4`
- Manual: `ls .smoketest` → dizin bulunamadı hatası (temizlik yapıldı)
