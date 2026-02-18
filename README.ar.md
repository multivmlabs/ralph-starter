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
  <strong>اربط أدواتك. شغّل حلقات الترميز بالذكاء الاصطناعي. سلّم أسرع.</strong>
</h3>

<p align="center">
  <em>اسحب المواصفات من GitHub و Linear و Notion و Figma والمزيد — ثم دع الذكاء الاصطناعي يبني بشكل مستقل.</em>
</p>

<p align="center">
  <a href="#التكاملات">التكاملات</a> •
  <a href="#البداية-السريعة">البداية السريعة</a> •
  <a href="#الميزات">الميزات</a> •
  <a href="https://ralphstarter.ai">التوثيق</a>
</p>

---


معظم أدوات الترميز بالذكاء الاصطناعي تعمل بشكل منعزل. تصف مهمة، يبنيها الذكاء الاصطناعي، انتهى.

**ralph-starter** مختلف. إنه **يتصل بسير عملك الحالي** — يسحب المواصفات من issues GitHub، وتذاكر Linear، ومستندات Notion، أو أي URL — ثم يشغل حلقات ذكاء اصطناعي مستقلة حتى تكتمل المهمة.

```bash
# البناء من GitHub issue
ralph-starter run --from github --project myorg/myrepo --label "ready"

# البناء من تذكرة Linear
ralph-starter run --from linear --project "Mobile App" --label "sprint-1"

# البناء من مواصفات Notion
ralph-starter run --from notion --project "https://notion.so/Product-Spec-abc123"

# أو ببساطة صف ما تريد
ralph-starter run "build a todo app with React" --commit
```

---

## التكاملات

يتكامل ralph-starter مع أدواتك المفضلة بشكل أصلي:

| التكامل | طريقة المصادقة | ما الذي يسحبه |
|-------------|-------------|-----------------|
| **GitHub** | `gh` CLI (موصى به) أو رمز API | Issues، PRs، الملفات |
| **Linear** | `linear` CLI أو مفتاح API | Issues حسب الفريق/المشروع |
| **Notion** | لا شيء (عام) أو رمز API (خاص) | الصفحات، قواعد البيانات |
| **Figma** | رمز API | مواصفات التصميم، الرموز، الأصول واستخراج المحتوى |
| **URLs** | لا شيء | أي markdown/HTML عام |
| **الملفات** | لا شيء | Markdown محلي، PDF |

```bash
# التحقق من التكاملات المتاحة
ralph-starter integrations list

# اختبار الاتصال
ralph-starter integrations test github
ralph-starter integrations test linear

# معاينة البيانات قبل التنفيذ
ralph-starter integrations fetch github owner/repo
```

> **تريد المزيد من التكاملات؟** PRs مرحب بها! راجع [CONTRIBUTING.md](CONTRIBUTING.md) للبدء.

---

## جدول المحتويات

- [التكاملات](#التكاملات)
- [البداية السريعة](#البداية-السريعة)
- [الميزات](#الميزات)
- [الأوامر](#الأوامر)
- [التكوين](#تكوين-مفتاح-api)
- [المساهمة](#المساهمة)

---

### الميزات الرئيسية

| الميزة | الوصف |
|---------|-------------|
| **التكاملات** | اسحب المواصفات من GitHub و Linear و Notion و Figma و URLs والملفات |
| **دعم متعدد الوكلاء** | يعمل مع Claude Code و Cursor و Copilot و Gemini CLI والمزيد |
| **معالج تفاعلي** | إنشاء مشروع موجه بمواصفات محسّنة بالذكاء الاصطناعي |
| **16+ إعداد مسبق لسير العمل** | أوضاع مُكوّنة مسبقًا: feature، tdd، debug، review والمزيد |
| **Circuit Breaker** | يوقف الحلقات المتعثرة تلقائيًا بعد فشل متكرر |
| **تتبع التكلفة** | يقدر استخدام الرموز والتكلفة لكل تكرار |
| **أتمتة Git** | الالتزام التلقائي والدفع وإنشاء PR |
| **التحقق من Backpressure** | يشغل الاختبارات/lint/build بعد كل تكرار |
| **خادم MCP** | استخدم من Claude Desktop أو أي عميل MCP |

### مثال سريع

```bash
# مهمة بسيطة
ralph-starter run "build a todo app" --commit --validate

# مع إعداد مسبق
ralph-starter run --preset tdd-red-green "add user authentication"

# مع ضوابط الأمان
ralph-starter run --rate-limit 50 --circuit-breaker-failures 3 "build X"

# معالج تفاعلي
ralph-starter
```

---

## ما هو Ralph Wiggum؟

تعرف على تقنية Ralph Wiggum في [ghuntley.com/ralph](https://ghuntley.com/ralph/).

## التثبيت

```bash
npm install -g ralph-starter
# أو
npx ralph-starter
```

بعد التثبيت، شغّل معالج الإعداد وتحقق من بيئتك:

```bash
ralph-starter setup    # تكوين مفاتيح API والتفضيلات
ralph-starter check    # التحقق من متطلبات النظام والاتصال
```

## البداية السريعة

### للجميع (غير المطورين مرحب بهم!)

ما عليك سوى تشغيل `ralph-starter` بدون وسيطات لإطلاق المعالج التفاعلي:

```bash
ralph-starter
```

سيقوم المعالج بـ:
1. السؤال إذا كان لديك فكرة مشروع (أو مساعدتك في إنشاء واحدة)
2. تحسين فكرتك بالذكاء الاصطناعي
3. السماح لك بتخصيص حزمة التقنية
4. بناء مشروعك تلقائيًا

### لا تعرف ماذا تبني؟

```bash
ralph-starter ideas
```

يطلق هذا **وضع الأفكار** - جلسة عصف ذهني لمساعدتك في اكتشاف أفكار المشاريع:
- **عصف ذهني مع الذكاء الاصطناعي** - احصل على اقتراحات إبداعية
- **شاهد الأفكار الرائجة** - بناءً على اتجاهات التكنولوجيا 2025-2026
- **بناءً على مهاراتي** - مخصص للتقنيات التي تعرفها
- **حل مشكلة** - ساعد في إصلاح شيء يحبطك

### للمطورين

```bash
# تشغيل مهمة واحدة
ralph-starter run "build a todo app with React"

# مع أتمتة git
ralph-starter run "add user authentication" --commit --pr

# مع التحقق (backpressure)
ralph-starter run "refactor auth" --commit --validate

# جلب المواصفات من مصادر خارجية
ralph-starter run --from https://example.com/spec.md
ralph-starter run --from github --project myorg/myrepo --label "ready"
ralph-starter run --from linear --project "Mobile App"

# جلب GitHub issue محدد
ralph-starter run --from github --project owner/repo --issue 123

# تحديد دليل الإخراج (يتخطى المطالبة "أين تشغل؟")
ralph-starter run --from github --project owner/repo --issue 42 --output-dir ~/projects/new-app
```

### العمل مع المشاريع الحالية

يكتشف ralph-starter تلقائيًا المشاريع الحالية عند تشغيل المعالج:

**مشروع Ralph Playbook** (يحتوي على AGENTS.md، IMPLEMENTATION_PLAN.md، إلخ):
```bash
cd my-ralph-project
ralph-starter
```
سيكتشف المعالج ملفات Ralph Playbook ويسمح لك بـ:
- متابعة العمل (تشغيل حلقة البناء)
- إعادة إنشاء خطة التنفيذ
- إضافة مواصفات جديدة

**مشروع اللغة** (يحتوي على package.json، pyproject.toml، Cargo.toml، go.mod):
```bash
cd my-existing-app
ralph-starter
```
سيكتشف المعالج نوع المشروع ويسمح لك بـ:
- إضافة ميزات إلى المشروع الحالي
- إنشاء مشروع جديد في مجلد فرعي

## الميزات

### معالج تفاعلي
ابدأ بـ `ralph-starter` (بدون وسيطات) للحصول على تجربة موجهة:
- صف فكرتك بلغة بسيطة
- يحسّن الذكاء الاصطناعي ويقترح الميزات
- اختر حزمة التقنية الخاصة بك
- يشغل تلقائيًا init → plan → build

### وضع الأفكار
للمستخدمين الذين لا يعرفون ما الذي سيبنونه بعد:
```bash
ralph-starter ideas
```

### خادم MCP
استخدم ralph-starter من Claude Desktop أو أي عميل MCP:

```bash
ralph-starter mcp
```

أضف إلى تكوين Claude Desktop:
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

**أدوات MCP المتاحة:**
- `ralph_init` - تهيئة Ralph Playbook
- `ralph_plan` - إنشاء خطة التنفيذ
- `ralph_run` - تنفيذ حلقة الترميز
- `ralph_status` - التحقق من التقدم
- `ralph_validate` - تشغيل الاختبارات/lint/build

### دعم متعدد الوكلاء
يعمل مع وكلاء الترميز المفضلين لديك:
- **Claude Code** (موصى به)
- **Cursor**
- **OpenCode**
- **OpenAI Codex**
- **GitHub Copilot**
- **Gemini CLI**
- **Amp**
- **Openclaw**

### موفرو LLM
يدعم ralph-starter موفري LLM متعددين للميزات الداخلية:

| الموفر | متغير البيئة | الوصف |
|----------|---------------------|-------------|
| **Anthropic** | `ANTHROPIC_API_KEY` | نماذج Claude (افتراضي) |
| **OpenAI** | `OPENAI_API_KEY` | GPT-4 و GPT-4o |
| **OpenRouter** | `OPENROUTER_API_KEY` | 100+ نموذج بـ API واحد |

هذه المفاتيح لاستدعاءات LLM الداخلية لـ ralph-starter. يدير وكلاء الترميز مصادقتهم الخاصة.

### أتمتة Git
```bash
ralph-starter run "your task" --commit      # التزام تلقائي بعد المهام
ralph-starter run "your task" --push        # الدفع إلى البعيد
ralph-starter run "your task" --pr          # إنشاء PR عند الانتهاء
```

### التحقق من Backpressure
```bash
ralph-starter run "your task" --validate    # تشغيل الاختبارات/lint/build بعد كل تكرار
```

يشغل علامة `--validate` أوامر الاختبار و lint و build (من AGENTS.md أو package.json) بعد كل تكرار. إذا فشل التحقق، يحصل الوكيل على ملاحظات لإصلاح المشكلات.

### الإعدادات المسبقة لسير العمل

إعدادات مُكوّنة مسبقًا لسيناريوهات التطوير الشائعة:

```bash
# سرد جميع الـ 16+ إعداد مسبق
ralph-starter presets

# استخدام إعداد مسبق
ralph-starter run --preset feature "build login"
ralph-starter run --preset tdd-red-green "add tests"
ralph-starter run --preset debug "fix the bug"
ralph-starter run --preset refactor "clean up auth module"
ralph-starter run --preset pr-review "review changes"
```

**الإعدادات المسبقة المتاحة:**
| الفئة | الإعدادات المسبقة |
|----------|---------|
| التطوير | `feature`، `feature-minimal`، `tdd-red-green`، `spec-driven`، `refactor` |
| تصحيح الأخطاء | `debug`، `incident-response`، `code-archaeology` |
| المراجعة | `review`، `pr-review`، `adversarial-review` |
| التوثيق | `docs`، `documentation-first` |
| متخصص | `api-design`، `migration-safety`، `performance-optimization`، `scientific-method`، `research`، `gap-analysis` |

### Circuit Breaker

يوقف تلقائيًا الحلقات المتعثرة:

```bash
# التوقف بعد 3 إخفاقات متتالية (افتراضي)
ralph-starter run "build X" --validate

# عتبات مخصصة
ralph-starter run "build X" --circuit-breaker-failures 2 --circuit-breaker-errors 3
```

يراقب Circuit breaker:
- **الفشل المتتالي**: يتوقف بعد N فشل تحقق على التوالي
- **عدد الأخطاء المتماثلة**: يتوقف إذا تكرر نفس الخطأ N مرات

### تتبع التقدم

يكتب سجلات التكرار إلى `activity.md`:

```bash
# ممكّن بشكل افتراضي
ralph-starter run "build X"

# تعطيل إذا لم يكن مطلوبًا
ralph-starter run "build X" --no-track-progress
```

يسجل كل تكرار:
- الطابع الزمني والمدة
- الحالة (مكتمل، فشل، محظور)
- نتائج التحقق
- معلومات الالتزام

### الإكمال على أساس الملف

تتحقق الحلقة تلقائيًا من إشارات الإكمال:
- ملف `RALPH_COMPLETE` في جذر المشروع
- ملف علامة `.ralph-done`
- جميع المهام محددة `[x]` في `IMPLEMENTATION_PLAN.md`

### تحديد المعدل

تحكم في تكرار استدعاءات API لإدارة التكاليف:

```bash
# الحد إلى 50 استدعاء في الساعة
ralph-starter run --rate-limit 50 "build X"
```

**عند الوصول إلى حدود المعدل**، يعرض ralph-starter إحصائيات مفصلة:

```
⚠ تم الوصول إلى حد معدل Claude

إحصائيات حد المعدل:
  • استخدام الجلسة: 100% (50K / 50K رمز)
  • الطلبات المقدمة: 127 هذه الساعة
  • الوقت حتى إعادة التعيين: ~47 دقيقة (إعادة تعيين في 04:30 UTC)

تقدم الجلسة:
  • المهام المكتملة: 3/5
  • المهمة الحالية: "Add swarm mode CLI flags"
  • الفرع: auto/github-54
  • التكرارات المكتملة: 12

لاستئناف عند إعادة تعيين الحد:
  ralph-starter run

نصيحة: تحقق من حدودك على https://claude.ai/settings
```

يساعدك هذا على:
- معرفة متى يمكنك الاستئناف بالضبط
- تتبع تقدم جلستك الحالية
- فهم أنماط استخدامك

### تتبع التكلفة

تتبع الاستخدام المقدر للرموز والتكاليف أثناء الحلقات:

```bash
# تتبع التكلفة ممكّن بشكل افتراضي
ralph-starter run "build X"

# تعطيل تتبع التكلفة
ralph-starter run "build X" --no-track-cost
```

يوفر تتبع التكلفة:
- **التكلفة لكل تكرار** معروضة أثناء الحلقة
- **الإجمالي التراكمي** للرموز والتكلفة
- **ملخص التكلفة** في نهاية الحلقة
- **التكلفة المسجلة** في `activity.md` لكل تكرار
- **التكلفة المتوقعة** للتكرارات المتبقية (بعد 3+ تكرارات)

النماذج المدعومة لتقدير التكلفة:
- Claude 3 Opus ($15/$75 لكل 1M رمز)
- Claude 3.5 Sonnet ($3/$15 لكل 1M رمز)
- Claude 3.5 Haiku ($0.25/$1.25 لكل 1M رمز)
- GPT-4 ($30/$60 لكل 1M رمز)
- GPT-4 Turbo ($10/$30 لكل 1M رمز)

## سير عمل Ralph Playbook

يتبع ralph-starter منهجية [Ralph Playbook](https://claytonfarr.github.io/ralph-playbook/):

```bash
# 1. تهيئة ملفات Ralph Playbook
ralph-starter init

# 2. كتابة المواصفات في مجلد specs/

# 3. إنشاء خطة التنفيذ
ralph-starter plan

# 4. تنفيذ الخطة
ralph-starter run --commit --validate
```

ينشئ هذا:
- `AGENTS.md` - تعليمات الوكيل وأوامر التحقق
- `PROMPT_plan.md` - قالب prompt التخطيط
- `PROMPT_build.md` - قالب prompt البناء
- `IMPLEMENTATION_PLAN.md` - قائمة المهام ذات الأولوية
- `specs/` - ملفات المواصفات

## الأوامر

| الأمر | الوصف |
|---------|-------------|
| `ralph-starter` | إطلاق المعالج التفاعلي |
| `ralph-starter run [task]` | تشغيل حلقة ترميز مستقلة |
| `ralph-starter auto` | معالجة issues دفعة واحدة من GitHub/Linear |
| `ralph-starter integrations <action>` | إدارة التكاملات (list، help، test، fetch) |
| `ralph-starter plan` | إنشاء خطة التنفيذ من المواصفات |
| `ralph-starter init` | تهيئة Ralph Playbook في مشروع |
| `ralph-starter setup` | تكوين البيئة ومفاتيح API بشكل تفاعلي |
| `ralph-starter check` | التحقق من متطلبات النظام والاتصال |
| `ralph-starter ideas` | عصف ذهني لأفكار المشاريع |
| `ralph-starter presets` | سرد الإعدادات المسبقة المتاحة لسير العمل |
| `ralph-starter mcp` | البدء كخادم MCP |
| `ralph-starter config <action>` | إدارة بيانات الاعتماد |
| `ralph-starter source <action>` | إدارة مصادر الإدخال (قديم) |
| `ralph-starter skill add <repo>` | تثبيت مهارات الوكيل |

## خيارات لـ `run`

### الخيارات الرئيسية

| العلامة | الوصف |
|------|-------------|
| `--auto` | تخطي مطالبات الإذن **(افتراضي: true)** |
| `--no-auto` | طلب موافقة الإذن اليدوي |
| `--commit` | التزام تلقائي بعد المهام |
| `--push` | دفع الالتزامات إلى البعيد |
| `--pr` | إنشاء pull request |
| `--validate` | تشغيل الاختبارات/lint/build (backpressure) |
| `--agent <name>` | تحديد الوكيل المراد استخدامه |
| `--max-iterations <n>` | الحد الأقصى لتكرارات الحلقة (افتراضي: 50) |

### وضع التصحيح

استخدم `RALPH_DEBUG=1` لرؤية الإخراج التفصيلي أثناء التنفيذ:

```bash
# رؤية الإخراج التفصيلي للوكيل والتوقيت والمطالبات
RALPH_DEBUG=1 ralph-starter run "build a todo app"

# التصحيح مع GitHub issue
RALPH_DEBUG=1 ralph-starter run --from github --issue 42
```

يعرض وضع التصحيح:
- الأوامر الدقيقة التي يتم تشغيلها
- إخراج الوكيل في الوقت الفعلي
- معلومات التوقيت
- تفاصيل الخطأ

### الإعدادات المسبقة لسير العمل

| العلامة | الوصف |
|------|-------------|
| `--preset <name>` | استخدام إعداد مسبق لسير العمل (feature، tdd-red-green، debug، إلخ) |

```bash
# سرد جميع الإعدادات المسبقة المتاحة
ralph-starter presets

# استخدام إعداد مسبق
ralph-starter run --preset feature "build login page"
ralph-starter run --preset tdd-red-green "add user validation"
ralph-starter run --preset debug "fix the auth bug"
```

### كشف الخروج

| العلامة | الوصف |
|------|-------------|
| `--completion-promise <string>` | سلسلة مخصصة لاكتشاف إكمال المهمة |
| `--require-exit-signal` | طلب `EXIT_SIGNAL: true` صريح للإكمال |

```bash
# التوقف عندما يُخرج الوكيل "FEATURE_DONE"
ralph-starter run --completion-promise "FEATURE_DONE" "build X"

# طلب إشارة خروج صريحة
ralph-starter run --require-exit-signal "build Y"
```

### ضوابط الأمان

| العلامة | الوصف |
|------|-------------|
| `--rate-limit <n>` | الحد الأقصى لاستدعاءات API في الساعة (افتراضي: غير محدود) |
| `--circuit-breaker-failures <n>` | الحد الأقصى للإخفاقات المتتالية قبل التوقف (افتراضي: 3) |
| `--circuit-breaker-errors <n>` | الحد الأقصى لحدوث نفس الخطأ قبل التوقف (افتراضي: 5) |
| `--track-progress` | كتابة التقدم إلى activity.md (افتراضي: true) |
| `--no-track-progress` | تعطيل تتبع التقدم |
| `--track-cost` | تتبع استخدام الرموز والتكلفة المقدرة (افتراضي: true) |
| `--no-track-cost` | تعطيل تتبع التكلفة |

```bash
# الحد إلى 50 استدعاء API في الساعة
ralph-starter run --rate-limit 50 "build X"

# التوقف بعد إخفاقين متتاليين
ralph-starter run --circuit-breaker-failures 2 "build Y"
```

### خيارات المصدر

| العلامة | الوصف |
|------|-------------|
| `--from <source>` | جلب المواصفات من المصدر |
| `--project <name>` | مُصفّي المشروع للمصادر |
| `--label <name>` | مُصفّي التسمية للمصادر |
| `--status <status>` | مُصفّي الحالة للمصادر |
| `--limit <n>` | الحد الأقصى للعناصر من المصدر |
| `--issue <n>` | رقم issue محدد (GitHub) |
| `--output-dir <path>` | الدليل لتشغيل المهمة (يتخطى المطالبة) |
| `--prd <file>` | قراءة المهام من markdown |

## أوامر التكوين

```bash
# تعيين بيانات الاعتماد
ralph-starter config set linear.apiKey <key>
ralph-starter config set notion.token <token>
ralph-starter config set github.token <token>

# عرض التكوين
ralph-starter config list
ralph-starter config get linear.apiKey

# حذف
ralph-starter config delete linear.apiKey
```

## مثال: بناء لوحة تحكم SaaS

```bash
mkdir my-saas && cd my-saas
git init

ralph-starter run "Create a SaaS dashboard with:
- User authentication (email/password)
- Stripe subscription billing
- Dashboard with usage metrics
- Dark mode support" --commit --pr --validate

# شاهد السحر يحدث...
# Loop 1: Setting up Next.js project...
# Validation passed
# Committed: chore: initialize Next.js with TypeScript
# Loop 2: Adding authentication...
# ✓ Validation passed
# ✓ Committed: feat(auth): add NextAuth with email provider
# ...
# ✓ Created PR #1: "Build SaaS dashboard"
```

## اختبار ralph-starter

### اختبار سريع (بدون مفاتيح API)

يمكنك اختبار ralph-starter بـ URLs عامة - لا حاجة لمفاتيح API:

```bash
# اختبار مع GitHub gist عام أو markdown خام
ralph-starter run --from https://raw.githubusercontent.com/multivmlabs/ralph-starter/main/README.md

# اختبار مع GitHub issues (يتطلب تسجيل دخول gh CLI)
gh auth login
ralph-starter run --from github --project multivmlabs/ralph-starter --label "enhancement"
```

### اختبار المعالج

```bash
# إطلاق المعالج التفاعلي
ralph-starter

# أو اختبار وضع الأفكار
ralph-starter ideas
```

### الاختبار بمواصفاتك الخاصة

```bash
# إنشاء ملف مواصفات بسيط
echo "Build a simple counter app with React" > my-spec.md

# التشغيل مع ملف محلي
ralph-starter run --from ./my-spec.md
```

### التحقق من اتصال المصدر

قبل استخدام التكامل، تحقق من أنه يعمل:

```bash
# التحقق من التكاملات المتاحة
ralph-starter integrations list

# اختبار كل تكامل
ralph-starter integrations test github
ralph-starter integrations test linear
ralph-starter integrations test notion

# معاينة العناصر (dry run)
ralph-starter integrations fetch linear "My Project" --limit 3
```

## تكوين مفتاح API

### الخيار 1: متغيرات البيئة (موصى به للمطورين)

عيّن متغيرات البيئة في ملف تعريف shell أو ملف `.env`:

```bash
# أضف إلى ~/.bashrc، ~/.zshrc، أو ملف .env
export LINEAR_API_KEY=lin_api_xxxxx
export NOTION_API_KEY=secret_xxxxx
export GITHUB_TOKEN=ghp_xxxxx
```

متغيرات البيئة لها الأولوية على ملف التكوين.

### الخيار 2: أمر التكوين

استخدم CLI لتخزين بيانات الاعتماد:

```bash
ralph-starter config set linear.apiKey lin_api_xxxxx
ralph-starter config set notion.token secret_xxxxx
ralph-starter config set github.token ghp_xxxxx
```

يتم تخزين بيانات الاعتماد في `~/.ralph-starter/sources.json`.

### مرجع متغير البيئة

| المصدر | متغير البيئة | مفتاح التكوين |
|--------|---------------------|------------|
| Linear | `LINEAR_API_KEY` | `linear.apiKey` |
| Notion | `NOTION_API_KEY` | `notion.token` |
| GitHub | `GITHUB_TOKEN` | `github.token` |
| Figma | `FIGMA_TOKEN` | `figma.token` |

## المتطلبات

- Node.js 18+
- وكيل ترميز واحد على الأقل مثبت (Claude Code، Cursor، إلخ)
- Git (لميزات الأتمتة)
- GitHub CLI `gh` (لإنشاء PR ومصدر GitHub)

## التوثيق

التوثيق الكامل متوفر على: https://ralphstarter.ai

## المساهمة

المساهمات مرحب بها! راجع [CONTRIBUTING.md](CONTRIBUTING.md) للحصول على الإرشادات.

- **طلبات الميزات والأفكار**: [ralph-ideas](https://github.com/multivmlabs/ralph-ideas)
- **قوالب المشاريع**: [ralph-templates](https://github.com/multivmlabs/ralph-templates)

لإنشاء تكاملات مخصصة أو وكلاء أو استخدام API البرمجي، راجع [دليل توسيع المطور](https://ralphstarter.ai/docs/guides/extending-ralph-starter).

## الترخيص

MIT
