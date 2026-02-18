> [English](README.md) | [Português](README.pt.md) | [Español](README.es.md) | [Français](README.fr.md) | [Türkçe](README.tr.md) | [Deutsch](README.de.md) | [العربية](README.ar.md) | [简体中文](README.zh-Hans.md) | [日本語](README.ja.md)

<p align="center">
  <img src="ralph.png" alt="Ralph Wiggum" />
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/ralph-starter"><img src="https://img.shields.io/npm/v/ralph-starter.svg?style=flat-square" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/ralph-starter"><img src="https://img.shields.io/npm/dm/ralph-starter.svg?style=flat-square" alt="npm downloads"></a>
  <a href="https://github.com/multivmlabs/ralph-starter/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/ralph-starter.svg?style=flat-square" alt="license"></a>
  <a href="https://github.com/multivmlabs/ralph-starter/actions"><img src="https://img.shields.io/github/actions/workflow/status/multivmlabs/ralph-starter/ci.yml?branch=main&style=flat-square" alt="build status"></a>
  <a href="https://github.com/multivmlabs/ralph-starter/actions/workflows/security.yml"><img src="https://img.shields.io/github/actions/workflow/status/multivmlabs/ralph-starter/security.yml?branch=main&style=flat-square&label=security" alt="security scanning"></a>
  <a href="https://securityscorecards.dev/viewer/?uri=github.com/multivmlabs/ralph-starter"><img src="https://img.shields.io/ossf-scorecard/github.com/multivmlabs/ralph-starter?style=flat-square&label=scorecard" alt="OSSF Scorecard"></a>
  <a href="https://github.com/multivmlabs/ralph-starter"><img src="https://img.shields.io/github/stars/multivmlabs/ralph-starter?style=flat-square" alt="GitHub stars"></a>
</p>

<h3 align="center">
  <strong>Araçlarınızı bağlayın. Yapay zeka kodlama döngüleri çalıştırın. Daha hızlı teslim edin.</strong>
</h3>

<p align="center">
  <em>GitHub, Linear, Notion, Figma ve daha fazlasından özellikleri çekin — sonra yapay zekanın otonom olarak inşa etmesine izin verin.</em>
</p>

<p align="center">
  <a href="#entegrasyonlar">Entegrasyonlar</a> •
  <a href="#hizli-baslangic">Hızlı Başlangıç</a> •
  <a href="#ozellikler">Özellikler</a> •
  <a href="https://ralphstarter.ai">Belgeler</a>
</p>

---


Çoğu yapay zeka kodlama aracı izole çalışır. Bir görev tanımlarsınız, yapay zeka onu oluşturur, bitti.

**ralph-starter** farklıdır. **Mevcut iş akışınıza bağlanır** — GitHub issue'larından, Linear ticket'larından, Notion belgelerinden veya herhangi bir URL'den özellikleri çekerek — sonra görev tamamlanana kadar otonom yapay zeka döngüleri çalıştırır.

```bash
# GitHub issue'dan oluştur
ralph-starter run --from github --project myorg/myrepo --label "ready"

# Linear ticket'ından oluştur
ralph-starter run --from linear --project "Mobile App" --label "sprint-1"

# Notion özelliğinden oluştur
ralph-starter run --from notion --project "https://notion.so/Product-Spec-abc123"

# Veya sadece ne istediğinizi açıklayın
ralph-starter run "build a todo app with React" --commit
```

---

## Entegrasyonlar

ralph-starter en sevdiğiniz araçlarla doğrudan entegre olur:

| Entegrasyon | Kimlik Doğrulama Yöntemi | Neyi Çeker |
|-------------|-------------|-----------------|
| **GitHub** | `gh` CLI (önerilen) veya API token | Issue'lar, PR'lar, dosyalar |
| **Linear** | `linear` CLI veya API anahtarı | Takım/proje bazında issue'lar |
| **Notion** | Yok (genel) veya API token (özel) | Sayfalar, veritabanları |
| **Figma** | API token | Tasarım özellikleri, token'lar, varlıklar ve içerik çıkarma |
| **URL'ler** | Yok | Herhangi bir genel markdown/HTML |
| **Dosyalar** | Yok | Yerel markdown, PDF |

```bash
# Mevcut entegrasyonları kontrol et
ralph-starter integrations list

# Bağlantıyı test et
ralph-starter integrations test github
ralph-starter integrations test linear

# Çalıştırmadan önce verileri önizle
ralph-starter integrations fetch github owner/repo
```

> **Daha fazla entegrasyon mu istiyorsunuz?** PR'lar memnuniyetle karşılanır! Başlamak için [CONTRIBUTING.md](CONTRIBUTING.md) dosyasına bakın.

---

## İçindekiler

- [Entegrasyonlar](#entegrasyonlar)
- [Hızlı Başlangıç](#hizli-baslangic)
- [Özellikler](#ozellikler)
- [Komutlar](#komutlar)
- [Yapılandırma](#api-anahtari-yapilandirmasi)
- [Katkıda Bulunma](#katkida-bulunma)

---

### Ana Özellikler

| Özellik | Açıklama |
|---------|-------------|
| **Entegrasyonlar** | GitHub, Linear, Notion, Figma, URL'ler, dosyalardan özellikler çekin |
| **Çoklu Ajan Desteği** | Claude Code, Cursor, Copilot, Gemini CLI ve daha fazlasıyla çalışır |
| **İnteraktif Sihirbaz** | Yapay zeka tarafından rafine edilmiş özelliklerle rehberli proje oluşturma |
| **16+ İş Akışı Ön Ayarı** | Önceden yapılandırılmış modlar: feature, tdd, debug, review ve daha fazlası |
| **Circuit Breaker** | Tekrarlanan hatalardan sonra takılı döngüleri otomatik olarak durdurur |
| **Maliyet Takibi** | Her iterasyon için token kullanımı ve maliyeti tahmin eder |
| **Git Otomasyonu** | Otomatik commit, push ve PR oluşturma |
| **Backpressure Doğrulama** | Her iterasyondan sonra testleri/lint/build çalıştırır |
| **MCP Sunucusu** | Claude Desktop'tan veya herhangi bir MCP istemcisinden kullanın |

### Hızlı Örnek

```bash
# Basit görev
ralph-starter run "build a todo app" --commit --validate

# Ön ayar ile
ralph-starter run --preset tdd-red-green "add user authentication"

# Güvenlik kontrolleriyle
ralph-starter run --rate-limit 50 --circuit-breaker-failures 3 "build X"

# İnteraktif sihirbaz
ralph-starter
```

---

## Ralph Wiggum Nedir?

Ralph Wiggum tekniği hakkında [ghuntley.com/ralph](https://ghuntley.com/ralph/) adresinden bilgi edinin.

## Kurulum

```bash
npm install -g ralph-starter
# veya
npx ralph-starter
```

Kurduktan sonra, kurulum sihirbazını çalıştırın ve ortamınızı doğrulayın:

```bash
ralph-starter setup    # API anahtarlarını ve tercihlerini yapılandır
ralph-starter check    # Sistem gereksinimlerini ve bağlantıyı doğrula
```

## Hızlı Başlangıç

### Herkes İçin (Geliştirici Olmayanlar Hoş Geldiniz!)

İnteraktif sihirbazı başlatmak için argümansız olarak `ralph-starter` çalıştırın:

```bash
ralph-starter
```

Sihirbaz:
1. Bir proje fikriniz olup olmadığını soracak (veya bir tane oluşturmanıza yardımcı olacak)
2. Fikrinizi yapay zeka ile rafine edecek
3. Teknoloji yığınınızı özelleştirmenize izin verecek
4. Projenizi otomatik olarak oluşturacak

### Ne İnşa Edeceğinizi Bilmiyor musunuz?

```bash
ralph-starter ideas
```

Bu, **Fikir Modu**'nu başlatır - proje fikirleri keşfetmenize yardımcı olacak bir beyin fırtınası oturumu:
- **Yapay zeka ile beyin fırtınası** - Yaratıcı öneriler alın
- **Trend fikirleri görün** - 2025-2026 teknoloji trendlerine dayalı
- **Becerilerime dayalı** - Bildiğiniz teknolojilere göre kişiselleştirilmiş
- **Bir sorunu çözün** - Sizi hayal kırıklığına uğratan bir şeyi düzeltmeye yardımcı olun

### Geliştiriciler İçin

```bash
# Tek bir görev çalıştır
ralph-starter run "build a todo app with React"

# Git otomasyonu ile
ralph-starter run "add user authentication" --commit --pr

# Doğrulama ile (backpressure)
ralph-starter run "refactor auth" --commit --validate

# Harici kaynaklardan özellikler getir
ralph-starter run --from https://example.com/spec.md
ralph-starter run --from github --project myorg/myrepo --label "ready"
ralph-starter run --from linear --project "Mobile App"

# Belirli bir GitHub issue'sunu getir
ralph-starter run --from github --project owner/repo --issue 123

# Çıktı dizinini belirt ("nerede çalıştırılsın?" istemini atlar)
ralph-starter run --from github --project owner/repo --issue 42 --output-dir ~/projects/new-app
```

### Mevcut Projelerle Çalışma

ralph-starter, sihirbazı çalıştırdığınızda mevcut projeleri otomatik olarak algılar:

**Ralph Playbook Projesi** (AGENTS.md, IMPLEMENTATION_PLAN.md, vb. içerir):
```bash
cd my-ralph-project
ralph-starter
```
Sihirbaz Ralph Playbook dosyalarını algılayacak ve şunları yapmanıza izin verecek:
- Çalışmaya devam et (inşa döngüsünü çalıştır)
- Uygulama planını yeniden oluştur
- Yeni özellikler ekle

**Dil Projesi** (package.json, pyproject.toml, Cargo.toml, go.mod içerir):
```bash
cd my-existing-app
ralph-starter
```
Sihirbaz proje türünü algılayacak ve şunları yapmanıza izin verecek:
- Mevcut projeye özellikler ekle
- Alt klasörde yeni bir proje oluştur

## Özellikler

### İnteraktif Sihirbaz
Rehberli bir deneyim için `ralph-starter` ile (argümansız) başlatın:
- Fikrinizi sade Türkçe ile açıklayın
- Yapay zeka rafine eder ve özellikler önerir
- Teknoloji yığınınızı seçin
- Otomatik olarak init → plan → build çalıştırır

### Fikir Modu
Henüz ne inşa edeceklerini bilmeyen kullanıcılar için:
```bash
ralph-starter ideas
```

### MCP Sunucusu
ralph-starter'ı Claude Desktop'tan veya herhangi bir MCP istemcisinden kullanın:

```bash
ralph-starter mcp
```

Claude Desktop yapılandırmasına ekleyin:
```json
{
  "mcpServers": {
    "ralph-starter": {
      "command": "ralph-starter",
      "args": ["mcp"]
    }
  }
}
```

**Mevcut MCP Araçları:**
- `ralph_init` - Ralph Playbook'u başlat
- `ralph_plan` - Uygulama planı oluştur
- `ralph_run` - Kodlama döngüsünü çalıştır
- `ralph_status` - İlerlemeyi kontrol et
- `ralph_validate` - Testleri/lint/build'i çalıştır

### Çoklu Ajan Desteği
Favori kodlama ajanlarınızla çalışır:
- **Claude Code** (önerilen)
- **Cursor**
- **OpenCode**
- **OpenAI Codex**
- **GitHub Copilot**
- **Gemini CLI**
- **Amp**
- **Openclaw**

### LLM Sağlayıcıları
ralph-starter dahili özellikler için birden fazla LLM sağlayıcısını destekler:

| Sağlayıcı | Ortam Değişkeni | Açıklama |
|----------|---------------------|-------------|
| **Anthropic** | `ANTHROPIC_API_KEY` | Claude modelleri (varsayılan) |
| **OpenAI** | `OPENAI_API_KEY` | GPT-4 ve GPT-4o |
| **OpenRouter** | `OPENROUTER_API_KEY` | Tek bir API ile 100+ model |

Bu anahtarlar ralph-starter'ın dahili LLM çağrıları içindir. Kodlama ajanları kendi kimlik doğrulamalarını yönetir.

### Git Otomasyonu
```bash
ralph-starter run "your task" --commit      # Görevlerden sonra otomatik commit
ralph-starter run "your task" --push        # Uzak sunucuya push
ralph-starter run "your task" --pr          # Bittiğinde PR oluştur
```

### Backpressure Doğrulama
```bash
ralph-starter run "your task" --validate    # Her iterasyondan sonra testleri/lint/build çalıştır
```

`--validate` bayrağı her iterasyondan sonra test, lint ve build komutlarını (AGENTS.md veya package.json'dan) çalıştırır. Doğrulama başarısız olursa, ajan sorunları düzeltmek için geri bildirim alır.

### İş Akışı Ön Ayarları

Yaygın geliştirme senaryoları için önceden yapılandırılmış ayarlar:

```bash
# Tüm 16+ ön ayarı listele
ralph-starter presets

# Bir ön ayar kullan
ralph-starter run --preset feature "build login"
ralph-starter run --preset tdd-red-green "add tests"
ralph-starter run --preset debug "fix the bug"
ralph-starter run --preset refactor "clean up auth module"
ralph-starter run --preset pr-review "review changes"
```

**Mevcut Ön Ayarlar:**
| Kategori | Ön Ayarlar |
|----------|---------|
| Geliştirme | `feature`, `feature-minimal`, `tdd-red-green`, `spec-driven`, `refactor` |
| Hata Ayıklama | `debug`, `incident-response`, `code-archaeology` |
| İnceleme | `review`, `pr-review`, `adversarial-review` |
| Dokümantasyon | `docs`, `documentation-first` |
| Özelleşmiş | `api-design`, `migration-safety`, `performance-optimization`, `scientific-method`, `research`, `gap-analysis` |

### Circuit Breaker

Takılı döngüleri otomatik olarak durdurur:

```bash
# 3 ardışık hatadan sonra durdur (varsayılan)
ralph-starter run "build X" --validate

# Özel eşikler
ralph-starter run "build X" --circuit-breaker-failures 2 --circuit-breaker-errors 3
```

Circuit breaker şunları izler:
- **Ardışık hatalar**: Arka arkaya N doğrulama hatasından sonra durur
- **Aynı hata sayımı**: Aynı hata N kez tekrarlanırsa durur

### İlerleme Takibi

İterasyon günlüklerini `activity.md` dosyasına yazar:

```bash
# Varsayılan olarak etkin
ralph-starter run "build X"

# Gerekli değilse devre dışı bırak
ralph-starter run "build X" --no-track-progress
```

Her iterasyon şunları kaydeder:
- Zaman damgası ve süre
- Durum (tamamlandı, başarısız, engellendi)
- Doğrulama sonuçları
- Commit bilgisi

### Dosya Tabanlı Tamamlama

Döngü, tamamlanma sinyallerini otomatik olarak kontrol eder:
- Proje kökünde `RALPH_COMPLETE` dosyası
- `.ralph-done` işaretçi dosyası
- `IMPLEMENTATION_PLAN.md` içinde tüm görevler `[x]` olarak işaretli

### Hız Sınırlama

Maliyetleri yönetmek için API çağrı sıklığını kontrol edin:

```bash
# Saat başına 50 çağrı ile sınırla
ralph-starter run --rate-limit 50 "build X"
```

**Hız sınırlarına ulaşıldığında**, ralph-starter detaylı istatistikler görüntüler:

```
⚠ Claude hız sınırına ulaşıldı

Hız Sınırı İstatistikleri:
  • Oturum kullanımı: %100 (50K / 50K token)
  • Yapılan istekler: Bu saat 127
  • Sıfırlamaya kadar süre: ~47 dakika (04:30 UTC'de sıfırlanır)

Oturum İlerlemesi:
  • Tamamlanan görevler: 3/5
  • Mevcut görev: "Add swarm mode CLI flags"
  • Dal: auto/github-54
  • Tamamlanan iterasyonlar: 12

Sınır sıfırlandığında devam etmek için:
  ralph-starter run

İpucu: Limitlerinizi https://claude.ai/settings adresinden kontrol edin
```

Bu size şunlarda yardımcı olur:
- Ne zaman devam edebileceğinizi tam olarak bilmek
- Mevcut oturumunuzun ilerlemesini takip etmek
- Kullanım modellerinizi anlamak

### Maliyet Takibi

Döngüler sırasında tahmini token kullanımını ve maliyetleri takip edin:

```bash
# Maliyet takibi varsayılan olarak etkin
ralph-starter run "build X"

# Maliyet takibini devre dışı bırak
ralph-starter run "build X" --no-track-cost
```

Maliyet takibi şunları sağlar:
- Döngü sırasında gösterilen **iterasyon başına maliyet**
- Token ve maliyetin **kümülatif toplamı**
- Döngü sonunda **maliyet özeti**
- Her iterasyon için `activity.md` dosyasına **kaydedilen maliyet**
- Kalan iterasyonlar için **öngörülen maliyet** (3+ iterasyondan sonra)

Maliyet tahmini için desteklenen modeller:
- Claude 3 Opus (1M token başına $15/$75)
- Claude 3.5 Sonnet (1M token başına $3/$15)
- Claude 3.5 Haiku (1M token başına $0.25/$1.25)
- GPT-4 (1M token başına $30/$60)
- GPT-4 Turbo (1M token başına $10/$30)

## Ralph Playbook İş Akışı

ralph-starter [Ralph Playbook](https://claytonfarr.github.io/ralph-playbook/) metodolojisini takip eder:

```bash
# 1. Ralph Playbook dosyalarını başlat
ralph-starter init

# 2. specs/ klasörüne özellikler yaz

# 3. Uygulama planı oluştur
ralph-starter plan

# 4. Planı çalıştır
ralph-starter run --commit --validate
```

Bu şunları oluşturur:
- `AGENTS.md` - Ajan talimatları ve doğrulama komutları
- `PROMPT_plan.md` - Planlama prompt şablonu
- `PROMPT_build.md` - İnşa prompt şablonu
- `IMPLEMENTATION_PLAN.md` - Önceliklendirilmiş görev listesi
- `specs/` - Özellik dosyaları

## Komutlar

| Komut | Açıklama |
|---------|-------------|
| `ralph-starter` | İnteraktif sihirbazı başlat |
| `ralph-starter run [task]` | Otonom kodlama döngüsü çalıştır |
| `ralph-starter auto` | GitHub/Linear'dan issue'ları toplu işle |
| `ralph-starter integrations <action>` | Entegrasyonları yönet (list, help, test, fetch) |
| `ralph-starter plan` | Özelliklerden uygulama planı oluştur |
| `ralph-starter init` | Bir projede Ralph Playbook'u başlat |
| `ralph-starter setup` | Ortamı ve API anahtarlarını interaktif olarak yapılandır |
| `ralph-starter check` | Sistem gereksinimlerini ve bağlantıyı doğrula |
| `ralph-starter ideas` | Proje fikirleri için beyin fırtınası yap |
| `ralph-starter presets` | Mevcut iş akışı ön ayarlarını listele |
| `ralph-starter mcp` | MCP sunucusu olarak başlat |
| `ralph-starter config <action>` | Kimlik bilgilerini yönet |
| `ralph-starter source <action>` | Giriş kaynaklarını yönet (eski) |
| `ralph-starter skill add <repo>` | Ajan yeteneklerini kur |

## `run` için Seçenekler

### Ana Seçenekler

| Bayrak | Açıklama |
|------|-------------|
| `--auto` | İzin istemlerini atla **(varsayılan: true)** |
| `--no-auto` | Manuel izin onayı gerektir |
| `--commit` | Görevlerden sonra otomatik commit |
| `--push` | Commit'leri uzak sunucuya push et |
| `--pr` | Pull request oluştur |
| `--validate` | Testleri/lint/build çalıştır (backpressure) |
| `--agent <name>` | Kullanılacak ajanı belirt |
| `--max-iterations <n>` | Maksimum döngü iterasyonu (varsayılan: 50) |

### Hata Ayıklama Modu

Yürütme sırasında ayrıntılı çıktı görmek için `RALPH_DEBUG=1` kullanın:

```bash
# Ayrıntılı ajan çıktısı, zamanlama ve prompt'ları gör
RALPH_DEBUG=1 ralph-starter run "build a todo app"

# GitHub issue'suyla hata ayıklama
RALPH_DEBUG=1 ralph-starter run --from github --issue 42
```

Hata ayıklama modu şunları gösterir:
- Çalıştırılan tam komutlar
- Gerçek zamanlı ajan çıktısı
- Zamanlama bilgisi
- Hata ayrıntıları

### İş Akışı Ön Ayarları

| Bayrak | Açıklama |
|------|-------------|
| `--preset <name>` | Bir iş akışı ön ayarı kullan (feature, tdd-red-green, debug, vb.) |

```bash
# Mevcut tüm ön ayarları listele
ralph-starter presets

# Bir ön ayar kullan
ralph-starter run --preset feature "build login page"
ralph-starter run --preset tdd-red-green "add user validation"
ralph-starter run --preset debug "fix the auth bug"
```

### Çıkış Algılama

| Bayrak | Açıklama |
|------|-------------|
| `--completion-promise <string>` | Görev tamamlanmasını algılamak için özel dize |
| `--require-exit-signal` | Tamamlanma için açık `EXIT_SIGNAL: true` gerektir |

```bash
# Ajan "FEATURE_DONE" çıktısı verdiğinde dur
ralph-starter run --completion-promise "FEATURE_DONE" "build X"

# Açık çıkış sinyali gerektir
ralph-starter run --require-exit-signal "build Y"
```

### Güvenlik Kontrolleri

| Bayrak | Açıklama |
|------|-------------|
| `--rate-limit <n>` | Saat başına maksimum API çağrısı (varsayılan: sınırsız) |
| `--circuit-breaker-failures <n>` | Durmadan önce maksimum ardışık hata (varsayılan: 3) |
| `--circuit-breaker-errors <n>` | Durmadan önce maksimum aynı hata oluşumu (varsayılan: 5) |
| `--track-progress` | İlerlemeyi activity.md'ye yaz (varsayılan: true) |
| `--no-track-progress` | İlerleme takibini devre dışı bırak |
| `--track-cost` | Token kullanımını ve tahmini maliyeti takip et (varsayılan: true) |
| `--no-track-cost` | Maliyet takibini devre dışı bırak |

```bash
# Saat başına 50 API çağrısı ile sınırla
ralph-starter run --rate-limit 50 "build X"

# 2 ardışık hatadan sonra dur
ralph-starter run --circuit-breaker-failures 2 "build Y"
```

### Kaynak Seçenekleri

| Bayrak | Açıklama |
|------|-------------|
| `--from <source>` | Kaynaktan özellik getir |
| `--project <name>` | Kaynaklar için proje filtresi |
| `--label <name>` | Kaynaklar için etiket filtresi |
| `--status <status>` | Kaynaklar için durum filtresi |
| `--limit <n>` | Kaynaktan maksimum öğe |
| `--issue <n>` | Belirli issue numarası (GitHub) |
| `--output-dir <path>` | Görevi çalıştıracak dizin (istemi atlar) |
| `--prd <file>` | Görevleri markdown'dan oku |

## Yapılandırma Komutları

```bash
# Kimlik bilgilerini ayarla
ralph-starter config set linear.apiKey <key>
ralph-starter config set notion.token <token>
ralph-starter config set github.token <token>

# Yapılandırmayı görüntüle
ralph-starter config list
ralph-starter config get linear.apiKey

# Kaldır
ralph-starter config delete linear.apiKey
```

## Örnek: Bir SaaS Dashboard Oluşturma

```bash
mkdir my-saas && cd my-saas
git init

ralph-starter run "Create a SaaS dashboard with:
- User authentication (email/password)
- Stripe subscription billing
- Dashboard with usage metrics
- Dark mode support" --commit --pr --validate

# Sihri izleyin...
# Loop 1: Setting up Next.js project...
# Validation passed
# Committed: chore: initialize Next.js with TypeScript
# Loop 2: Adding authentication...
# ✓ Validation passed
# ✓ Committed: feat(auth): add NextAuth with email provider
# ...
# ✓ Created PR #1: "Build SaaS dashboard"
```

## ralph-starter'ı Test Etme

### Hızlı Test (API Anahtarı Yok)

ralph-starter'ı genel URL'lerle test edebilirsiniz - API anahtarı gerekmez:

```bash
# Genel bir GitHub gist veya ham markdown ile test et
ralph-starter run --from https://raw.githubusercontent.com/multivmlabs/ralph-starter/main/README.md

# GitHub issue'larıyla test et (gh CLI girişi gerektirir)
gh auth login
ralph-starter run --from github --project multivmlabs/ralph-starter --label "enhancement"
```

### Sihirbazı Test Etme

```bash
# İnteraktif sihirbazı başlat
ralph-starter

# Veya fikir modunu test et
ralph-starter ideas
```

### Kendi Özelliklerinizle Test Etme

```bash
# Basit bir özellik dosyası oluştur
echo "Build a simple counter app with React" > my-spec.md

# Yerel dosya ile çalıştır
ralph-starter run --from ./my-spec.md
```

### Kaynak Bağlantısını Doğrulama

Bir entegrasyonu kullanmadan önce çalıştığını doğrulayın:

```bash
# Hangi entegrasyonların mevcut olduğunu kontrol et
ralph-starter integrations list

# Her entegrasyonu test et
ralph-starter integrations test github
ralph-starter integrations test linear
ralph-starter integrations test notion

# Öğeleri önizle (dry run)
ralph-starter integrations fetch linear "My Project" --limit 3
```

## API Anahtarı Yapılandırması

### Seçenek 1: Ortam Değişkenleri (Geliştiriciler İçin Önerilen)

Ortam değişkenlerini shell profilinizde veya `.env` dosyasında ayarlayın:

```bash
# ~/.bashrc, ~/.zshrc veya .env dosyasına ekle
export LINEAR_API_KEY=lin_api_xxxxx
export NOTION_API_KEY=secret_xxxxx
export GITHUB_TOKEN=ghp_xxxxx
```

Ortam değişkenleri yapılandırma dosyasından önceliklidir.

### Seçenek 2: Yapılandırma Komutu

Kimlik bilgilerini saklamak için CLI'yi kullanın:

```bash
ralph-starter config set linear.apiKey lin_api_xxxxx
ralph-starter config set notion.token secret_xxxxx
ralph-starter config set github.token ghp_xxxxx
```

Kimlik bilgileri `~/.ralph-starter/sources.json` dosyasında saklanır.

### Ortam Değişkeni Referansı

| Kaynak | Ortam Değişkeni | Yapılandırma Anahtarı |
|--------|---------------------|------------|
| Linear | `LINEAR_API_KEY` | `linear.apiKey` |
| Notion | `NOTION_API_KEY` | `notion.token` |
| GitHub | `GITHUB_TOKEN` | `github.token` |
| Figma | `FIGMA_TOKEN` | `figma.token` |

## Gereksinimler

- Node.js 18+
- En az bir kodlama ajanı kurulu (Claude Code, Cursor, vb.)
- Git (otomasyon özellikleri için)
- GitHub CLI `gh` (PR oluşturma ve GitHub kaynağı için)

## Belgeler

Tam belgeler şu adreste mevcuttur: https://ralphstarter.ai

## Katkıda Bulunma

Katkılar memnuniyetle karşılanır! Yönergeler için [CONTRIBUTING.md](CONTRIBUTING.md) dosyasına bakın.

- **Özellik istekleri ve fikirler**: [ralph-ideas](https://github.com/multivmlabs/ralph-ideas)
- **Proje şablonları**: [ralph-templates](https://github.com/multivmlabs/ralph-templates)

Özel entegrasyonlar, ajanlar oluşturmak veya programatik API'yi kullanmak için [Geliştirici Uzantı Kılavuzu](https://ralphstarter.ai/docs/guides/extending-ralph-starter)'na bakın.

## Lisans

MIT
