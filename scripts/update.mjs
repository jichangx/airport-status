/**
 * 每日生成 README.md —— 机场跑路预警名单(摘要 + 致谢 + 引流回主站)
 * 数据来源(经授权引用,已致谢):@limbopro 公开整理的跑路机场清单
 *   https://github.com/limbopro/Paolujichang  (readme.md)
 * 本仓库仅做结构化摘要与展示,不对各条目独立断言,仅供参考;完整可搜索查询在主站。
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.jichangcha.com';
const STATUS_PAGE = `${SITE}/airport-status/`;
const SRC_URL = 'https://raw.githubusercontent.com/limbopro/Paolujichang/main/readme.md';
const SRC_REPO = 'https://github.com/limbopro/Paolujichang';
const SHOW_YEARS = ['2026', '2025', '2024'];
const MAX_ROWS = 40;

const isSep = (cells) => cells.every((c) => /^:?-{2,}:?$/.test(c) || c === '');
const idxOf = (header, re) => header.findIndex((h) => re.test(h));
const firstUrl = (s) => (s || '').trim().split(/\s+/).find((x) => /^https?:\/\//.test(x)) || '';

async function main() {
  const res = await fetch(SRC_URL, { headers: { 'User-Agent': 'jichangcha-airport-status' } });
  if (!res.ok) throw new Error(`抓取失败 HTTP ${res.status}`);
  const md = await res.text();
  const lines = md.split('\n');

  let year = '';
  let header = null;
  const seen = new Set();
  const items = [];
  for (const raw of lines) {
    const t = raw.trim();
    if (t.startsWith('#')) {
      const m = t.match(/(20\d{2})\s*年/);
      if (m) year = m[1];
      continue;
    }
    if (!t.startsWith('|')) continue;
    const cells = t.split('|').slice(1, -1).map((c) => c.trim());
    if (cells.length < 3 || isSep(cells)) continue;
    if (cells.some((c) => /名字|名称|机场名/.test(c)) && cells.some((c) => /类型|日期|备注|状态|事件|级别/.test(c))) {
      header = cells;
      continue;
    }
    if (!header) continue;
    const iName = idxOf(header, /名字|名称|机场名/);
    const iType = idxOf(header, /类型/);
    const iLevel = idxOf(header, /警告级别|状态|事件/);
    const iDate = idxOf(header, /最后更新日期/) >= 0 ? idxOf(header, /最后更新日期/) : idxOf(header, /跑路日期|日期/);
    const iNote = idxOf(header, /备注|参阅/);
    const name = (cells[iName] ?? cells[0] ?? '').replace(/\[|\]/g, '').trim();
    if (!name || /^-+$/.test(name)) continue;
    const type = (iType >= 0 ? cells[iType] : '机场') || '机场';
    const level = (iLevel >= 0 ? cells[iLevel] : '跑路') || '跑路';
    const date = iDate >= 0 ? cells[iDate] || '' : '';
    const note = iNote >= 0 ? cells[iNote] || '' : '';
    const key = name + '|' + date;
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({ name, type, level, date, note, year });
  }
  if (items.length === 0) throw new Error('未解析到任何条目,来源结构可能已变更');

  const total = items.length;
  const recent = items.filter((i) => SHOW_YEARS.includes(i.year)).slice(0, MAX_ROWS);
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const enc = (s) => encodeURIComponent(s);

  const rows = recent
    .map((i) => {
      const url = firstUrl(i.note);
      const src = url ? `[反馈](${url})` : (i.note || '—').slice(0, 20);
      return `| ${i.name} | ${i.type} | ${i.level} | ${i.year || '—'} | ${i.date || '—'} | ${src} |`;
    })
    .join('\n');

  const readme = `# 机场跑路预警名单 · 每日更新

![更新](https://img.shields.io/badge/更新-${dateStr}-fb7185) ![收录](https://img.shields.io/badge/${enc('收录预警')}-${total}%20${enc('条')}-f59e0b) [![完整查询](https://img.shields.io/badge/${enc('完整可搜索查询')}-jichangcha.com-00e676)](${STATUS_PAGE})

> ⚠️ **数据整理并引用自 [@limbopro 的公开跑路机场清单](${SRC_REPO})(经授权引用,已致谢),仅供参考,不代表本仓库独立结论。**

买机场最怕跑路——钱花了、节点没了、退款无门。这份名单帮你在下单前先查一眼:**这家是不是已经被社区反馈跑路 / 有预警了。**

## 🔎 完整可搜索查询(推荐)

本 README 仅摘录**近三年**部分条目;**全部 ${total} 条、可按机场名 / 年份 / 级别搜索筛选**的完整版在主站:

👉 **[jichangcha.com/airport-status/](${STATUS_PAGE})**

## 📋 近期跑路 / 预警机场(节选)

| 名字 | 类型 | 警告级别 | 年份 | 最后更新 | 来源 |
| ---- | ---- | ---- | ---- | ---- | ---- |
${rows}

> 完整名单(含更早年份)见 [主站查询页](${STATUS_PAGE}) 或 [原始数据源](${SRC_REPO})。

## 🙏 数据来源与致谢

本名单整理并引用自 **[@limbopro · 跑路机场清单(Paolujichang)](${SRC_REPO})** —— 一份自 2020 年持续维护、由社区共同投稿的公开资料。**衷心感谢 limbopro 及所有投稿者的长期整理与公开分享。** 本仓库仅做结构化摘要与聚合展示,版权与结论归原作者与投稿社区;如有疑义请以原仓库为准。

## 💡 怎么避开跑路

避开跑路最简单的办法,就是选**运营多年、口碑稳定**的机场,而不是图便宜赌新面孔:

- 🥈 本站主推 **[星岛梦机场](${SITE}/brands/xingdaomeng/)** —— 六年老牌、企业级内网专线、无倍率不限设备,[8 元/月起(优惠码 nmw888)](${SITE}/go/xingdaomeng/);
- 🏆 更多稳定之选见 [2026 机场推荐排行榜](${SITE}/blog/2026-jichang-paihangbang/)。

## 🔗 更多内容

- 🏠 [机场查主站](${SITE}/) —— 16 家机场横向对比 · 189 题问题库 · 图文教程
- 🚨 [机场跑路预警查询(完整版)](${STATUS_PAGE})
- 🆓 [每日免费节点](${SITE}/free-node/) · 📱 [每日共享 Apple ID](${SITE}/share-id/)
- 💬 Telegram:[@wanzuanjiedian](https://t.me/wanzuanjiedian)

## 📌 声明

- 本仓库为 [@limbopro 公开清单](${SRC_REPO}) 的结构化摘要与引用,**不对各条目做独立断言,仅供参考**;个别条目可能存在时效或争议,请自行核实。
- 每天自动同步更新;完整可搜索版在主站 [jichangcha.com/airport-status/](${STATUS_PAGE})。

⭐ 觉得有用请点个 Star,每天自动更新,你会在动态里看到。
`;

  writeFileSync(join(ROOT, 'README.md'), readme);
  console.log(`README 已生成:${dateStr} · 收录 ${total} 条 · 摘录 ${recent.length} 条`);
}

main().catch((e) => {
  console.error('出错:', e.message);
  process.exit(1);
});
