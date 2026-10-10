# Changelog

## 2026-10-10

### New contract and plan-writing rules in plan-universal — TASK-01 · tuncss · [plan](docs/plans/2026-10-10-autonomous-execution.md)
- Plan başlığındaki kontratın varsayılanı "her task sonunda dur, onay bekle" → "tüm taskları sırayla yap, her task sonrası changelog + commit"
- Kontrata dört durma koşulu eklendi: S1 doğrulama ikinci kez başarısız, S2 planda geçen şey repoda yok/farklı, S3 Targets dışına çıkma gereği, S4 başlangıçta kirli working tree
- Commit mesajı kuralı eklendi: Türkçe, ASCII, ilk satır `TASK-NN: <ne değişti>`
- Self-review listesi 5 → 7 madde: kendiliğinden biten doğrulama, task sırası, referansların repoda var olması
- Plan sonrası mesaj "taskları tek tek iste" → "'run the plan' de, tek task için 'do TASK-01', devretmek için `/handoff-plan`"
