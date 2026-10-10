# Changelog

## 2026-10-10

### New contract and plan-writing rules in plan-universal — TASK-01 · tuncss · [plan](docs/plans/2026-10-10-autonomous-execution.md)
- Plan başlığındaki kontratın varsayılanı "her task sonunda dur, onay bekle" → "tüm taskları sırayla yap, her task sonrası changelog + commit"
- Kontrata dört durma koşulu eklendi: S1 doğrulama ikinci kez başarısız, S2 planda geçen şey repoda yok/farklı, S3 Targets dışına çıkma gereği, S4 başlangıçta kirli working tree
- Commit mesajı kuralı eklendi: Türkçe, ASCII, ilk satır `TASK-NN: <ne değişti>`
- Self-review listesi 5 → 7 madde: kendiliğinden biten doğrulama, task sırası, referansların repoda var olması
- Plan sonrası mesaj "taskları tek tek iste" → "'run the plan' de, tek task için 'do TASK-01', devretmek için `/handoff-plan`"

### Contract-first handoff message — TASK-02 · tuncss · [plan](docs/plans/2026-10-10-autonomous-execution.md)
- Handoff mesajı artık plandaki kontratın birebir kopyasıyla başlıyor; eski 6 maddelik "How to execute" özeti kaldırıldı
- Son satır "planı baştan sona oku, ilk task'ı isteyene kadar bekle" → "başlığı ve TASK-01'i oku, başla, S1–S4'e kadar sırayla devam et"
- Mesaj uzunluk sınırı ~50 → ~60 satır, görev listesi sayıma dahil değil

### Align changelog skill and instructions block — TASK-03 · tuncss · [plan](docs/plans/2026-10-10-autonomous-execution.md)
- Changelog skill'indeki kontrat referansı "Rule 6" → "Step 5"
- Changelog skill'ine, plan çalışmasında girdinin task değişiklikleriyle aynı commit'e kontrat tarafından alındığı notu eklendi
- Kurulumda CLAUDE.md/AGENTS.md'ye yazılan özet "task'ı yap, dur, raporla" → "varsayılan olarak tüm taskları sırayla yap, her task sonrası changelog + commit, S1–S4'te dur"

### README and v0.7.0 — TASK-04 · tuncss · [plan](docs/plans/2026-10-10-autonomous-execution.md)
- README Workflow adımı "do TASK-01, onay için dur" → "run the plan, her task sonrası commit, yalnızca S1–S4'te dur"
- README "What's in a plan" bölümündeki 6 kural yeni kontratın tam metniyle değiştirildi, Türkçe ASCII commit notu eklendi
- Paket sürümü 0.6.0 → 0.7.0
