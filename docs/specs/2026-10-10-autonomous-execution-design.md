# Otonom Sıralı Yürütme — Tasarım

**Tarih:** 2026-10-10
**Durum:** Onaylandı, plana hazır
**Hedef sürüm:** v0.7.0

## Problem

Ekip planları Claude ile yazıp Antigravity üzerindeki Gemini 3.8 Flash'a uygulatıyor
ve handoff'larda modele "tüm taskları sırayla yap, hata olmadıkça durma" diyor. Görevler
arasında kod review yapılmıyor. Kitin kontratı ise hâlâ "her task sonunda dur, onay bekle"
diyor; kullanıcı her handoff'ta bunu elle eziyor.

Ek olarak:
- Handoff mesajının son satırı ("planı baştan sona oku") kontratın 1. kuralıyla
  ("yalnızca o task'ın bloğunu oku") çelişiyor.
- Review olmadığı için tek güvenlik ağı durma koşulları ve checkpoint'ler; ikisi de
  kontratta tanımlı değil. Hızlı modellerde raporlanan riskler: tekrar deneme döngüsü,
  var olmayan API/bayrak uydurma, harness'ın kendi planını çıkarıp kapsamı kaydırması.

## Çözüm özeti

Kontratın varsayılanı **"tüm taskları sırayla yap"** olur. Her başarılı task'tan sonra
changelog girdisi yazılır ve iş + girdi birlikte commit'lenir. Dört durma koşulu (S1–S4)
tanımlanır. Kontrat tam metin olarak hem planın başlığında hem handoff mesajının en
üstünde yer alır. Plan yazımına "yalnızca doğrulanmış referans" ve "kendiliğinden biten
doğrulama" kuralları eklenir. Kurallar model-nötrdür; Gemini'ye özel mod yoktur.

## Kararlar

| Karar | Gerekçe |
|---|---|
| Varsayılan: tüm tasklar sırayla, durmadan | Kullanıcının fiili kullanımı; tek task'ta durmak istenirse prompt'ta söylenir |
| "do TASK-03" tek task yapar ve durur | Claude Code içinde tek task çalıştırma kullanımı korunur |
| Her başarılı task sonrası commit | Review yok; bozulan task tek commit geri alınarak temizlenir, durunca önceki işler güvende |
| Commit mesajı Türkçe, ASCII, kite sabit | Ekip kararı; override mekanizması YAGNI |
| `changelog` skill'i commit etmemeye devam eder | Commit kontratın 5. adımı; girdi ve değişiklik aynı commit'e girer, eşleşme korunur |
| Kontrat plan + handoff'ta tam metin (yaklaşım A) | Model kuralları ilk satırda görür; eski (v0.6) planlar yeni handoff'la yeni davranışı alır |
| Eski planlar güncellenmez | Handoff'taki kontrat onları ezer |
| Skill dosyaları İngilizce kalır | Yalnızca commit mesajlarının dili sabitlenir |

## Kontrat metni

`skills/plan-universal/SKILL.md` plan başlığına ve `skills/handoff-plan/SKILL.md` mesaj
şablonunun en üstüne **aynen** girer:

```markdown
<!-- EXECUTION CONTRACT — read before touching any task -->
> **Default: run every task in order, from TASK-01 to the last, without stopping between tasks.**
> If the user names a single task ("do TASK-03"), do only that task, then stop.
> If the user names a starting task ("run from TASK-04"), start there and continue in order.
> This plan is already approved. Do not write your own plan or task list — execute this one.
>
> **Before the first task:** run `git status`. If the working tree is not clean, stop (S4).
>
> **For each task:**
> 1. Read only that task's block. Do not preview later tasks.
> 2. Edit only the files in its **Targets**.
> 3. Follow its **Implementation Notes**; add no extra scope.
> 4. Run its **Verification**. If it fails, make one fix attempt inside Targets and run it again.
> 5. When **Done When** and **Verification** pass: append the changelog entry with the `changelog`
>    skill (from the actual diff), then commit the task's changes and the entry together.
> 6. **Commit message:** Turkish, ASCII only — write c, s, i, g, o, u instead of ç, ş, ı, ğ, ö, ü.
>    First line `TASK-NN: <what changed>`, under 72 characters. Say what changed, not "dosyalar guncellendi".
>    Example: `TASK-03: Oturum suresi 24 saatten 2 saate dusuruldu`
>
> **Stop and report when:**
> - S1: Verification fails a second time.
> - S2: A file, function, API, flag, or command the task names does not exist or differs from the description. Do not guess.
> - S3: Finishing the task requires editing a file outside its Targets.
> - S4: The working tree was not clean before the first task.
>
> On stop: no changelog entry and no commit for that task; earlier commits stay. Report the task id, the condition (S1–S4), and what you saw.
> After the last task: report the list of commits made.
```

## Handoff mesajı şablonu

````text
You're executing an approved implementation plan in this repo.

<kontrat metni, yukarıdakiyle birebir>

**Project:** <name> — <one-line description>
**Plan:** `<path/to/plan.md>`
**Spec:** `<path/to/spec.md>`   ← spec yoksa satır tamamen çıkarılır

**Goal:** <goal line from plan>
**Tech:** <tech line from plan>

**Tasks:**
- TASK-01: <name>
- TASK-02: <name>

Start now: open `<plan path>`, read the header and TASK-01's block, and begin. Continue through every task in order until the last one is done or a stop condition (S1–S4) is hit.
````

`handoff-plan` kuralları:
- Uzunluk sınırı ~50 → ~60 satır; görev listesi bu sayıma dahil değildir.
- Kontrat metni yeniden ifade edilmez; plan dosyasıyla birebir aynıdır.
- Model adı, skill adı veya Claude'a özgü ifade mesajda geçmez (mevcut kural, değişmez).
- Mesaj `docs/handoffs/` altına yazılır, sohbete tek satır onay basılır (mevcut, değişmez).

## Plan yazım kuralları (`plan-universal`)

- **Yalnızca doğrulanmış referans:** Implementation Notes'ta adı geçen her dosya, fonksiyon,
  komut, bayrak ve config anahtarı ya repoda mevcuttur (plan yazılırken açılıp kontrol
  edilmiştir) ya da daha önceki bir task'ın Targets'ı tarafından oluşturulur. Doğrulanamayan
  şey yazılmaz. "No placeholders" listesine ve self-review'a eklenir.
- **Kendiliğinden biten doğrulama:** Verification komutları kendi kendine sonlanır — watch
  modu yok, arkada açık kalan dev server yok. Self-review'daki "Verification reality"
  maddesine eklenir.
- **Sıra:** Her task yalnızca kendinden önceki taskların tamamlandığını varsayabilir.
  Self-review'a madde olarak eklenir.
- **Kapanış mesajı:** "Plan saved… To execute every task in order, say 'run the plan', or
  ask for a single task ('do TASK-01'). To hand it to another agent, run `/handoff-plan`."

## Senkron güncellenecek diğer dosyalar

- `skills/changelog/SKILL.md` — "Rule 6 of the plan's execution contract" → "Step 5 of the
  plan's execution contract".
- `templates/instructions-block.md` — özet cümle: plan varsayılan olarak tüm taskları
  sırayla yürütür, her task sonrası changelog + commit, S1–S4'te durur; "do TASK-03" tek
  task yapar.
- `README.md` — "Workflow" ve "What's in a plan" bölümleri yeni kontratı yansıtır.
- `package.json` — `version` → `0.7.0`.

## Kapsam dışı

- `bin/cli.js` değişmez.
- `docs/plans/` altındaki mevcut planlar güncellenmez.
- Kullanıcının makinesindeki kurulu kopyalar (`~/.gemini/config/`, `~/.claude/`, global
  `CLAUDE.md`) yayın sonrası `npx tuncss-plan-kit init --global --force` ile güncellenir;
  bu kitin işi değil.
- Commit dili için override mekanizması.
