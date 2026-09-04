# Changelog Skill — Tasarım

**Tarih:** 2026-09-04
**Durum:** Onaylandı, plana hazır

## Problem

Üç kişilik ekip tuncss-plan-kit'i aktif kullanmaya başlıyor ve birbirinin yaptığı
değişiklikleri görmek istiyor. Bugünkü tek kaynak commit mesajları ve onlar
yüzeysel kalıyor: "auth iyileştirildi" tarzı ifadeler neyin neye dönüştüğünü
söylemiyor.

İhtiyaç duyulan şey kapsamlı bir denetim kaydı değil, **yapılan işin özünü somut
cümlelerle anlatan kısa girişler**. Objektiflik istatistikten değil cümlenin
somutluğundan gelir: "bluetooth okuma iyileştirildi" yüzeysel, "okuma eşiği
−60 dB'den −80 dB'ye çekildi" objektiftir.

## Çözüm özeti

Kite dördüncü bir skill eklenir: `changelog`. Plan task'ı tamamlandığında ajan,
raporlamadan hemen önce `docs/CHANGELOG.md` dosyasına o task'ın kısa girişini
ekler. Skill ayrıca `/changelog` olarak elle çağrılabilir; plan dışı işler
(hotfix, küçük düzeltme) böyle kayda geçer.

## Kararlar

| Karar | Gerekçe |
|---|---|
| Kite 4. skill olarak eklenir | Ekibin ihtiyacı kitin ürettiği bir çıktı; paketin kendi sürüm notu değil |
| Task bitiminde otomatik yazılır | Disiplin bedava gelir; elle hatırlamaya bağlı kalırsa bugünkü problem tekrarlar |
| Talimat yoluyla tetiklenir, hook ile değil | Kit saf talimattan oluşur ve üç platformda aynı davranır; hook yalnız Claude Code'da çalışır ve task bağlamını göremez |
| `/changelog` üç platformda da yazılabilir | Kitin varlık sebebi platformlar arası aynı UX; Codex/OpenCode wrapper'ları yazılır |
| Girişler kısa, somut cümlelerden oluşur | Dosya tablosu ve doğrulama kutucukları istenmedi; okunabilirlik önceliği |
| Tek `docs/CHANGELOG.md` | Tarama kolaylığı; çakışma maliyeti `merge=union` ile karşılanır |
| Başarısız doğrulama giriş üretmez | O iş genelde merge edilmez; kaydı yazmak gerçekleşmemiş değişikliği kayda geçirir |

## Giriş formatı

Konum: `docs/CHANGELOG.md`. En yeni üstte, tarih başlıkları altında gruplanır.

```markdown
# Changelog

## 2026-09-04

### Auth middleware — TASK-03 · Mustafa TUNÇ · [plan](docs/plans/2026-09-02-auth.md)
- Token doğrulaması her handler'dan alınıp tek bir `requireAuth` middleware'ine taşındı
- Geçersiz token'da dönen yanıt 200 + boş gövdeden 401'e değiştirildi
- Session ömrü 24 saatten 2 saate indirildi

### Bluetooth eşik değeri — plan dışı · Ayşe Yılmaz
- Okuma eşiği −60 dB'den −80 dB'ye çekildi
- Zayıf sinyalde bağlantı 3 kez yeniden denenir hale getirildi

## 2026-09-03
...
```

Başlık satırı alanları:

- Task girişi: `### <task adı> — TASK-NN · <yazan> · [plan](<plan yolu>)`
- Plan dışı giriş: `### <kısa ad> — plan dışı · <yazan>`

`<yazan>` alanı `git config user.name` çıktısından alınır. Değer boşsa alan ve
onu ayıran `·` başlıktan tamamen çıkarılır; ajan isim uydurmaz.

### Ekleme kuralı

Bugünün tarih başlığı dosyada varsa giriş onun altına, en sona eklenir. Yoksa
`# Changelog` satırının hemen ardına yeni tarih başlığı açılır. Dosya yoksa
`# Changelog` başlığıyla oluşturulur.

Ajan commit atmaz. Giriş, değişikliğin yanında çalışma ağacında bekler ve kodla
birlikte tek commit'e alınır — böylece `git log -p docs/CHANGELOG.md` her satırı
onu doğuran değişiklikle eşleştirir.

### Madde yazım kuralları

Bu kurallar olmadan girişler bugünkü commit mesajlarına dönüşür; skill'in asıl
içeriği bunlardır.

1. Her madde değişen şeyi **adıyla** söyler.
2. Sayısal veya kategorik bir değer değiştiyse **eski değer → yeni değer** yazılır.
3. Neyin neye dönüştüğünü söylemeyen ifadeler yasaktır: "iyileştirildi",
   "refactor edildi", "hatalar giderildi", "performans artırıldı", "temizlendi"
   ve muadilleri.
4. Task başına 1–5 madde. Beşi aşıyorsa task fazla büyük demektir; ajan bunu
   raporunda belirtir ama girişi yine de yazar.
5. Maddeler **gerçek diff'e bakılarak** yazılır, yapılması planlanana göre değil.
   Diff girişe yazılmaz, yalnızca kaynak olarak kullanılır.
6. Girişler deponun dilinde yazılır. Skill'in kendisi İngilizcedir; ürettiği
   metin değildir.

## Plan dışı girişler

`/changelog` bir task bağlamı olmadan çağrıldığında skill:

1. `git diff` ve `git diff --staged` ile gerçek değişikliği okur.
2. Değişiklik yoksa durur ve kullanıcıya bildirir.
3. Aynı madde kurallarıyla girişi yazar; başlıkta TASK numarası yerine
   `plan dışı` etiketi kullanır, plan bağlantısı konmaz.

## Execution contract değişikliği

`plan-universal` skill'inin ürettiği contract 5 maddeden 6 maddeye çıkar. 6.
madde sıralı bir adım değil, 4. maddenin referans verdiği tanım maddesidir:

```markdown
> 1. Read **only** that task's block. Do not preview other tasks.
> 2. Stay strictly inside its **Targets** — do not edit files outside that list.
> 3. Follow the **Implementation Notes**; do not invent extra scope.
> 4. When **Done When** and **Verification** are satisfied, write the changelog
>    entry (rule 6), then **stop and report**. Wait for approval before moving to
>    the next task.
> 5. If verification fails, report the failure and stop. Do not attempt fixes
>    outside the task's Targets, and do not write a changelog entry.
> 6. **Changelog entry:** use the `changelog` skill to append this task's entry to
>    `docs/CHANGELOG.md`. Base it on the actual diff, not on what you set out to do.
```

`handoff-plan` skill'inin ürettiği briefing'deki 5 kural da aynı şekilde 6'ya
çıkar; aksi halde başka bir ajana devredilen iş kayıt dışı kalır.

Contract, skill'e adıyla referans verir (dosya yolu ve format gömülmez) — böylece
giriş formatı tek kaynakta, `SKILL.md` içinde kalır ve her plan dosyasında
tekrarlanmaz.

## Kurulum değişiklikleri

| Dosya | Değişiklik |
|---|---|
| `skills/changelog/SKILL.md` | Yeni. Giriş formatı, madde kuralları, ekleme kuralı, plan dışı akış |
| `skills/plan-universal/SKILL.md` | Contract 5 → 6 madde |
| `skills/handoff-plan/SKILL.md` | Briefing'deki kural listesi 5 → 6 |
| `bin/cli.js` | `SKILLS` ve `COMMANDS` dizilerine `"changelog"`; `.gitattributes` yazıcı |
| `commands/codex/changelog.md` | Yeni wrapper |
| `commands/opencode/changelog.md` | Yeni wrapper |
| `.opencode/plugins/tuncss-plan-kit.js` | `WRAPPERS` nesnesine `changelog` girdisi |
| `templates/instructions-block.md` | `/changelog` satırı ve otomatik yazım notu |
| `README.md` | Komut listesi, workflow şeması, contract 5 → 6 |
| `package.json` | `0.1.1` → `0.2.0` |

### `.gitattributes`

Proje kapsamlı kurulumda `.gitattributes` dosyasına şu satır eklenir:

```
docs/CHANGELOG.md merge=union
```

Davranış: dosya yoksa oluşturulur; varsa ve satır yoksa sonuna eklenir; satır
zaten varsa dokunulmaz. `--global` kurulumda ortada depo olmadığı için bu adım
atlanır.

Bu satır sayesinde üç kişi farklı branch'lerde giriş eklediğinde git iki tarafı
da korur ve elle çözülecek çakışma çıkmaz.

## Kapsam dışı

- **Paketin kendi sürüm notları.** `tuncss-plan-kit`'in npm sürüm geçmişi için
  ayrı bir kök `CHANGELOG.md` bu tasarımın parçası değildir.
- **`--force` tutarsızlığı.** README skill dosyalarının yalnız `--force` ile
  üzerine yazıldığını söylüyor; `bin/cli.js` içindeki `copyFile` ise `--force`
  olmadan da farklı içerikli hedefi yazıyor. Gerçek bir tutarsızlık, ayrı iş
  olarak ele alınacak.
- **Eski planlar.** Bu güncellemeden önce yazılmış planlar 5 maddelik contract
  taşır ve giriş üretmez. Elle güncellenebilirler; otomatik göç yapılmaz.
- **Geriye dönük giriş üretimi.** Geçmiş commit'lerden toplu changelog üretmek
  kapsam dışıdır; commit mesajını yorumlamak tam da yetersiz bulunan kaynağa
  geri dönmek olurdu.
