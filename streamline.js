void (function D2MOD_V4_LITE() {
if (window.__D2MOD_V4_LOADED) return;
window.__D2MOD_V4_LOADED = true;

const D2ZH_VERSION = 'V4大神精簡版';
window.__D2ZH_VERSION = D2ZH_VERSION;
const UI_FONT = '"Microsoft JhengHei UI", "Microsoft JhengHei", "Noto Sans TC", "PingFang TC", sans-serif';
const D2ED = {
player: null, extras: null, world: null, build: null,
added: new WeakMap(), changed: new WeakMap(), kept: new WeakSet(),
button: null, pullBtn: null, shinraBtn: null, panel: null, presetName: ''
};
const D2ED_SAVE_KEY = 'd2-survivors/save/v1';
const D2ED_ELEMENTS = ['fire', 'cold', 'lightning', 'poison', 'magic'];
const D2ED_ATTR_BASE = {
amazon: { strength: 20, dexterity: 25, vitality: 20, energy: 15 },
assassin: { strength: 20, dexterity: 20, vitality: 20, energy: 25 },
barbarian: { strength: 30, dexterity: 20, vitality: 25, energy: 10 },
druid: { strength: 15, dexterity: 20, vitality: 25, energy: 20 },
necromancer: { strength: 15, dexterity: 25, vitality: 15, energy: 25 },
paladin: { strength: 25, dexterity: 20, vitality: 25, energy: 15 },
sorceress: { strength: 10, dexterity: 25, vitality: 10, energy: 35 },
};
const D2ED_LIFE_PER_VIT = { amazon: 6, assassin: 6, barbarian: 8, druid: 4, necromancer: 4, paladin: 6, sorceress: 4 };
const D2ED_EXTRA_MAX = 999;
const D2ED_RANKS = [
['strength', '力量（每級起始 +5）', 10, true], ['dexterity', '敏捷（每級起始 +5）', 10, true],
['vitality', '體力（每級起始 +5）', 10, true], ['energy', '精力（每級起始 +5）', 10, true],
['goldFind', '尋獲金幣（每級 +10%）', 10, true], ['magicFind', '尋獲魔法物品（每級 +10%）', 10, true],
['damageReduced', '傷害減少（每級 2%）', 5, true], ['replenish', '補充生命（每級每秒 +0.25）', 5, true],
['frw', '跑步／行走速度（每級 +5%）', 5, true], ['fcr', '施法速度（每級 +4%）', 5, true],
['sellPrice', '出售價格（每級 +10%）', 5, true], ['potions', '藥水治療量（每級 +10%）', 5, true],
['experience', '經驗值獲得（每級 +2%）', 5, true],
['firePierce', '火焰穿透（每級敵人抗性 -2%）', 5, true], ['coldPierce', '冰寒穿透（每級敵人抗性 -2%）', 5, true],
['lightningPierce', '閃電穿透（每級敵人抗性 -2%）', 5, true], ['poisonPierce', '毒素穿透（每級敵人抗性 -2%）', 5, true],
['physicalPierce', '物理穿透（每級敵人抗性 -2%）', 5, true],
['mercLife', '傭兵生命（每級 +6%）', 5, true], ['mercResist', '傭兵抗性（每級 +5）', 5, true],
['mercDefense', '傭兵防禦（每級 +10%）', 5, true],
['rerolls', '重抽次數', 3, false], ['skips', '略過次數', 3, false], ['banishes', '放逐次數', 3, false], ['resurrect', '復活次數', 2, false],
];
function d2edExtraWorth(n) {
let s = 0;
for (let k = 1; k <= n; k++) s += 0.2 / Math.sqrt(k);
return s;
}
const D2ED_FIELDS = [
['life', '目前生命', '', 0], ['maxLife', '生命上限', '', 0], ['regen', '每秒恢復生命', '', 1],
['speed', '移動速度', '一開始是 150', 0], ['pickupRadius', '拾取範圍', '一開始是 70', 0],
['might', '傷害倍率', '所有技能，1 = 原本', 2], ['weaponDamage', '攻擊傷害倍率', '武器技能，1 = 原本', 2],
['castSpeed', '技能冷卻倍率', '越小越快，0.5 = 冷卻減半', 2], ['damageTaken', '受到傷害倍率', '0 = 無敵', 2],
['crit', '致命一擊機率', '0.25 = 25%', 2], ['allSkills', '所有技能等級', '+N 級', 0],
['magicFind', '尋獲魔法物品', '%', 0], ['goldGain', '金幣獲得倍率', '1 = 原本', 2],
['mastery.physical', '物理加成', '力量每 5 點 +0.05', 2], ['mastery.fire', '火焰加成', '', 2],
['mastery.cold', '冰寒加成', '', 2], ['mastery.lightning', '閃電加成', '', 2],
['mastery.poison', '毒素加成', '', 2], ['mastery.magic', '魔法加成', '', 2],
];
function d2edInRun() {
return !!D2ED.player && !document.body.classList.contains('no-run');
}
function d2edGet(path) {
const p = D2ED.player;
if (path === 'crit') return D2ED.extras ? D2ED.extras.crit : NaN;
const [a, b] = path.split('.');
return b ? p[a][b] : p[a];
}
function d2edSet(path, v) {
const p = D2ED.player;
if (path === 'crit') { if (D2ED.extras) D2ED.extras.crit = v; return; }
const [a, b] = path.split('.');
if (b) p[a][b] = v; else p[a] = v;
}
function d2edBuildInstall() {
if (Object.prototype.hasOwnProperty('unspent')) return;
Object.defineProperty(Object.prototype, 'unspent', {
configurable: true, enumerable: false,
get() { if (this && this.attributes && this.banished instanceof Set && this.kit) D2ED.build = this; return undefined; },
set(v) { Object.defineProperty(this, 'unspent', { value: v, writable: true, enumerable: true, configurable: true }); },
});
}
function d2edBuildOf(p) {
const b = D2ED.build;
return b && b.kit && b.kit.id === p.cls && b.attributes && typeof b.attributes.strength === 'number' ? b : null;
}
function d2edAttribute(attr, n) {
const p = D2ED.player;
const build = d2edBuildOf(p);
if (build) {
const h = build.history || (build.history = []);
if (n > 0) for (let i = 0; i < n; i++) { h.push('attribute:' + attr); build.attributes[attr] += 5; }
else for (let i = 0; i < -n; i++) {
const at = h.lastIndexOf('attribute:' + attr);
if (at < 0) { n = -i; break; }
h.splice(at, 1);
build.attributes[attr] -= 5;
}
if (!n) return false;
}
if (attr === 'strength') {
p.mastery.physical += 0.05 * n;
p.strDamage = (p.strDamage || 0) + 0.05 * n;
} else if (attr === 'dexterity') {
if (D2ED.extras) D2ED.extras.crit += 0.01 * n;
p.dexDamage = (p.dexDamage || 0) + 0.03 * n;
p.dexterity = (p.dexterity || 0) + 5 * n;
} else if (attr === 'vitality') {
const life = (D2ED_LIFE_PER_VIT[p.cls] || 6) * 5 * n;
p.maxLife = Math.max(1, p.maxLife + life);
p.life = Math.max(1, Math.min(p.maxLife, p.life + life));
} else if (attr === 'energy') {
for (const el of D2ED_ELEMENTS) p.mastery[el] += 0.05 * n;
p.energyDamage = (p.energyDamage || 0) + 0.05 * n;
}
const added = D2ED.added.get(p) || {};
added[attr] = (added[attr] || 0) + 5 * n;
D2ED.added.set(p, added);
return true;
}
const D2ED_KEEP_KEY = 'd2ed:runKeep';
const D2ED_KEEP_SKIP = new Set(['life']);
function d2edKeepRead() {
try { const v = JSON.parse(localStorage.getItem(D2ED_KEEP_KEY)); return v && typeof v === 'object' ? { fields: v.fields || {}, attrs: v.attrs || {} } : null; } catch (_) { return null; }
}
function d2edKeepWrite(keep) {
try { keep ? localStorage.setItem(D2ED_KEEP_KEY, JSON.stringify(keep)) : localStorage.removeItem(D2ED_KEEP_KEY); } catch (e) { alert('無法儲存設定：' + e); }
}
const D2ED_PRESET_KEY = 'd2ed:runPresets';
const D2ED_PRESET_MAX = 20;
function d2edPresetsRead() {
try {
const v = JSON.parse(localStorage.getItem(D2ED_PRESET_KEY));
return Array.isArray(v) ? v.filter(x => x && typeof x.name === 'string').map(x => ({ name: x.name, fields: x.fields || {}, attrs: x.attrs || {} })) : [];
} catch (_) { return []; }
}
function d2edPresetsWrite(list) {
try { localStorage.setItem(D2ED_PRESET_KEY, JSON.stringify(list)); return true; } catch (e) { alert('無法儲存組合：' + e); return false; }
}
function d2edPresetApply(p, preset) {
for (const [path] of D2ED_FIELDS) {
const v = preset.fields[path];
if (typeof v === 'number' && Number.isFinite(v)) { d2edSet(path, v); d2edChanged(p)[path] = v; }
}
if (typeof preset.fields.maxLife === 'number') p.life = Math.min(p.life, p.maxLife);
const added = D2ED.added.get(p) || {};
let short = false;
for (const attr of ['strength', 'dexterity', 'vitality', 'energy']) {
const n = Math.trunc(((preset.attrs[attr] || 0) - (added[attr] || 0)) / 5);
if (n && !d2edAttribute(attr, n)) short = true;
}
const now = D2ED.added.get(p) || {};
if (['strength', 'dexterity', 'vitality', 'energy'].some(a => (now[a] || 0) !== (preset.attrs[a] || 0))) short = true;
return !short;
}
function d2edChanged(p) {
let c = D2ED.changed.get(p);
if (!c) D2ED.changed.set(p, c = {});
return c;
}
function d2edKeepApply(p) {
const keep = d2edKeepRead();
if (!keep || D2ED.player !== p || D2ED.kept.has(p) || !d2edUnlocked() || !d2edInRun()) return;
D2ED.kept.add(p);
for (const [path] of D2ED_FIELDS) {
const v = keep.fields[path];
if (typeof v === 'number' && Number.isFinite(v)) { d2edSet(path, v); d2edChanged(p)[path] = v; }
}
if (typeof keep.fields.maxLife === 'number') p.life = p.maxLife;
const build = d2edBuildOf(p);
if (build && (build.history || []).length) D2ED.added.set(p, { ...keep.attrs });
else for (const [attr, points] of Object.entries(keep.attrs)) {
const n = Math.trunc(points / 5);
if (n && ['strength', 'dexterity', 'vitality', 'energy'].includes(attr)) d2edAttribute(attr, n);
}
if (D2ED.panel) d2edRender();
}
function d2edKeepNotice() {
const card = D2ED.panel && D2ED.panel.querySelector('.d2ed-card');
if (!card || card.querySelector('.d2ed-modal')) return;
const modal = d2edEl('div', { class: 'd2ed-modal' });
modal.append(d2edEl('div', { class: 'd2ed-modal-box', role: 'alertdialog', 'aria-label': '記住修改的說明' },
d2edEl('b', {}, '已記住這些修改'),
d2edEl('ul', {}, d2edEl('li', {}, '「目前生命」不會記，因為每一局都不一樣。')),
d2edEl('div', { class: 'd2ed-row' }, d2edEl('button', { type: 'button', class: 'd2ed-main', onclick: () => modal.remove() }, '知道了'))));
card.append(modal);
}
function d2edKeepSchedule(p) {
if (D2ED.kept.has(p)) return;
setTimeout(() => d2edKeepApply(p), 1500);
}
function d2edReadSave() {
try { return JSON.parse(localStorage.getItem(D2ED_SAVE_KEY) || '{}') || {}; } catch (_) { return {}; }
}
const D2ED_RUN_COUNTS = [['rerolls', 'build'], ['skips', 'build'], ['banishes', 'build'], ['resurrect', 'hero', 'revives']];
function d2edSyncRunCounts(save, oldRanks, newRanks) {
for (const hero of Object.values(save.heroes || {})) {
const run = hero && hero.run;
if (!run || typeof run !== 'object') continue;
for (const [rank, part, field = rank] of D2ED_RUN_COUNTS) {
const box = run[part], diff = (newRanks[rank] || 0) - (oldRanks[rank] || 0);
if (!diff || !box || typeof box[field] !== 'number') continue;
box[field] = Math.max(0, Math.min(99, box[field] + diff));
}
}
}
function d2edWriteSaveAndReload(gold, ranks) {
const write = () => {
const save = d2edReadSave();
save.gold = gold;
save.ranks = save.ranks || {};
d2edSyncRunCounts(save, save.ranks, ranks);
const extra = { ...(save.extraRanks || {}) };
for (const [k, max] of D2ED_RANKS.map(r => [r[0], r[2]])) {
if (!(k in ranks)) continue;
const v = ranks[k];
if (v > 0) save.ranks[k] = Math.min(v, max); else delete save.ranks[k];
if (v > max) extra[k] = v - max; else delete extra[k];
}
if (Object.keys(extra).length) save.extraRanks = extra; else delete save.extraRanks;
try { localStorage.setItem(D2ED_SAVE_KEY, JSON.stringify(save)); } catch (e) { alert('存檔寫入失敗：' + e); }
};
write();
addEventListener('pagehide', write);
location.reload();
}
function d2edEl(tag, attrs, ...kids) {
const e = document.createElement(tag);
for (const [k, v] of Object.entries(attrs || {})) {
if (k === 'style') e.style.cssText = v;
else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
else e.setAttribute(k, v);
}
for (const k of kids) if (k != null) e.append(k);
return e;
}
function d2edRound(v, digits) {
return Number.isFinite(v) ? String(Number(v.toFixed(digits))) : '';
}
function d2edToast(msg) {
const t = D2ED.panel && D2ED.panel.querySelector('.d2ed-msg');
if (!t) return;
t.textContent = msg;
clearTimeout(t._h);
t._h = setTimeout(() => { t.textContent = ''; }, 2500);
}
function d2edRunSection() {
const box = d2edEl('section', { class: 'd2ed-sec' }, d2edEditTitle('本局人物'));
if (!d2edInRun()) {
box.append(d2edEl('p', { class: 'd2ed-note' },
D2ED.player ? '目前不在遊戲中。進入遊戲後即可直接修改。'
: '還沒抓到人物資料：進入遊戲、打到第一隻怪物後就會出現。'));
return box;
}
const p = D2ED.player;
const added = D2ED.added.get(p) || {};
const remember = () => {
if (!d2edKeepRead()) return;
const fields = {};
for (const [path, v] of Object.entries(d2edChanged(p))) if (!D2ED_KEEP_SKIP.has(path)) fields[path] = v;
d2edKeepWrite({ fields, attrs: { ...(D2ED.added.get(p) || {}) } });
};
const attrs = d2edEl('div', { class: 'd2ed-attrs' });
const build = d2edBuildOf(p);
for (const [k, name] of [['strength', '力量'], ['dexterity', '敏捷'], ['vitality', '體力'], ['energy', '精力']]) {
const count = d2edEl('span', { class: 'd2ed-count' }, added[k] ? (added[k] > 0 ? '+' : '') + added[k] : '0');
const btn = (label, n) => d2edEl('button', { type: 'button', onclick: () => {
if (!d2edAttribute(k, n)) { d2edToast(`${name}沒有升級時加的點數可以減了`); return; }
remember(); d2edRender();
} }, label);
const now = build && D2ED_ATTR_BASE[p.cls] ? d2edEl('small', { class: 'd2ed-now' }, '目前 ' + (D2ED_ATTR_BASE[p.cls][k] + build.attributes[k])) : null;
attrs.append(d2edEl('div', { class: 'd2ed-attr' }, d2edEl('b', {}, name, now), btn('－5', -1), count, btn('＋5', 1)));
}
box.append(d2edEl('p', { class: 'd2ed-note' }, '屬性加減跟升級時選屬性卡一樣，按下就生效（不用按套用），角色畫面的數值也會跟著變；進到下一幕之後，「儲存並離開」再繼續也會保留。中間是用書籤加減的點數。'), attrs);
const grid = d2edEl('div', { class: 'd2ed-grid' });
const inputs = [];
for (const [path, name, hint, digits] of D2ED_FIELDS) {
const input = d2edEl('input', { type: 'number', step: digits ? String(1 / 10 ** digits) : '1', value: d2edRound(d2edGet(path), digits) });
input.dataset.shown = input.value;
inputs.push([path, input]);
grid.append(d2edEl('label', {}, d2edEl('span', {}, name, hint ? d2edEl('small', {}, hint) : ''), input));
}
const apply = () => {
let n = 0;
for (const [path, input] of inputs) {
const v = Number(input.value);
if (input.value === '' || !Number.isFinite(v) || input.value === input.dataset.shown) continue;
if (Math.abs(v - d2edGet(path)) > 1e-9) { d2edSet(path, v); d2edChanged(p)[path] = v; n++; }
}
if (p.life > p.maxLife) p.life = p.maxLife;
remember();
d2edRender();
d2edToast(n ? `已套用 ${n} 項` : '下面的欄位沒有變更（上方屬性 ±5 按下就已生效）');
};
const keep = d2edKeepRead();
const keepBox = d2edEl('input', { type: 'checkbox' });
keepBox.checked = !!keep;
keepBox.addEventListener('change', () => {
if (keepBox.checked) { d2edKeepWrite({ fields: {}, attrs: {} }); remember(); D2ED.kept.add(p); }
else d2edKeepWrite(null);
d2edRender();
d2edToast(keepBox.checked ? '已記住目前的修改' : '已取消記住');
if (keepBox.checked) d2edKeepNotice();
});
const keepCount = keep ? Object.keys(keep.fields).length + Object.values(keep.attrs).filter(Boolean).length : 0;
const presets = d2edPresetsRead();
const pick = d2edEl('select', { class: 'd2ed-preset', 'aria-label': '修改組合' },
d2edEl('option', { value: '' }, presets.length ? `已存的組合（${presets.length}/${D2ED_PRESET_MAX}）` : '還沒有存組合'),
...presets.map((x, i) => d2edEl('option', { value: String(i) }, x.name)));
const nameBox = d2edEl('input', { type: 'text', class: 'd2ed-preset-name', maxlength: '20', placeholder: '組合名稱' });
const chosen = () => pick.value === '' ? -1 : Number(pick.value);
const keepPick = name => { D2ED.presetName = name || ''; };
const was = presets.findIndex(x => x.name === D2ED.presetName);
if (was >= 0) { pick.value = String(was); nameBox.value = presets[was].name; }
pick.addEventListener('change', () => { nameBox.value = chosen() >= 0 ? presets[chosen()].name : ''; keepPick(nameBox.value); sync(); });
const current = () => {
const fields = {};
for (const [path, v] of Object.entries(d2edChanged(p))) if (!D2ED_KEEP_SKIP.has(path)) fields[path] = v;
const attrs = {};
for (const [k, v] of Object.entries(D2ED.added.get(p) || {})) if (v) attrs[k] = v;
return { fields, attrs };
};
const savePreset = () => {
const name = nameBox.value.trim().slice(0, 20);
const at = name ? presets.findIndex(x => x.name === name) : -1;
if (at < 0 && presets.length >= D2ED_PRESET_MAX) { d2edToast(`最多只能存 ${D2ED_PRESET_MAX} 筆，請先刪除或覆蓋舊的`); return; }
const cur = current();
if (!Object.keys(cur.fields).length && !Object.keys(cur.attrs).length) { d2edToast('目前沒有修改可以存'); return; }
let finalName = name;
for (let n = presets.length + 1; !finalName; n++) if (!presets.some(x => x.name === '組合 ' + n)) finalName = '組合 ' + n;
const list = presets.slice();
if (at >= 0) list[at] = { name: finalName, ...cur }; else list.push({ name: finalName, ...cur });
if (!d2edPresetsWrite(list)) return;
keepPick(finalName);
d2edRender();
d2edToast(at >= 0 ? `已覆蓋「${finalName}」` : `已存成「${finalName}」`);
};
const loadPreset = () => {
const x = presets[chosen()];
if (!x) return;
const all = d2edPresetApply(p, x);
remember();
d2edRender();
d2edToast(all ? `已套用「${x.name}」` : `已套用「${x.name}」（有屬性沒有升級時加的點數可以減，沒有全部減到）`);
};
const renamePreset = () => {
const i = chosen(), name = nameBox.value.trim().slice(0, 20);
if (i < 0 || !name) return;
if (presets.some((x, j) => j !== i && x.name === name)) { d2edToast('已經有同名的組合'); return; }
const list = presets.slice();
list[i] = { ...list[i], name };
if (d2edPresetsWrite(list)) { keepPick(name); d2edRender(); d2edToast(`已改名為「${name}」`); }
};
const deletePreset = () => {
const i = chosen();
if (i < 0 || !confirm(`刪除組合「${presets[i].name}」？`)) return;
const list = presets.slice();
list.splice(i, 1);
if (d2edPresetsWrite(list)) { keepPick(''); d2edRender(); d2edToast('已刪除'); }
};
const loadBtn = d2edEl('button', { type: 'button', onclick: loadPreset }, '套用組合');
const renameBtn = d2edEl('button', { type: 'button', onclick: renamePreset }, '改名');
const delBtn = d2edEl('button', { type: 'button', onclick: deletePreset }, '刪除');
const sync = () => { const none = chosen() < 0; loadBtn.disabled = none; renameBtn.disabled = none; delBtn.disabled = none; };
sync();
nameBox.addEventListener('keydown', e => e.stopPropagation());
box.append(grid, d2edEl('div', { class: 'd2ed-row' },
d2edEl('button', { type: 'button', class: 'd2ed-main', onclick: apply }, '套用'),
d2edEl('button', { type: 'button', onclick: () => { p.life = p.maxLife; d2edRender(); d2edToast('生命已補滿'); } }, '生命補滿'),
d2edEl('button', { type: 'button', onclick: d2ecConfirm }, '裝備創造')),
d2edEl('div', { class: 'd2ed-keeprow' },
d2edEl('label', { class: 'd2ed-keep' }, keepBox, '記住這些修改，下次開遊戲、換一局或繼續存檔時自動套用'),
d2edEl('div', { class: 'd2ed-presets' },
d2edEl('div', {}, pick, loadBtn, delBtn),
d2edEl('div', {}, nameBox, d2edEl('button', { type: 'button', onclick: savePreset }, '存成組合'), renameBtn))),
d2edEl('p', { class: 'd2ed-note' }, keep
? `已記住 ${keepCount} 項（每個職業都會套用；之後的修改也會一起記住）。取消勾選就不再自動套用。`
: '沒勾選時下面的欄位只對這一局有效：「儲存並離開」後再繼續，會回到原本的數值（屬性加減跟升級選的一樣，進下一幕後會保留）。'));
return box;
}
function d2edSaveSection() {
const box = d2edEl('section', { class: 'd2ed-sec' }, d2edEditTitle('永久升級（存檔）'));
if (!document.body.classList.contains('no-run')) {
box.append(d2edEl('p', { class: 'd2ed-note' }, '遊戲中不能改存檔。請「儲存並離開遊戲」，在主選單的大神系統修改。'));
return box;
}
const save = d2edReadSave();
const ranks = save.ranks || {}, extraRanks = save.extraRanks || {};
const grid = d2edEl('div', { class: 'd2ed-grid' });
const gold = d2edEl('input', { type: 'number', min: '0', step: '1', value: String(save.gold || 0) });
grid.append(d2edEl('label', {}, d2edEl('span', {}, '金幣'), gold));
const inputs = [];
for (const [key, name, max, endless] of D2ED_RANKS) {
const top = endless ? max + D2ED_EXTRA_MAX : max;
const now = (ranks[key] || 0) + (endless && ranks[key] >= max ? extraRanks[key] || 0 : 0);
const input = d2edEl('input', { type: 'number', min: '0', max: String(top), step: '1', value: String(now) });
const hint = d2edEl('small', {});
const showHint = () => {
const v = Math.max(0, Math.floor(Number(input.value) || 0));
hint.textContent = !endless ? `0～${max}（不能超過）`
: v > max ? `上限 ${max}，超過會遞減：實際約 ${d2edRound(max + d2edExtraWorth(Math.min(v, top) - max), 2)} 級`
: `上限 ${max}，可再加到 ${top}（效果遞減）`;
};
input.addEventListener('input', showHint);
showHint();
inputs.push([key, top, input]);
grid.append(d2edEl('label', {}, d2edEl('span', {}, name, hint), input));
}
const fill = () => {
for (const [key, , input] of inputs) {
input.value = String(D2ED_RANKS.find(r => r[0] === key)[2]);
input.dispatchEvent(new Event('input'));
}
};
const apply = () => {
const out = {};
for (const [key, top, input] of inputs) out[key] = Math.max(0, Math.min(top, Math.floor(Number(input.value) || 0)));
const g = Math.max(0, Math.floor(Number(gold.value) || 0));
if (confirm('要儲存並重新載入遊戲嗎？')) d2edWriteSaveAndReload(g, out);
};
box.append(d2edEl('p', { class: 'd2ed-note' }, '恰西賣的永久升級，每個英雄都適用。大部分項目可以超過上限（最多再加 999 級），但超過的部分效果會遞減；重抽、略過、放逐、復活不能超過上限。'), grid,
d2edEl('div', { class: 'd2ed-row' },
d2edEl('button', { type: 'button', class: 'd2ed-main', onclick: apply }, '儲存並重新載入'),
d2edEl('button', { type: 'button', onclick: fill }, '全部填滿')));
return box;
}

const D2ED_UNLOCK_KEY = 'd2ed:editUnlocked';
const D2ED_LB_QUEUE_KEY = 'd2s:leaderboard-queue';
function d2edUnlocked() {
try { return localStorage.getItem(D2ED_UNLOCK_KEY) === '1'; } catch (_) { return false; }
}
function d2edKeepLeaderboardOff() {
const rawSet = Storage.prototype.setItem;
Storage.prototype.setItem = function (key, value) {
if (this === window.localStorage && key === D2ED_SAVE_KEY && d2edUnlocked()) {
try {
const save = JSON.parse(value);
if (save && typeof save === 'object' && !(save.leaderboard && save.leaderboard.off)) {
save.leaderboard = { ...save.leaderboard, off: true };
value = JSON.stringify(save);
}
} catch (_) {}
}
if (this === window.localStorage && key === D2ED_LB_QUEUE_KEY && d2edUnlocked()) {
this.removeItem(key);
return;
}
return rawSet.call(this, key, value);
};
const D2ED_LB_ALLOW = /^\/?forge(?:[/?#]|$)/;
const isLeaderboardPost = (url, init) => {
const m = /\/api\/leaderboard(\/.*)?$/.exec(String(url && url.url || url));
return !!m && !D2ED_LB_ALLOW.test(m[1] || '') && /^post$/i.test((init && init.method) || (url && url.method) || 'GET');
};
const rawFetch = window.fetch;
window.fetch = function (url, init) {
if (d2edUnlocked() && isLeaderboardPost(url, init)) return Promise.resolve(new Response('', { status: 403 }));
return rawFetch.apply(this, arguments);
};
}
function d2edLockSection() {
return d2edEl('section', { class: 'd2ed-sec' }, d2edEl('h3', {}, '修改功能'),
d2edEl('p', { class: 'd2ed-note' }, '遊戲中可以修改這一局的人物；在主選單可以修改恰西的永久升級。啟用後會自動關閉排行榜上傳。'),
d2edEl('div', { class: 'd2ed-row' }, d2edEl('button', { type: 'button', class: 'd2ed-main', onclick: d2edConfirmUnlock }, '啟用修改功能')));
}
function d2edConfirmUnlock() {
const card = D2ED.panel && D2ED.panel.querySelector('.d2ed-card');
if (!card || card.querySelector('.d2ed-modal')) return;
const inMenu = document.body.classList.contains('no-run');
const modal = d2edEl('div', { class: 'd2ed-modal' });
const close = () => modal.remove();
const ok = () => {
try { localStorage.setItem(D2ED_UNLOCK_KEY, '1'); } catch (e) { alert('無法啟用：' + e); return; }
if (!inMenu) { close(); d2edRender(); return; }
try {
const write = () => { const save = d2edReadSave(); save.leaderboard = { ...save.leaderboard, off: true }; localStorage.setItem(D2ED_SAVE_KEY, JSON.stringify(save)); };
write();
addEventListener('pagehide', write);
} catch (e) { alert('存檔寫入失敗：' + e); return; }
location.reload();
};
modal.append(d2edEl('div', { class: 'd2ed-modal-box', role: 'alertdialog', 'aria-label': '確認啟用修改功能' },
d2edEl('b', {}, '啟用修改功能？'),
d2edEl('ul', {},
d2edEl('li', {}, '會自動關閉遊戲的「傳送我的紀錄」（排行榜上傳），之後維持關閉。'),
d2edEl('li', {}, !inMenu ? '確認後馬上可以修改這一局的人物。' : '確認後遊戲會重新載入。')),
d2edEl('div', { class: 'd2ed-row' },
d2edEl('button', { type: 'button', class: 'd2ed-main', onclick: ok }, '確認'),
d2edEl('button', { type: 'button', onclick: close }, '取消'))));
card.append(modal);
}
function d2edConfirmRelock() {
const card = D2ED.panel && D2ED.panel.querySelector('.d2ed-card');
if (!card || card.querySelector('.d2ed-modal')) return;
const modal = d2edEl('div', { class: 'd2ed-modal' });
const close = () => modal.remove();
const relock = () => { try { localStorage.removeItem(D2ED_UNLOCK_KEY); } catch (_) {} close(); d2edRender(); };
modal.append(d2edEl('div', { class: 'd2ed-modal-box', role: 'alertdialog', 'aria-label': '確認關閉修改功能' },
d2edEl('b', {}, '關閉修改功能？'),
d2edEl('p', { style: 'margin: 6px 0; color: #d8d0c0' }, '隱藏修改功能，不再強制關閉排行榜上傳。'),
d2edEl('div', { class: 'd2ed-row' },
d2edEl('button', { type: 'button', class: 'd2ed-main', onclick: relock }, '確認'),
d2edEl('button', { type: 'button', onclick: close }, '取消'))));
card.append(modal);
}
function d2edEditTitle(title) {
return d2edEl('h3', { style: 'display: flex; align-items: center; justify-content: space-between; gap: 8px' }, title,
d2edEl('button', { type: 'button', style: 'flex: none; font-size: 13px; font-weight: normal', onclick: d2edConfirmRelock }, '關閉修改功能'));
}

const D2ED_PERF_KEY = 'd2ed:perf';
const D2ED_PERF_DPR = 1;
const D2ED_FX_KEY = 'd2s:skill-effects';
const D2ED_FX_BACKUP_KEY = 'd2ed:perfSkillEffects';
const D2ED_WEATHER_KEY = 'd2s:weather';
const D2ED_WEATHER_BACKUP_KEY = 'd2ed:perfWeather';
const D2ED_PERF_GAME = { settings: undefined, orig: null };
async function d2edPerfGameSettings() {
if (D2ED_PERF_GAME.settings !== undefined) return D2ED_PERF_GAME.settings;
D2ED_PERF_GAME.settings = null;
const urls = [...new Set([...performance.getEntriesByType('resource').map(e => e.name), ...[...document.querySelectorAll('script[src]')].map(e => e.src), ...[...document.querySelectorAll('link[rel=modulepreload]')].map(e => e.href)])]
.filter(n => /\/assets\/[^/]+\.js(\?|$)/.test(n) && !/\/ko-/.test(n) && !/\/game-[^/]+\.js/.test(n));
urls.sort((a, b) => (/\/itemArt-/.test(b) ? 1 : 0) - (/\/itemArt-/.test(a) ? 1 : 0));
for (const url of urls) {
let m = null;
try { m = await Promise.race([import(url), new Promise((_, no) => setTimeout(no, 3000))]); } catch (_) { continue; }
const hit = m && Object.values(m).find(v => v && typeof v === 'object' && typeof v.lights === 'boolean' && typeof v.shadows === 'boolean' && 'res' in v && 'smoke' in v);
if (hit) { D2ED_PERF_GAME.settings = hit; break; }
}
return D2ED_PERF_GAME.settings;
}
async function d2edPerfApplyGame() {
try {
const s = await d2edPerfGameSettings();
if (!s) return;
if (d2edPerfOn()) {
if (!D2ED_PERF_GAME.orig) D2ED_PERF_GAME.orig = { lights: s.lights, shadows: s.shadows };
s.lights = false;
s.shadows = false;
} else if (D2ED_PERF_GAME.orig) {
s.lights = D2ED_PERF_GAME.orig.lights;
s.shadows = D2ED_PERF_GAME.orig.shadows;
D2ED_PERF_GAME.orig = null;
}
} catch (_) {}
}
function d2edPerfOn() {
try { return localStorage.getItem(D2ED_PERF_KEY) === '1'; } catch (_) { return false; }
}
const D2ED_DPR_DESC = Object.getOwnPropertyDescriptor(window, 'devicePixelRatio');
function d2edPerfApplyDpr() {
try {
if (d2edPerfOn()) Object.defineProperty(window, 'devicePixelRatio', { configurable: true, enumerable: true, get: () => D2ED_PERF_DPR, set() {} });
else if (D2ED_DPR_DESC) Object.defineProperty(window, 'devicePixelRatio', D2ED_DPR_DESC);
else delete window.devicePixelRatio;
} catch (_) {}
}
function d2edPerfSet(on) {
try {
if (on) {
const fx = localStorage.getItem(D2ED_FX_KEY);
localStorage.setItem(D2ED_FX_BACKUP_KEY, fx === null ? '' : fx);
localStorage.setItem(D2ED_FX_KEY, '0');
const weather = localStorage.getItem(D2ED_WEATHER_KEY);
localStorage.setItem(D2ED_WEATHER_BACKUP_KEY, weather === null ? '' : weather);
localStorage.setItem(D2ED_WEATHER_KEY, '0');
localStorage.setItem(D2ED_PERF_KEY, '1');
} else {
const fx = localStorage.getItem(D2ED_FX_BACKUP_KEY);
if (fx) localStorage.setItem(D2ED_FX_KEY, fx); else localStorage.removeItem(D2ED_FX_KEY);
localStorage.removeItem(D2ED_FX_BACKUP_KEY);
const weather = localStorage.getItem(D2ED_WEATHER_BACKUP_KEY);
if (weather) localStorage.setItem(D2ED_WEATHER_KEY, weather); else localStorage.removeItem(D2ED_WEATHER_KEY);
localStorage.removeItem(D2ED_WEATHER_BACKUP_KEY);
localStorage.removeItem(D2ED_PERF_KEY);
}
} catch (e) { alert('無法儲存設定：' + e); return; }
d2edPerfApplyDpr();
d2edPerfApplyGame();
}
function d2edPerfSection() {
const on = d2edPerfOn();
const toggle = () => { d2edPerfSet(!on); d2edRender(); d2edToast(on ? '低效能模式已關閉' : '低效能模式已開啟'); };
return d2edEl('section', { class: 'd2ed-sec' }, d2edEl('h3', {}, '低效能模式'),
d2edEl('p', { class: 'd2ed-note' }, '技能特效調到最淡，關閉天氣（雪、雨）、光源和陰影；高解析度螢幕改用 1 倍解析度。'),
d2edEl('div', { class: 'd2ed-row' }, d2edEl('button', { type: 'button', class: on ? '' : 'd2ed-main', onclick: toggle }, on ? '關閉低效能模式' : '開啟低效能模式'),
d2edEl('span', { class: 'd2ed-note', style: 'align-self: center' }, on ? '目前：開啟' : '目前：關閉')));
}

const D2ED_BGMUTE_KEY = 'd2ed:bgMute';
function d2edBgMuteOn() {
try { return localStorage.getItem(D2ED_BGMUTE_KEY) !== '0'; } catch (_) { return true; }
}
(function d2edBgMuteInstall() {
const contexts = new Set();
const proto = window.BaseAudioContext?.prototype ?? window.AudioContext?.prototype;
const desc = proto && Object.getOwnPropertyDescriptor(proto, 'currentTime');
if (desc?.get && desc.configurable) {
Object.defineProperty(proto, 'currentTime', { ...desc, get() { contexts.add(this); return desc.get.call(this); } });
}
let muted = new Set();
const inBackground = () => (document.hidden || (window.__D2ZH_DESKTOP && !document.hasFocus())) && d2edBgMuteOn();
const acProto = window.AudioContext?.prototype;
const acResume = acProto && Object.getOwnPropertyDescriptor(acProto, 'resume');
if (acResume?.value && acResume.configurable) {
Object.defineProperty(acProto, 'resume', { ...acResume, value() { if (!inBackground()) return acResume.value.call(this); contexts.add(this); muted.add(this); return Promise.resolve(); } });
}
const apply = () => {
try {
if (inBackground()) {
for (const c of contexts) if (c.state === 'running') { c.suspend().catch(() => {}); muted.add(c); }
} else if (muted.size) {
for (const c of muted) if (c.state === 'suspended') c.resume().catch(() => {});
muted = new Set();
}
} catch (_) {}
};
document.addEventListener('visibilitychange', apply);
window.addEventListener('blur', apply);
window.addEventListener('focus', apply);
setInterval(apply, 1000);
D2ED.bgMuteApply = apply;
})();
function d2edBgMuteSet(on) {
try { localStorage.setItem(D2ED_BGMUTE_KEY, on ? '1' : '0'); } catch (e) { alert('無法儲存設定：' + e); return; }
D2ED.bgMuteApply?.();
d2edRender(); d2edToast(on ? '背景靜音已開啟' : '背景靜音已關閉');
}
function d2edBgMuteSection() {
const on = d2edBgMuteOn();
const toggle = () => d2edBgMuteSet(!on);
return d2edEl('section', { class: 'd2ed-sec' }, d2edEl('h3', {}, '背景靜音'),
d2edEl('p', { class: 'd2ed-note' }, '切到其他分頁、被其他視窗蓋住或縮小時自動靜音，回到畫面恢復聲音。'),
d2edEl('div', { class: 'd2ed-row' }, d2edEl('button', { type: 'button', class: on ? '' : 'd2ed-main', onclick: toggle }, on ? '關閉背景靜音' : '開啟背景靜音'),
d2edEl('span', { class: 'd2ed-note', style: 'align-self: center' }, on ? '目前：開啟' : '目前：關閉')));
}

const D2ED_SHARD_KEY = 'd2ed:shardSense';
function d2edShardOn() {
try { return localStorage.getItem(D2ED_SHARD_KEY) === '1'; } catch (_) { return false; }
}
function d2edShardSection() {
const on = d2edShardOn();
const toggle = () => {
try { on ? localStorage.removeItem(D2ED_SHARD_KEY) : localStorage.setItem(D2ED_SHARD_KEY, '1'); } catch (e) { alert('無法儲存設定：' + e); return; }
d2edRender(); d2edToast(on ? '碎片感應已關閉' : '碎片感應已開啟');
};
const cnt = typeof d2shardCount === 'function' ? (d2shardCount() ?? '?') : '?';
const next = typeof d2shardNextText === 'function' ? d2shardNextText(cnt) : '';
return d2edEl('section', { class: 'd2ed-sec' }, d2edEl('h3', {}, '碎片感應'),
d2edEl('p', { class: 'd2ed-note' }, `已找到 ${cnt}／10 塊。` + next),
d2edEl('div', { class: 'd2ed-row' }, d2edEl('button', { type: 'button', class: on ? '' : 'd2ed-main', onclick: toggle }, on ? '關閉碎片感應' : '開啟碎片感應'),
d2edEl('span', { class: 'd2ed-note', style: 'align-self: center' }, on ? '目前：開啟' : '目前：關閉')));
}

// === 吞天：將地上道具與未開啟寶箱拉到角色腳邊（含自動吸取開關） ===
const D2ED_ENDPULL_KEY = 'd2ed:endPull';
function d2edEndPullOn() {
try { return localStorage.getItem(D2ED_ENDPULL_KEY) !== '0'; } catch (_) { return true; }
}
function d2edPullItemsToPlayer() {
const w = D2ED.world || window.__foundWorld;
if (!w?.pickups || !w?.player) return { items: 0, chests: 0, total: 0 };
let items = 0;
let chests = 0;
for (const p of w.pickups) {
if (!p || p.dead) continue;
if (p.kind === 'item') {
p.x = w.player.x + (Math.random() - 0.5) * 16;
p.y = w.player.y + (Math.random() - 0.5) * 16;
items++;
} else if (p.kind === 'chest') {
p.x = w.player.x + (Math.random() - 0.5) * 20;
p.y = w.player.y + (Math.random() - 0.5) * 20;
chests++;
}
}
return { items, chests, total: items + chests };
}
setInterval(() => {
if (d2edEndPullOn() && d2edInRun()) d2edPullItemsToPlayer();
}, 1000);

function d2edEndPullSection() {
const on = d2edEndPullOn();
const toggle = () => {
try { localStorage.setItem(D2ED_ENDPULL_KEY, on ? '0' : '1'); } catch (e) { alert('無法儲存設定：' + e); return; }
if (typeof d2edSyncPullLabel === 'function') d2edSyncPullLabel();
d2edRender(); d2edToast(on ? '自動吞天已關閉' : '自動吞天已開啟');
};
const pullNow = () => {
const res = d2edPullItemsToPlayer();
d2edToast(res.total ? `已吞天 ${res.items} 物 / ${res.chests} 箱` : '目前沒有可吞天的道具或寶箱');
};
return d2edEl('section', { class: 'd2ed-sec' }, d2edEl('h3', {}, '吞天（自動吸物與寶箱）'),
d2edEl('p', { class: 'd2ed-note' }, '開啟後每秒自動把地上裝備與未開啟寶箱拉到腳邊（也可直接點「吞天」按鈕手動吸取，右鍵「吞天」可切換自動）。'),
d2edEl('div', { class: 'd2ed-row' },
d2edEl('button', { type: 'button', class: on ? '' : 'd2ed-main', onclick: toggle }, on ? '關閉自動吞天' : '開啟自動吞天'),
d2edEl('button', { type: 'button', onclick: pullNow }, '立即吞天'),
d2edEl('span', { class: 'd2ed-note', style: 'align-self: center' }, on ? '目前：開啟' : '目前：關閉')));
}

// === 神羅天征：將存活怪物集中吸到離角色固定距離（預設 200）的同一座標點 ===
const D2ED_SHINRA_AUTO_KEY = 'd2ed:神羅天征Auto';
const D2ED_SHINRA_DIST = 200;
const D2ED_SHINRA_ANGLE = 0;
function d2edShinraAutoOn() {
try { return localStorage.getItem(D2ED_SHINRA_AUTO_KEY) === '1'; } catch (_) { return false; }
}
function d2edPullEnemiesToFixedPoint(dist = D2ED_SHINRA_DIST, angle = D2ED_SHINRA_ANGLE) {
const w = D2ED.world || window.__foundWorld;
if (!w?.enemies || !w?.player) return { pulled: 0, ready: false };
const targetX = w.player.x + Math.cos(angle) * dist;
const targetY = w.player.y + Math.sin(angle) * dist;
let pulled = 0;
for (const e of w.enemies) {
if (!e || typeof e.x !== 'number' || typeof e.y !== 'number') continue;
if (e.dead || (typeof e.hp === 'number' && e.hp <= 0)) continue;
e.x = targetX;
e.y = targetY;
pulled++;
}
return { pulled, ready: true, targetX, targetY };
}
setInterval(() => {
if (d2edShinraAutoOn() && d2edInRun()) d2edPullEnemiesToFixedPoint(D2ED_SHINRA_DIST, D2ED_SHINRA_ANGLE);
}, 1000);

function d2edShinraSection() {
const on = d2edShinraAutoOn();
const toggle = () => {
try { localStorage.setItem(D2ED_SHINRA_AUTO_KEY, on ? '0' : '1'); } catch (e) { alert('無法儲存設定：' + e); return; }
if (typeof d2edSyncShinraLabel === 'function') d2edSyncShinraLabel();
d2edRender(); d2edToast(on ? '自動神羅天征已關閉' : '自動神羅天征已開啟');
};
const pullNow = () => {
const res = d2edPullEnemiesToFixedPoint(D2ED_SHINRA_DIST, D2ED_SHINRA_ANGLE);
d2edToast(!res.ready ? '尚未抓到怪物或角色資料' : res.pulled ? `神羅天征已拉取 ${res.pulled} 隻怪（距離 ${D2ED_SHINRA_DIST}）` : '目前沒有可吸取的怪物');
};
return d2edEl('section', { class: 'd2ed-sec' }, d2edEl('h3', {}, '神羅天征（固定點吸怪）'),
d2edEl('p', { class: 'd2ed-note' }, `將存活怪物集中吸到離角色距離 ${D2ED_SHINRA_DIST} 的同一固定點（左鍵「神羅天征」立即吸怪，右鍵切換自動；預設關閉避免被圍毆）。`),
d2edEl('div', { class: 'd2ed-row' },
d2edEl('button', { type: 'button', class: on ? '' : 'd2ed-main', onclick: toggle }, on ? '關閉自動神羅天征' : '開啟自動神羅天征'),
d2edEl('button', { type: 'button', onclick: pullNow }, '立即神羅天征'),
d2edEl('span', { class: 'd2ed-note', style: 'align-self: center' }, on ? '目前：開啟' : '目前：關閉')));
}

const D2ED_SKILLZOOM_KEY = 'd2ed:skillZoom';
function d2edSkillZoomOn() {
try { return localStorage.getItem(D2ED_SKILLZOOM_KEY) === '1'; } catch (_) { return false; }
}
function d2edSkillZoomSection() {
const on = d2edSkillZoomOn();
const toggle = () => {
try { on ? localStorage.removeItem(D2ED_SKILLZOOM_KEY) : localStorage.setItem(D2ED_SKILLZOOM_KEY, '1'); } catch (e) { alert('無法儲存設定：' + e); return; }
d2edRender(); d2edToast(on ? '技能格調整大小已關閉' : '技能格調整大小已開啟');
};
return d2edEl('section', { class: 'd2ed-sec' }, d2edEl('h3', {}, '技能格調整大小'),
d2edEl('p', { class: 'd2ed-note' }, '開啟後可調整技能選單縮放比例。'),
d2edEl('div', { class: 'd2ed-row' }, d2edEl('button', { type: 'button', class: on ? '' : 'd2ed-main', onclick: toggle }, on ? '關閉技能格調整大小' : '開啟技能格調整大小'),
d2edEl('span', { class: 'd2ed-note', style: 'align-self: center' }, on ? '目前：開啟' : '目前：關閉')));
}

// === 裝備修改（挑身上或物品欄裝備，指定每行強化次數） ===
const D2GAME = { proto: null, game: null, tries: 0 };
const D2IE_TEMPER_MAX = 10;
const D2IE_SLOT = { weapon: '武器', shield: '副手', helm: '頭盔', head: '頭盔', body: '身體護甲', armor: '身體護甲', gloves: '手套', belt: '腰帶', boots: '靴子', amulet: '護身符', ring: '戒指', ring1: '左戒指', ring2: '右戒指', ringLeft: '左戒指', ringRight: '右戒指' };
const D2IE = { overlay: null, pick: null };
function d2gameUrls() {
return [...new Set([...performance.getEntriesByType('resource').map(e => e.name), ...[...document.querySelectorAll('script[src]')].map(e => e.src), ...[...document.querySelectorAll('link[rel=modulepreload]')].map(e => e.href)])].filter(n => /\/assets\/[^/]+\.js(\?|$)/.test(n) && !/\/ko-/.test(n));
}
async function d2gameInstall() {
if (D2GAME.proto) return true;
const urls = d2gameUrls();
const first = urls.filter(u => /\/Game-[\w-]+\.js/.test(u));
for (const url of [...first, ...urls.filter(u => !first.includes(u))]) {
let m;
try { m = await Promise.race([import(url), new Promise((_, no) => setTimeout(no, 3000))]); } catch (_) { continue; }
for (const v of Object.values(m)) {
const P = v && typeof v === 'function' && v.prototype;
if (P && typeof P.forgeTry === 'function' && typeof P.tick === 'function' && typeof P.changeGear === 'function') { d2gamePatch(P); return true; }
}
if (first.includes(url)) continue;
}
if (++D2GAME.tries < 10) setTimeout(d2gameInstall, 3000);
return false;
}
function d2gamePatch(P) {
if (P.__d2edPatched) { D2GAME.proto = P; return; }
P.__d2edPatched = true;
D2GAME.proto = P;
const rawTick = P.tick;
P.tick = function () { D2GAME.game = this; return rawTick.apply(this, arguments); };
const rawTry = P.forgeTry;
P.forgeTry = async function () { D2GAME.game = this; return rawTry.apply(this, arguments); };
}
function d2ieGame() {
const g = D2GAME.game;
return g && g.kit && g.save ? g : null;
}
function d2ieEntries() {
const g = d2ieGame();
if (!g) return [];
const kit = g.kit.id, save = g.save, out = [];
const ok = it => it && typeof it === 'object' && typeof it.base === 'string' && it.id && it.type !== 'quest' && it.type !== 'essence' && Array.isArray(it.mods);
for (const [slot, it] of Object.entries((save.equippedByClass || {})[kit] || {})) if (ok(it)) out.push({ where: '身上・' + (D2IE_SLOT[slot] || slot), item: it });
const sets = (save.weaponSets || {})[kit];
if (sets && typeof sets === 'object') for (const [slot, it] of Object.entries(sets)) if (ok(it)) out.push({ where: '副武器組・' + (D2IE_SLOT[slot] || slot), item: it });
for (const it of (save.inventoryByClass || {})[kit] || []) if (ok(it)) out.push({ where: '物品欄', item: it });
return out;
}
function d2ieLevel() {
const g = d2ieGame();
return (D2ED.player && D2ED.player.level) || (g && g.world && g.world.player && g.world.player.level) || 1;
}
function d2ieAnvilLines(item) {
const f = D2EC.api && D2EC.api.anvilLines;
if (!f) return null;
try { return f(item, 0, d2ieLevel(), 1).lines || []; } catch (_) { return null; }
}
function d2ieTemperCap(item) {
return item.forge && item.forge.hf ? D2IE_TEMPER_MAX * 2 : D2IE_TEMPER_MAX;
}
function d2ieChange(item, fn) {
const g = d2ieGame();
if (!g) return false;
g.changeGear(g.kit.id, () => fn(item));
return true;
}
function d2ieClose() {
if (!D2IE.overlay) return;
D2IE.overlay.remove();
D2IE.overlay = null;
D2IE.pick = null;
}
function d2ieMsg(text, bad) {
const msg = D2IE.overlay && D2IE.overlay.querySelector('.d2ec-editor .d2ec-msg');
if (!msg) return;
msg.textContent = text;
msg.style.color = bad ? '#ff8a7a' : '';
clearTimeout(msg._h);
msg._h = setTimeout(() => { msg.textContent = ''; }, 4000);
}
async function d2ieShow() {
if (D2IE.overlay || D2EC.overlay) return;
if (!d2ieGame()) { d2edToast('還沒抓到遊戲資料，請進營地或遊戲後再試'); return; }
const list = d2edEl('div', { class: 'd2ec-results' }, d2edEl('p', { class: 'd2ec-hint' }, '讀取裝備資料中…'));
const overlay = D2IE.overlay = d2edEl('div', { id: 'd2ec-overlay', role: 'dialog', 'aria-label': '裝備修改' },
d2edEl('div', { class: 'd2ec-head' }, d2edEl('b', {}, '裝備修改'), d2edEl('span', { class: 'd2ec-grow' }),
d2edEl('button', { type: 'button', class: 'd2ec-x', 'aria-label': '關閉', onclick: d2ieClose }, '×')),
d2edEl('div', { class: 'd2ec-main' }, list, d2edEl('div', { class: 'd2ec-editor' }, d2edEl('p', { class: 'd2ec-hint' }, '從左邊選一件裝備。'))));
for (const type of ['keydown', 'keyup', 'keypress']) overlay.addEventListener(type, e => {
e.stopPropagation();
if (type === 'keydown' && e.key === 'Escape') d2ieClose();
});
document.body.append(overlay);
const api = await d2ecLoad();
if (D2IE.overlay !== overlay) return;
if (!api) { list.replaceChildren(d2edEl('p', { class: 'd2ec-hint' }, '讀不到遊戲的裝備資料。')); return; }
d2ieList();
}
function d2ieList() {
const list = D2IE.overlay && D2IE.overlay.querySelector('.d2ec-results');
if (!list) return;
const entries = d2ieEntries();
if (!entries.length) { list.replaceChildren(d2edEl('p', { class: 'd2ec-hint' }, '身上和物品欄沒有可以修改的裝備。')); return; }
list.replaceChildren(...entries.map(en => {
const it = en.item;
const b = d2edEl('button', { type: 'button', class: 'd2ec-result d2ec-r-' + it.rarity, onclick: () => d2ieSelect(it) },
d2ecIcon(it.rarity, it.name, it.base), d2edEl('span', {}, it.name, d2edEl('small', {}, en.where)));
b.classList.toggle('on', D2IE.pick === it);
return b;
}));
}
function d2ieSelect(item) {
D2IE.pick = item;
d2ieList();
const box = D2IE.overlay.querySelector('.d2ec-editor');
const rarityZh = { normal: '普通', magic: '魔法', rare: '稀有', unique: '獨特', set: '套裝', runeword: '符文之語' }[item.rarity] || item.rarity;
const head = d2edEl('div', { class: 'd2ec-title d2ec-r-' + item.rarity }, d2ecIcon(item.rarity, item.name, item.base),
d2edEl('div', {}, d2edEl('b', {}, item.name), d2edEl('small', {}, `${rarityZh}・${item.base}`)));
box.replaceChildren(head, ...d2ieTemperPart(item), d2edEl('div', { class: 'd2ec-actions' }, d2edEl('span', { class: 'd2ec-msg' })));
}
function d2ieTemperPart(item) {
const out = [d2edEl('h4', {}, '指定強化')];
const lines = d2ieAnvilLines(item);
if (!lines) { out.push(d2edEl('p', { class: 'd2ec-fixed' }, '讀不到鐵砧的資料，這個版本無法指定強化。')); return out; }
const rows = lines.filter(l => l.key);
if (!rows.length) { out.push(d2edEl('p', { class: 'd2ec-fixed' }, '這件裝備沒有可以強化的能力。')); return out; }
const held = (item.forge && item.forge.t) || {};
const cap = d2ieTemperCap(item);
const reads = [];
const total = d2edEl('p', { class: 'd2ec-range', style: 'margin: 4px 0' });
const showTotal = () => {
const sum = reads.reduce((a, [, read]) => a + read(), 0);
total.textContent = `合計 ${sum} / ${cap} 次`;
total.style.color = sum > cap ? '#ff8a7a' : '';
};
for (const l of rows) {
const row = d2ecNumberRow(v => `${l.text}（強化 ${v} 次）`, 0, cap, Math.min(cap, held[l.key] || 0), read => reads.push([l.key, read]));
row.querySelector('input').addEventListener('input', showTotal);
out.push(row);
}
showTotal();
out.push(total);
const apply = clear => {
const t = {};
if (!clear) for (const [key, read] of reads) { const n = read(); if (n > 0) t[key] = n; }
const sum = Object.values(t).reduce((a, b) => a + b, 0);
if (sum > cap) { d2ieMsg(`強化合計 ${sum} 次，超過上限 ${cap} 次，沒有套用`, true); return; }
const ok = d2ieChange(item, it => {
const f = { ...(it.forge || {}) };
if (Object.keys(t).length) f.t = t; else delete f.t;
if (Object.keys(f).length) it.forge = f; else delete it.forge;
});
if (!ok) { d2ieMsg('找不到遊戲資料，沒有套用', true); return; }
d2ieSelect(item);
d2ieMsg(clear ? '已清除所有強化' : '已套用強化');
};
out.push(d2edEl('p', { class: 'd2ec-range', style: 'margin: 4px 0' }, cap > D2IE_TEMPER_MAX ? '數量型能力每強化一次 +20%（至少 +1），技能等級每次 +1 級。這件經過地獄熔爐加倍，上限是 20 次。' : '數量型能力每強化一次 +20%（至少 +1），技能等級每次 +1 級。每件最多 10 次，跟恰西擴鑽一樣。'),
d2edEl('div', { class: 'd2ed-row', style: 'margin: 6px 0' },
d2edEl('button', { type: 'button', class: 'd2ec-ok', onclick: () => apply(false) }, '套用強化'),
d2edEl('button', { type: 'button', onclick: () => apply(true) }, '全部清除')));
return out;
}
function d2edForgeSection() {
const game = d2ieGame();
const ready = !!game;
return d2edEl('section', { class: 'd2ed-sec' }, d2edEl('h3', {}, '裝備修改'),
d2edEl('p', { class: 'd2ed-note' }, '挑身上或物品欄的裝備，直接指定每一行能力的強化次數（跟恰西擴鑽一樣，每件最多 10 次）。'),
d2edEl('div', { class: 'd2ed-row' },
d2edEl('button', { type: 'button', class: 'd2ed-main', ...(!ready && { disabled: '' }), onclick: d2ieShow }, '裝備修改'),
ready ? null : d2edEl('span', { class: 'd2ed-note', style: 'align-self: center' }, '選好英雄（進營地或遊戲中）後才能使用')));
}

const D2EC = { api: null, overlay: null, sel: null, cat: 'head', failed: false };
const D2EC_GRID = { columns: 10, rows: 4 };
const D2EC_FIXED_FUNCS = new Set([15, 16, 11, 19]);
const D2EC_RARITY = { unique: '獨特', set: '套裝', runeword: '符文之語', misc: '道具', base: '底材' };
const D2EC_MISC = [
{ name: 'Key of Terror', base: 'pk1', kind: 'quest', max: 50 }, { name: 'Key of Hate', base: 'pk2', kind: 'quest', max: 50 }, { name: 'Key of Destruction', base: 'pk3', kind: 'quest', max: 50 },
{ name: "Mephisto's Brain", base: 'mbr', kind: 'quest', max: 50 }, { name: "Diablo's Horn", base: 'dhn', kind: 'quest', max: 50 }, { name: "Baal's Eye", base: 'bey', kind: 'quest', max: 50 },
{ name: 'Burning Essence of Terror', base: 'Burning Essence of Terror', kind: 'essence', max: 99 },
];
const d2ecBaseLabel = def => def.rarity === 'misc' ? (def.kind === 'essence' ? '精華' : '鑰匙／器官') : def.rarity === 'base' ? '無能力底材' : def.base;
const D2EC_PLAIN_TYPES = ['weapon', 'shield', 'head', 'body', 'gloves', 'belt', 'boots'];
function d2ecPlainItem(base) {
let src = null;
for (const roll of D2EC.api.rollers || []) {
for (let i = 0; i < 40 && !src; i++) {
let it;
try { it = roll({ base }, 99, 99, undefined); } catch (_) { break; }
if (it && it.base === base && (it.rarity === 'magic' || it.rarity === 'rare')) src = it;
}
if (src) break;
}
const id = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const type = src ? src.type : undefined;
const mods = src ? (src.mods || []).filter(m => m.implicit && !m.auto && !m.staff).map(m => ({ ...m })) : [];
return { id, base, type, rarity: 'normal', name: base, level: 1, mods };
}
function d2ecMiscItem(def, count) {
const id = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
if (def.kind === 'quest') return { id, base: def.base, type: 'quest', rarity: 'unique', name: def.name, level: 0, mods: [] };
return { id, base: def.base, type: 'essence', rarity: 'normal', name: def.name, level: 85, mods: [], ...(count > 1 && { count }) };
}
function d2ecWorldInstall() {
if (Object.prototype.hasOwnProperty('tristram')) return;
Object.defineProperty(Object.prototype, 'tristram', {
configurable: true, enumerable: false,
get() { if (this && Array.isArray(this.pickups) && typeof this.carry === 'function') D2ED.world = this; return undefined; },
set(v) { Object.defineProperty(this, 'tristram', { value: v, writable: true, enumerable: true, configurable: true }); },
});
}
async function d2ecLoad() {
if (D2EC.api && D2EC.api.ready) return D2EC.api;
const urls = [...new Set([...performance.getEntriesByType('resource').map(e => e.name), ...[...document.querySelectorAll('script[src]')].map(e => e.src), ...[...document.querySelectorAll('link[rel=modulepreload]')].map(e => e.href)])].filter(n => /\/assets\/[^/]+\.js(\?|$)/.test(n) && !/\/ko-/.test(n));
const exportsAll = [];
const mods = await Promise.all(urls.map(url => Promise.race([import(url), new Promise((_, no) => setTimeout(no, 3000))]).catch(() => null)));
for (const m of mods) if (m) exportsAll.push(...Object.values(m));
const fns = exportsAll.filter(v => typeof v === 'function').map(f => [f, Function.prototype.toString.call(f)]);
const find = test => (fns.find(([f, src]) => test(src, f)) || [])[0];
const api = D2EC.api = {
tables: find(s => /uniques:\w+\.uniques,bases:\w+\.bases/.test(s)),
normalize: find(s => s.includes("Wirt's Leg") && s.includes('`quest`') && s.includes('stats:')),
lines: find(s => s.includes('strModEnhancedDamage') && s.includes('priority')),
runewordStats: find((s, f) => f.length === 4 && /\.runewords\?\.\[/.test(s) && /\.runes\[/.test(s) && s.includes('flatMap') && !s.includes('reduce')),
size: find(s => /\.size\?\?\[1,1\]/.test(s)),
baseInfo: find(s => /itype:\w+\.itype/.test(s) && s.includes('bothHands')),
isType: find((s, f) => f.length === 2 && s.includes('.equiv')),
anvilLines: find(s => s.includes('hellforge:{open:')),
makers: fns.filter(([f, s]) => f.length === 3 && /\.roll=\[\d,/.test(s)).map(([f]) => f),
cats: exportsAll.find(v => Array.isArray(v) && v[0] && Array.isArray(v[0].uniques) && v[0].label),
make: {},
rollers: fns.filter(([f, s]) => f.length === 4 && (/\?`rare`:`magic`/.test(s) || /\.get\(\w+\.base\),`rare`,/.test(s))).map(([f]) => f),
};
const runewords = exportsAll.find(v => Array.isArray(v) && v[0] && Array.isArray(v[0].runes) && Array.isArray(v[0].types));
const bestBase = find((s, f) => f.length === 1 && /Math\.max\(\w+\.lvl,41\)/.test(s));
if (!api.tables || !api.normalize || !api.lines || !api.runewordStats || !api.size || !api.baseInfo || !api.isType || !api.cats || !runewords || !bestBase || !api.tables()) return null;
api.cats = api.cats.map(c => ({ ...c, uniques: c.uniques.map(d => ({ ...d })) }));
const misc = D2EC_MISC.map(m => ({ ...m, rarity: 'misc', lvl: 0 }));
const charmCat = api.cats.find(c => c.id === 'charm');
if (charmCat) charmCat.uniques.push(...misc); else api.cats.push({ id: 'misc', label: 'Charms', uniques: misc });
const tbl = api.tables();
const typeOf = {};
for (const d of api.cats.flatMap(c => c.uniques)) {
if (d.rarity !== 'unique' && d.rarity !== 'set') continue;
const info = api.baseInfo({ base: d.base });
if (info) typeOf[info.itype] = d.type;
}
const plain = Object.keys(tbl.bases).filter(name => {
const info = api.baseInfo({ base: name });
return info && D2EC_PLAIN_TYPES.includes(typeOf[info.itype]);
}).map(name => ({ name, base: name, rarity: 'base', type: typeOf[api.baseInfo({ base: name }).itype], lvl: 0 }));
if (plain.length) api.cats.splice(charmCat ? api.cats.indexOf(charmCat) + 1 : api.cats.length, 0, { id: 'bases', label: '底材', uniques: plain });
api.all = api.cats.flatMap(c => c.uniques);
for (const rarity of ['unique', 'set']) {
const def = api.all.find(d => d.rarity === rarity);
api.make[rarity] = api.makers.find(f => { try { return f(def, def.lvl, 99).rarity === rarity; } catch (_) { return false; } });
if (!api.make[rarity]) return null;
}
api.typeOfItype = {};
for (const d of api.all) {
if (d.rarity === 'runeword' || d.rarity === 'misc') continue;
const info = api.baseInfo({ base: d.base });
if (info) api.typeOfItype[info.itype] = d.type;
}
for (const d of api.all) {
if (d.rarity !== 'runeword') continue;
const row = runewords.find(x => x.name === d.name);
d.types = row ? row.types : [];
d.excluded = row && row.excluded;
d.base = bestBase(d.name) || d2ecRunewordBases(d)[0] || d.base;
d.type = api.typeOfItype[(api.baseInfo({ base: d.base }) || {}).itype] || d.type;
}
for (const d of api.all) {
d.zh = d.name;
d.hay = [d.name, d.base, d.set || '', D2EC_RARITY[d.rarity], ...(d.runes || [])].join(' ').toLowerCase();
}
api.ready = true;
return api;
}
function d2ecRunewordBases(def) {
const { api } = D2EC;
const t = api.tables();
const list = Object.keys(t.bases).filter(name => {
const info = api.baseInfo({ base: name });
if (!info || !api.typeOfItype[info.itype]) return false;
const sockets = t.bases[name].sockets;
if (!sockets || sockets[sockets.length - 1] < def.runes.length) return false;
return def.types.some(x => api.isType(info.itype, x)) && !(def.excluded || []).some(x => api.isType(info.itype, x));
});
return list.includes(def.base) ? list : [def.base, ...list];
}
const D2EC_BASEMODS = new Map();
function d2ecBaseMods(base) {
if (D2EC_BASEMODS.has(base)) return D2EC_BASEMODS.get(base);
const staff = new Map(), auto = new Map();
for (const roll of D2EC.api.rollers || []) {
for (let n = 0; n < 700; n++) {
let item;
try { item = roll({ base }, 1 + (n % 99), 99, undefined); } catch (_) { break; }
const mods = (item && item.mods) || [];
for (const m of mods) if (m.staff && typeof m.stat === 'string') staff.set(m.stat, Math.max(staff.get(m.stat) || 0, m.value));
const row = mods.filter(m => m.auto && typeof m.stat === 'string');
if (!row.length) continue;
const key = row.map(m => m.stat).join('|');
const r = auto.get(key) || { stats: row.map(m => m.stat), mods: row.map(m => ({ ...m })), lo: row.map(() => Infinity), hi: row.map(() => -Infinity), same: true };
row.forEach((m, k) => { r.lo[k] = Math.min(r.lo[k], m.value); r.hi[k] = Math.max(r.hi[k], m.value); });
if (row.some(m => m.value !== row[0].value)) r.same = false;
auto.set(key, r);
}
}
const out = { staff: [...staff.keys()].sort(), auto: [...auto.values()] };
D2EC_BASEMODS.set(base, out);
return out;
}
function d2ecBaseItem(def, base) {
const { api } = D2EC;
if (def.rarity !== 'runeword') {
const item = api.make[def.rarity](def, def.lvl, 99);
delete item.roll;
return item;
}
const type = api.typeOfItype[(api.baseInfo({ base }) || {}).itype] || def.type;
const slot = type === 'weapon' ? 'weapon' : type === 'shield' ? 'shield' : 'helm';
const stats = api.runewordStats(def.name, def.runes, slot, 99);
const item = { id: Math.random().toString(36).slice(2, 10) + Date.now().toString(36), base, type, rarity: 'runeword', name: def.name, level: def.lvl, mods: [], stats: stats || [] };
const range = api.tables().bases[base].defense;
if (range) item.defense = item.stats.some(s => s.stat === 'item_armor_percent') ? range[1] + 1 : range[1];
return item;
}
function d2ecGroups(def, base, item) {
const t = D2EC.api.tables();
const groups = [];
const walk = (tag, rows, stats, at) => {
const g = { tag, at, rows: [], fixed: [] };
let i = 0;
for (const row of rows) {
const lo = row.min, hi = Math.max(row.min, row.max);
const idxs = [], slots = [];
for (const { stat, func } of row.stats) {
if (!stats[i] || stats[i].stat !== stat) throw new Error('物品表和物品對不起來：' + stat);
idxs.push(i);
if (!D2EC_FIXED_FUNCS.has(func) && !(func === 17 && row.par)) slots.push({ i, field: func === 12 || func === 36 ? 'param' : 'value' });
i++;
}
if (hi > lo && slots.length) g.rows.push({ lo, hi, idxs, slots, def: Math.trunc((lo + hi) / 2) });
else g.fixed.push(...idxs.map(k => stats[k]));
}
groups.push(g);
};
if (def.rarity === 'unique') walk('', t.uniques[def.name].props, item.stats, 'stats');
else if (def.rarity === 'set') {
const row = t.setItems[def.name];
walk('', row.props, item.stats, 'stats');
(row.bonus || []).forEach((rows, n) => walk(`套裝加成 ${n + 1}`, rows, item.bonus[n], n));
} else {
const slot = item.type === 'weapon' ? 'weapon' : item.type === 'shield' ? 'shield' : 'helm';
walk('', [...t.runewords[def.name].props, ...def.runes.flatMap(r => (t.runes[r] || {})[slot] || [])], item.stats, 'stats');
}
return groups;
}
function d2ecLineTexts(stats) {
const level = (D2ED.player && D2ED.player.level) || 1;
let lines = [];
try { lines = D2EC.api.lines(stats, level) || []; } catch (_) {}
return lines.map(x => x.text);
}
function d2ecRowText(row, stats, v) {
const part = row.idxs.map(i => ({ ...stats[i] }));
for (const s of row.slots) part[row.idxs.indexOf(s.i)][s.field] = v;
return d2ecLineTexts(part).join('、');
}
function d2ecIconUrl(rarity, name, base) {
const art = D2ED.world && D2ED.world.art && D2ED.world.art.items;
if (!art) return '';
const one = x => (Array.isArray(x) ? x[0] : x);
const icon = (rarity === 'unique' && one((art.uniqueIcons || {})[name])) || (rarity === 'set' && one((art.setIcons || {})[name])) || one((art.icons || {})[base]);
return (icon && icon.url) || '';
}
function d2ecIcon(rarity, name, base) {
const url = d2ecIconUrl(rarity, name, base);
return url ? d2edEl('img', { src: url, alt: '', draggable: 'false' }) : null;
}
function d2ecNotice(msg) {
const box = D2EC.overlay;
if (!box) return;
const modal = d2edEl('div', { class: 'd2ec-modal' });
modal.append(d2edEl('div', { class: 'd2ec-modal-box', role: 'alertdialog' },
d2edEl('p', {}, msg),
d2edEl('button', { type: 'button', class: 'd2ec-ok', onclick: () => modal.remove() }, '確定')));
box.append(modal);
}
function d2ecInventory() {
const box = D2EC.overlay && D2EC.overlay.querySelector('.d2ec-inv');
if (!box) return;
const cls = D2ED.player && D2ED.player.cls;
const items = (d2edReadSave().inventoryByClass || {})[cls] || [];
const { size } = D2EC.api;
let used = 0;
const info = d2edEl('span', { class: 'd2ec-invinfo' });
const grid = d2edEl('div', { class: 'd2ec-grid' });
for (const item of items) {
if (!item.at) continue;
const [w, h] = size(item);
used += w * h;
const name = item.name;
const show = () => { info.textContent = name; };
const cell = d2edEl('div', { class: 'd2ec-item d2ec-r-' + item.rarity, title: name, style: `grid-column:${item.at.x + 1}/span ${w};grid-row:${item.at.y + 1}/span ${h}`, onmouseenter: show, onclick: show },
d2ecIcon(item.rarity, item.name, item.base));
if (!cell.firstChild) cell.textContent = name;
grid.append(cell);
}
const total = D2EC_GRID.columns * D2EC_GRID.rows;
box.replaceChildren(d2edEl('div', { class: 'd2ec-invhead' }, d2edEl('b', {}, `${cls ? cls[0].toUpperCase() + cls.slice(1) : ''} 物品欄`), d2edEl('span', {}, `已用 ${used} / ${total} 格`), info), grid);
}
function d2ecCreate() {
const sel = D2EC.sel;
if (!sel) return;
const world = D2ED.world;
if (!world || typeof world.carry !== 'function') { d2ecNotice('還沒抓到遊戲世界，請進入地圖後再試一次。'); return; }
if (sel.plain) {
const item = d2ecPlainItem(sel.base);
if (!item.type) item.type = sel.def.type;
if (sel.defense) item.defense = sel.defense.read(); else if (sel.fixedDefense !== undefined) item.defense = sel.fixedDefense;
if (sel.sockets) { const n = sel.sockets(); if (n > 0) item.sockets = n; }
const ready = item.type ? D2EC.api.normalize(JSON.parse(JSON.stringify(item))) : null;
if (!ready) { d2ecNotice('遊戲不接受這件底材的資料，沒有建立。'); return; }
if (!world.carry(ready)) { d2ecNotice('物品欄已滿，請整理背包。'); return; }
d2ecInventory();
const msg = D2EC.overlay.querySelector('.d2ec-msg');
msg.textContent = `已放入物品欄：${sel.base}${ready.sockets ? `（${ready.sockets} 洞）` : ''}`;
clearTimeout(msg._h);
msg._h = setTimeout(() => { msg.textContent = ''; }, 3000);
return;
}
if (sel.misc) {
const count = sel.count ? sel.count() : 1;
const items = sel.def.kind === 'quest' ? Array.from({ length: count }, () => d2ecMiscItem(sel.def, 1)) : [d2ecMiscItem(sel.def, count)];
let done = 0;
for (const it of items) {
const ready = D2EC.api.normalize(JSON.parse(JSON.stringify(it)));
if (!ready) { d2ecNotice('遊戲不接受這個道具的資料，沒有建立。'); break; }
if (!world.carry(ready)) { d2ecNotice('物品欄已滿，請整理背包。'); break; }
done++;
}
if (!done) return;
d2ecInventory();
const msg = D2EC.overlay.querySelector('.d2ec-msg');
msg.textContent = `已放入物品欄：${sel.def.name} ×${sel.def.kind === 'quest' ? done : count}`;
clearTimeout(msg._h);
msg._h = setTimeout(() => { msg.textContent = ''; }, 3000);
return;
}
const item = d2ecBaseItem(sel.def, sel.base);
for (const g of sel.groups) {
const stats = g.at === 'stats' ? item.stats : item.bonus[g.at];
for (const row of g.rows) if (row.read) for (const s of row.slots) stats[s.i][s.field] = row.read();
}
if (sel.defense) item.defense = sel.defense.read();
if (sel.ethereal && sel.ethereal()) {
item.ethereal = true;
if (item.defense !== undefined) item.defense = Math.floor(item.defense * 3 / 2);
}
if (sel.def.rarity === 'runeword') {
const staff = (sel.staff || []).map(f => f()).filter(Boolean).filter((m, i, a) => a.findIndex(x => x.stat === m.stat) === i);
item.mods = [...(sel.auto ? sel.auto() : []), ...staff];
}
if (sel.sockets) { const n = sel.sockets(); if (n > 0) item.sockets = n; }
const ready = D2EC.api.normalize(JSON.parse(JSON.stringify(item)));
if (!ready) { d2ecNotice('遊戲不接受這件裝備的資料，沒有建立。'); return; }
if (!world.carry(ready)) { d2ecNotice('物品欄已滿，請整理背包。'); return; }
d2ecInventory();
const msg = D2EC.overlay.querySelector('.d2ec-msg');
msg.textContent = `已放入物品欄：${sel.def.name}`;
clearTimeout(msg._h);
msg._h = setTimeout(() => { msg.textContent = ''; }, 3000);
}
function d2ecNumberRow(label, lo, hi, def, onValue) {
const text = d2edEl('span', { class: 'd2ec-label' }, label(def));
const input = d2edEl('input', { type: 'number', min: String(lo), max: String(hi), step: '1', value: String(def) });
const read = () => {
const v = Math.trunc(Number(input.value));
return input.value === '' || !Number.isFinite(v) ? def : Math.min(hi, Math.max(lo, v));
};
input.addEventListener('input', () => { text.textContent = label(read()); });
input.addEventListener('change', () => { input.value = String(read()); text.textContent = label(read()); });
onValue(read);
return d2edEl('label', { class: 'd2ec-row' }, text, d2edEl('span', { class: 'd2ec-range' }, `${lo} ～ ${hi}`), input);
}
function d2ecExtras(def, base, item, sel) {
const out = [];
const row = D2EC.api.tables().bases[base] || {};
if (def.rarity === 'runeword') {
if (!row.noDurability) {
const cb = d2edEl('input', { type: 'checkbox' });
sel.ethereal = () => cb.checked;
out.push(d2edEl('label', { class: 'd2ec-row' }, d2edEl('span', { class: 'd2ec-label' }, '無形（防禦和武器傷害 ×1.5，無法修理）'), cb));
}
const bm = d2ecBaseMods(base);
if (bm.staff.length) {
out.push(d2edEl('h4', {}, '底材隨機職業技能（最多 3 個）'));
sel.staff = [];
for (let k = 0; k < 3; k++) {
const pick = d2edEl('select', {}, d2edEl('option', { value: '' }, '（無）'), ...bm.staff.map(v => d2edEl('option', { value: v }, v)));
const lv = d2edEl('input', { type: 'number', min: '1', max: '3', step: '1', value: '3' });
lv.addEventListener('change', () => { lv.value = String(Math.min(3, Math.max(1, Math.trunc(Number(lv.value)) || 1))); });
sel.staff.push(() => pick.value ? { stat: pick.value, value: Math.min(3, Math.max(1, Math.trunc(Number(lv.value)) || 1)), staff: true } : null);
out.push(d2edEl('label', { class: 'd2ec-row' }, pick, d2edEl('span', { class: 'd2ec-range' }, '+1 ～ 3 級'), lv));
}
}
if (bm.auto.length) {
out.push(d2edEl('h4', {}, '底材自帶屬性'));
const vals = d2edEl('div', {});
const pick = d2edEl('select', {}, d2edEl('option', { value: '' }, '（無）'), ...bm.auto.map((r, k) => d2edEl('option', { value: String(k) }, r.stats.join('、'))));
const build = () => {
const r = bm.auto[pick.value];
vals.replaceChildren();
sel.auto = null;
if (!r) return;
const reads = [];
if (r.same) {
const lo = Math.min(...r.lo), hi = Math.max(...r.hi);
vals.append(d2ecNumberRow(v => `${r.stats.join('、')} ${v}`, lo, hi, hi, read => { for (const _ of r.stats) reads.push(read); }));
} else r.stats.forEach((s, k) => vals.append(d2ecNumberRow(v => `${s} ${v}`, r.lo[k], r.hi[k], r.hi[k], read => reads.push(read))));
sel.auto = () => {
const mods = r.mods.map((m, k) => ({ ...m, value: reads[k](), auto: true }));
const min = mods.find(m => m.stat === 'poisonMinDamage'), max = mods.find(m => m.stat === 'poisonMaxDamage');
if (min && max && max.value < min.value) max.value = min.value;
return mods;
};
};
pick.addEventListener('change', build);
out.push(d2edEl('label', { class: 'd2ec-row' }, pick), vals);
}
} else {
const sockets = Array.isArray(row.sockets) ? (row.sockets[2] ?? row.sockets[row.sockets.length - 1]) : 0;
if (sockets > 0 && !item.stats.some(s => s.stat === 'item_numsockets')) out.push(d2ecNumberRow(v => v ? `洞數 ${v}` : '洞數 0（不打洞）', 0, sockets, 0, read => { sel.sockets = read; }));
}
return out;
}
function d2ecSelect(def, base = def.base) {
const box = D2EC.overlay.querySelector('.d2ec-editor');
if (def.rarity === 'base') {
const sel = D2EC.sel = { def, base: def.base, plain: true };
for (const b of D2EC.overlay.querySelectorAll('.d2ec-result')) b.classList.toggle('on', b._def === def);
const row = D2EC.api.tables().bases[def.base] || {};
const head = d2edEl('div', { class: 'd2ec-title' }, d2ecIcon('base', def.name, def.base), d2edEl('div', {}, d2edEl('b', {}, def.base), d2edEl('small', {}, '底材・普通品質')));
const body = d2edEl('div', {}, d2edEl('p', { class: 'd2ec-fixed' }, '僅為底材：不帶額外詞綴，可調整防禦與洞數。'));
const range = row.defense;
if (range && range[1] > range[0]) body.append(d2ecNumberRow(v => `底材防禦 ${v}`, range[0], range[1], range[1], read => { sel.defense = { read }; }));
else if (range) sel.fixedDefense = range[1];
const sockets = Array.isArray(row.sockets) ? (row.sockets[2] ?? row.sockets[row.sockets.length - 1]) : 0;
if (sockets > 0) body.append(d2ecNumberRow(v => v ? `洞數 ${v}` : '洞數 0（不打洞）', 0, sockets, sockets, read => { sel.sockets = read; }));
box.replaceChildren(head, body, d2edEl('div', { class: 'd2ec-actions' },
d2edEl('button', { type: 'button', class: 'd2ec-ok', onclick: d2ecCreate }, '確定'), d2edEl('span', { class: 'd2ec-msg' })));
return;
}
if (def.rarity === 'misc') {
const sel = D2EC.sel = { def, misc: true };
for (const b of D2EC.overlay.querySelectorAll('.d2ec-result')) b.classList.toggle('on', b._def === def);
const head = d2edEl('div', { class: 'd2ec-title d2ec-r-unique' }, d2ecIcon('misc', def.name, def.base), d2edEl('div', {}, d2edEl('b', {}, def.name), d2edEl('small', {}, `道具・${d2ecBaseLabel(def)}`)));
box.replaceChildren(head, d2ecNumberRow(v => `數量 ${v}`, 1, def.max, 1, read => { sel.count = read; }),
d2edEl('div', { class: 'd2ec-actions' }, d2edEl('button', { type: 'button', class: 'd2ec-ok', onclick: d2ecCreate }, '確定'), d2edEl('span', { class: 'd2ec-msg' })));
return;
}
let item, groups;
try {
item = d2ecBaseItem(def, base);
groups = d2ecGroups(def, base, item);
} catch (_) {
box.replaceChildren(d2edEl('p', { class: 'd2ec-hint' }, '這件裝備讀不到能力資料。'));
return;
}
const sel = D2EC.sel = { def, base, groups };
for (const b of D2EC.overlay.querySelectorAll('.d2ec-result')) b.classList.toggle('on', b._def === def);
const baseLine = def.rarity === 'runeword'
? d2edEl('label', { class: 'd2ec-row' }, d2edEl('span', { class: 'd2ec-label' }, '底材'),
d2edEl('select', { onchange: e => d2ecSelect(def, e.target.value) }, ...d2ecRunewordBases(def).map(name => {
const o = d2edEl('option', { value: name }, name);
if (name === base) o.selected = true;
return o;
})))
: d2edEl('p', { class: 'd2ec-base' }, base);
const head = d2edEl('div', { class: 'd2ec-title d2ec-r-' + def.rarity }, d2ecIcon(def.rarity, def.name, base), d2edEl('div', {}, d2edEl('b', {}, def.name), d2edEl('small', {}, `${D2EC_RARITY[def.rarity]}${def.set ? '・' + def.set : ''}${def.runes ? '・' + def.runes.join('・') : ''}`)));
const body = d2edEl('div', {});
const range = D2EC.api.tables().bases[base] && D2EC.api.tables().bases[base].defense;
if (range && item.defense !== undefined && !item.stats.some(s => s.stat === 'item_armor_percent') && range[1] > range[0]) {
const lo = range[0], hi = range[1];
body.append(d2ecNumberRow(v => `底材防禦 ${v}`, lo, hi, Math.trunc((lo + hi) / 2), read => { sel.defense = { read }; }));
} else if (item.defense !== undefined) body.append(d2edEl('p', { class: 'd2ec-fixed' }, `底材防禦 ${item.defense}`));
body.append(...d2ecExtras(def, base, item, sel));
for (const g of groups) {
const stats = g.at === 'stats' ? item.stats : item.bonus[g.at];
if (g.tag) body.append(d2edEl('h4', {}, g.tag));
for (const row of g.rows) {
if (d2ecLineTexts(row.idxs.map(i => ({ ...stats[i] }))).length) body.append(d2ecNumberRow(v => d2ecRowText(row, stats, v), row.lo, row.hi, row.def, read => { row.read = read; }));
}
for (const line of d2ecLineTexts(g.fixed.map(s => ({ ...s })))) body.append(d2edEl('p', { class: 'd2ec-fixed' }, line));
}
box.replaceChildren(head, baseLine, body, d2edEl('div', { class: 'd2ec-actions' },
d2edEl('button', { type: 'button', class: 'd2ec-ok', onclick: d2ecCreate }, '確定'), d2edEl('span', { class: 'd2ec-msg' })));
}
function d2ecSearch() {
const { overlay, api } = D2EC;
const list = overlay.querySelector('.d2ec-results');
const words = overlay.querySelector('.d2ec-search').value.toLowerCase().split(/\s+/).filter(Boolean);
if (!words.length) { list.replaceChildren(d2edEl('p', { class: 'd2ec-hint' }, '輸入裝備名稱、底材或套裝關鍵字，或按「自行挑選」。')); return; }
const found = api.all.filter(d => words.every(w => d.hay.includes(w)));
if (!found.length) { list.replaceChildren(d2edEl('p', { class: 'd2ec-hint' }, '找不到符合的裝備。')); return; }
list.replaceChildren(...found.map(def => {
const b = d2edEl('button', { type: 'button', class: 'd2ec-result d2ec-r-' + def.rarity, onclick: () => d2ecSelect(def) }, d2ecIcon(def.rarity, def.name, def.base), d2edEl('span', {}, def.name, d2edEl('small', {}, `${D2EC_RARITY[def.rarity]}・${d2ecBaseLabel(def)}`)));
b._def = def;
b.classList.toggle('on', !!D2EC.sel && D2EC.sel.def === def);
return b;
}));
if (found.length === 1 && !(D2EC.sel && D2EC.sel.def === found[0])) d2ecSelect(found[0]);
}
function d2ecPicker() {
const { overlay, api } = D2EC;
if (overlay.querySelector('.d2ec-picker')) return;
const kept = new Set((d2edReadSave().uniques || []).map(x => x.name));
const tabs = d2edEl('div', { class: 'd2ec-tabs' });
const slots = d2edEl('div', { class: 'd2ec-slots' });
const picker = d2edEl('div', { class: 'd2ec-picker' });
const show = () => {
const cat = api.cats.find(c => c.id === D2EC.cat) || api.cats[0];
for (const t of tabs.children) t.classList.toggle('on', t._id === cat.id);
slots.replaceChildren(...cat.uniques.map(def => d2edEl('button', { type: 'button', class: `d2ec-slot d2ec-r-${def.rarity}${kept.has(def.name) ? ' kept' : ''}`, onclick: () => {
picker.remove();
overlay.querySelector('.d2ec-search').value = def.name;
D2EC.sel = null;
d2ecSearch();
d2ecSelect(def);
} }, d2ecIcon(def.rarity, def.name, def.base), d2edEl('span', {}, def.name), d2edEl('small', {}, d2ecBaseLabel(def)))));
slots.scrollTop = 0;
};
for (const c of api.cats) {
const t = d2edEl('button', { type: 'button', onclick: () => { D2EC.cat = c.id; show(); } }, c.label);
t._id = c.id;
tabs.append(t);
}
picker.append(d2edEl('div', { class: 'd2ec-head' }, d2edEl('b', {}, '裝備一覽'), d2edEl('span', { class: 'd2ec-grow' }), d2edEl('button', { type: 'button', class: 'd2ec-x', 'aria-label': '關閉', onclick: () => picker.remove() }, '×')), tabs, slots);
overlay.append(picker);
show();
}
function d2ecClose() {
if (!D2EC.overlay) return;
D2EC.overlay.remove();
D2EC.overlay = null;
D2EC.sel = null;
}
async function d2ecShow() {
if (D2EC.overlay || D2IE.overlay) return;
const search = d2edEl('input', { type: 'search', class: 'd2ec-search', placeholder: '搜尋裝備，例如：Enigma', autocomplete: 'off', spellcheck: 'false', 'aria-label': '搜尋裝備' });
const results = d2edEl('div', { class: 'd2ec-results' }, d2edEl('p', { class: 'd2ec-hint' }, '讀取裝備資料中…'));
const overlay = D2EC.overlay = d2edEl('div', { id: 'd2ec-overlay', role: 'dialog', 'aria-label': '裝備創造' },
d2edEl('div', { class: 'd2ec-head' }, d2edEl('b', {}, '裝備創造'), search,
d2edEl('button', { type: 'button', class: 'd2ec-pick', onclick: () => { if (D2EC.api && D2EC.api.ready) d2ecPicker(); else d2ecNotice(D2EC.failed ? '讀不到遊戲的裝備資料。' : '裝備資料還在讀取，請稍候再按一次。'); } }, '自行挑選'),
d2edEl('button', { type: 'button', class: 'd2ec-x', 'aria-label': '關閉', onclick: d2ecClose }, '×')),
d2edEl('div', { class: 'd2ec-main' }, results, d2edEl('div', { class: 'd2ec-editor' })),
d2edEl('div', { class: 'd2ec-inv' }));
for (const type of ['keydown', 'keyup', 'keypress']) overlay.addEventListener(type, e => {
e.stopPropagation();
if (type !== 'keydown' || e.key !== 'Escape') return;
const top = overlay.querySelector('.d2ec-modal') || overlay.querySelector('.d2ec-picker');
if (top) top.remove(); else d2ecClose();
});
document.body.append(overlay);
const api = await d2ecLoad();
if (D2EC.overlay !== overlay) return;
D2EC.failed = !api;
if (!api) { results.replaceChildren(d2edEl('p', { class: 'd2ec-hint' }, '讀不到遊戲的裝備資料。')); return; }
search.addEventListener('input', d2ecSearch);
d2ecSearch();
d2ecInventory();
search.focus();
}
function d2ecConfirm() {
const card = D2ED.panel && D2ED.panel.querySelector('.d2ed-card');
if (!card || card.querySelector('.d2ed-modal')) return;
const modal = d2edEl('div', { class: 'd2ed-modal' });
const close = () => modal.remove();
modal.append(d2edEl('div', { class: 'd2ed-modal-box', role: 'alertdialog', 'aria-label': '裝備創造提醒' },
d2edEl('p', { style: 'margin: 6px 0; color: #d8d0c0' }, '請小心使用此功能，會影響遊戲終局體驗。'),
d2edEl('div', { class: 'd2ed-row' },
d2edEl('button', { type: 'button', class: 'd2ed-main', onclick: () => { close(); d2ecShow(); } }, '確定'),
d2edEl('button', { type: 'button', onclick: close }, '取消'))));
card.append(modal);
}

function d2edRender() {
const body = D2ED.panel.querySelector('.d2ed-body');
const inRun = !document.body.classList.contains('no-run');
const sections = d2edUnlocked()
? [inRun ? d2edRunSection() : d2edSaveSection(), d2edForgeSection(), d2edPerfSection(), d2edBgMuteSection(), d2edShardSection(), d2edEndPullSection(), d2edShinraSection(), d2edSkillZoomSection()]
: [d2edLockSection(), d2edForgeSection(), d2edPerfSection(), d2edBgMuteSection(), d2edShardSection(), d2edEndPullSection(), d2edShinraSection(), d2edSkillZoomSection()];
body.replaceChildren(...sections);
}

function d2edOpen() {
if (D2ED.panel) return;
const close = () => { D2ED.panel.remove(); D2ED.panel = null; };
D2ED.panel = d2edEl('div', { id: 'd2ed-overlay', onclick: e => { if (e.target.id === 'd2ed-overlay') close(); } },
d2edEl('div', { class: 'd2ed-card', role: 'dialog', 'aria-label': '大神系統' },
d2edEl('div', { class: 'd2ed-head' }, d2edEl('b', {}, '大神系統'), d2edEl('span', { class: 'd2ed-ver', title: '版本' }, D2ZH_VERSION), d2edEl('span', { class: 'd2ed-msg' }),
d2edEl('button', { type: 'button', class: 'd2ed-x', onclick: close, 'aria-label': '關閉' }, '×')),
d2edEl('div', { class: 'd2ed-body' })));
D2ED.panel.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Escape') close(); });
document.body.append(D2ED.panel);
d2edRender();
}

// === 可拖動浮動按鈕（縮小約 30%，禁止互相重疊） ===
const D2ED_SYS_POS_KEY = 'd2ed:大神系統Pos';
const D2ED_PULL_POS_KEY = 'd2ed:吞天Pos';
const D2ED_SHINRA_POS_KEY = 'd2ed:神羅天征Pos';
const BTN_GAP = 6;
let pullTempText = '';
let pullTempTimer = null;
let shinraTempText = '';
let shinraTempTimer = null;

function d2edSyncPullLabel() {
const pb = D2ED.pullBtn;
if (!pb) return;
if (pullTempText) {
pb.textContent = pullTempText;
return;
}
pb.textContent = `吞天 (自動:${d2edEndPullOn() ? '開' : '關'})`;
}

function d2edSyncShinraLabel() {
const sb = D2ED.shinraBtn;
if (!sb) return;
if (shinraTempText) {
sb.textContent = shinraTempText;
return;
}
sb.textContent = `神羅天征 (自動:${d2edShinraAutoOn() ? '開' : '關'})`;
}

function readSavedPos(key) {
try {
const raw = localStorage.getItem(key);
if (!raw) return null;
const pos = JSON.parse(raw);
if (typeof pos?.left === 'number' && typeof pos?.top === 'number') return { left: pos.left, top: pos.top };
} catch (_) {}
return null;
}

function writeSavedPos(key, el) {
if (!el) return;
const rect = el.getBoundingClientRect();
try {
localStorage.setItem(key, JSON.stringify({ left: rect.left, top: rect.top }));
} catch (_) {}
}

function rectsOverlap(a, b, pad = BTN_GAP) {
return !(
a.left + a.width + pad <= b.left ||
b.left + b.width + pad <= a.left ||
a.top + a.height + pad <= b.top ||
b.top + b.height + pad <= a.top
);
}

function clampBox(left, top, width, height) {
const maxLeft = Math.max(0, window.innerWidth - width);
const maxTop = Math.max(0, window.innerHeight - height);
return {
left: Math.min(maxLeft, Math.max(0, left)),
top: Math.min(maxTop, Math.max(0, top)),
width,
height
};
}

function overlapsAny(box, others, pad = BTN_GAP) {
return others.some(o => o && o.width > 0 && o.height > 0 && rectsOverlap(box, o, pad));
}

function resolveNonOverlap(movedEl, otherEls) {
if (!movedEl) return;
const others = (Array.isArray(otherEls) ? otherEls : [otherEls])
.filter(el => el && el !== movedEl)
.map(el => el.getBoundingClientRect())
.filter(r => r.width > 0 && r.height > 0);
const mRect = movedEl.getBoundingClientRect();
if (!mRect.width || !mRect.height) return;
let box = clampBox(mRect.left, mRect.top, mRect.width, mRect.height);
if (!overlapsAny(box, others, BTN_GAP)) {
movedEl.style.left = `${box.left}px`;
movedEl.style.top = `${box.top}px`;
movedEl.style.right = 'auto';
return;
}
const candidates = [];
for (const oRect of others) {
candidates.push(
{ left: oRect.left - box.width - BTN_GAP, top: box.top },
{ left: oRect.right + BTN_GAP, top: box.top },
{ left: box.left, top: oRect.bottom + BTN_GAP },
{ left: box.left, top: oRect.top - box.height - BTN_GAP },
{ left: oRect.left - box.width - BTN_GAP, top: oRect.top },
{ left: oRect.right + BTN_GAP, top: oRect.top }
);
}
let best = null;
let bestDist = Infinity;
for (const c of candidates) {
const clamped = clampBox(c.left, c.top, box.width, box.height);
if (!overlapsAny(clamped, others, BTN_GAP)) {
const dist = Math.hypot(clamped.left - box.left, clamped.top - box.top);
if (dist < bestDist) {
bestDist = dist;
best = clamped;
}
}
}
if (!best) {
for (let y = 0; y <= Math.max(0, window.innerHeight - box.height); y += 12) {
for (let x = 0; x <= Math.max(0, window.innerWidth - box.width); x += 12) {
const clamped = clampBox(x, y, box.width, box.height);
if (!overlapsAny(clamped, others, BTN_GAP)) {
const dist = Math.hypot(clamped.left - box.left, clamped.top - box.top);
if (dist < bestDist) {
bestDist = dist;
best = clamped;
}
}
}
}
}
if (!best) best = box;
movedEl.style.left = `${best.left}px`;
movedEl.style.top = `${best.top}px`;
movedEl.style.right = 'auto';
}

function initDefaultPositions() {
const b = D2ED.button;
const pb = D2ED.pullBtn;
const sb = D2ED.shinraBtn;
if (!b || !pb || !sb) return;
const bw = b.getBoundingClientRect().width || 68;
const bh = b.getBoundingClientRect().height || 24;
const pw = pb.getBoundingClientRect().width || 88;
const ph = pb.getBoundingClientRect().height || 24;
const sw = sb.getBoundingClientRect().width || 96;
const sh = sb.getBoundingClientRect().height || 24;

const savedB = readSavedPos(D2ED_SYS_POS_KEY);
const savedP = readSavedPos(D2ED_PULL_POS_KEY);
const savedS = readSavedPos(D2ED_SHINRA_POS_KEY);

const defB = clampBox(window.innerWidth - bw - 12, 12, bw, bh);
const posB = savedB ? clampBox(savedB.left, savedB.top, bw, bh) : defB;
b.style.left = `${posB.left}px`;
b.style.top = `${posB.top}px`;
b.style.right = 'auto';

const defP = clampBox(posB.left - pw - BTN_GAP, posB.top, pw, ph);
const posP = savedP ? clampBox(savedP.left, savedP.top, pw, ph) : defP;
pb.style.left = `${posP.left}px`;
pb.style.top = `${posP.top}px`;
pb.style.right = 'auto';
if (overlapsAny(posP, [posB], BTN_GAP)) {
resolveNonOverlap(pb, [b]);
}

const pRectNow = pb.getBoundingClientRect();
const defS = clampBox(pRectNow.left - sw - BTN_GAP, pRectNow.top, sw, sh);
const posS = savedS ? clampBox(savedS.left, savedS.top, sw, sh) : defS;
sb.style.left = `${posS.left}px`;
sb.style.top = `${posS.top}px`;
sb.style.right = 'auto';
if (overlapsAny(posS, [b.getBoundingClientRect(), pb.getBoundingClientRect()], BTN_GAP)) {
resolveNonOverlap(sb, [b, pb]);
}
}

function attachDraggable(el, posKey, othersGetter, onTap) {
let dragState = null;
let suppressTap = false;

el.addEventListener('pointerdown', (e) => {
if (e.button === 2) return;
e.preventDefault();
e.stopPropagation();
const rect = el.getBoundingClientRect();
el.style.left = `${rect.left}px`;
el.style.top = `${rect.top}px`;
el.style.right = 'auto';
el.style.cursor = 'grabbing';
dragState = {
pointerId: e.pointerId,
startX: e.clientX,
startY: e.clientY,
originLeft: rect.left,
originTop: rect.top,
width: rect.width,
height: rect.height,
moved: false
};
try { el.setPointerCapture(e.pointerId); } catch (_) {}
}, true);

el.addEventListener('pointermove', (e) => {
if (!dragState || e.pointerId !== dragState.pointerId) return;
e.preventDefault();
e.stopPropagation();
const dx = e.clientX - dragState.startX;
const dy = e.clientY - dragState.startY;
if (!dragState.moved && Math.hypot(dx, dy) > 4) {
dragState.moved = true;
}
if (dragState.moved) {
let box = clampBox(dragState.originLeft + dx, dragState.originTop + dy, dragState.width, dragState.height);
const others = (othersGetter() || [])
.filter(o => o && o !== el)
.map(o => o.getBoundingClientRect())
.filter(r => r.width > 0 && r.height > 0);
if (overlapsAny(box, others, BTN_GAP)) {
const prevLeft = parseFloat(el.style.left) || box.left;
const prevTop = parseFloat(el.style.top) || box.top;
const tryX = clampBox(box.left, prevTop, dragState.width, dragState.height);
const tryY = clampBox(prevLeft, box.top, dragState.width, dragState.height);
if (!overlapsAny(tryX, others, BTN_GAP)) box = tryX;
else if (!overlapsAny(tryY, others, BTN_GAP)) box = tryY;
else box = clampBox(prevLeft, prevTop, dragState.width, dragState.height);
}
el.style.left = `${box.left}px`;
el.style.top = `${box.top}px`;
el.style.right = 'auto';
}
}, true);

const finishDrag = (e) => {
if (!dragState || e.pointerId !== dragState.pointerId) return;
e.preventDefault();
e.stopPropagation();
el.style.cursor = 'grab';
if (dragState.moved) {
suppressTap = true;
resolveNonOverlap(el, othersGetter());
writeSavedPos(posKey, el);
setTimeout(() => { suppressTap = false; }, 60);
}
try { el.releasePointerCapture(e.pointerId); } catch (_) {}
dragState = null;
};

el.addEventListener('pointerup', finishDrag, true);
el.addEventListener('pointercancel', finishDrag, true);

el.addEventListener('click', (e) => {
e.preventDefault();
e.stopPropagation();
if (suppressTap) return;
onTap(e);
});
}

function d2edPlaceButton() {
const btns = [D2ED.button, D2ED.pullBtn, D2ED.shinraBtn].filter(Boolean);
if (!btns.length) return;
const hidden = !!D2ED.panel || !!D2EC.overlay || !!D2IE.overlay;
for (const el of btns) el.style.display = hidden ? 'none' : 'block';
if (!hidden) {
for (let i = 0; i < btns.length; i++) {
const cur = btns[i];
const others = btns.filter((_, idx) => idx !== i);
const cRect = cur.getBoundingClientRect();
const oRects = others.map(o => o.getBoundingClientRect()).filter(r => r.width > 0 && r.height > 0);
if (cRect.width > 0 && cRect.height > 0 && overlapsAny(cRect, oRects, BTN_GAP)) {
resolveNonOverlap(cur, others);
}
}
}
requestAnimationFrame(d2edPlaceButton);
}

function d2edInstall() {
window.__D2ED = D2ED;
d2edBuildInstall();
d2ecWorldInstall();
d2gameInstall();
D2ED.forge = { game: D2GAME, show: d2ieShow, entries: d2ieEntries, select: d2ieSelect, lines: d2ieAnvilLines };
D2ED.shinra = { dist: D2ED_SHINRA_DIST, angle: D2ED_SHINRA_ANGLE, pull: d2edPullEnemiesToFixedPoint, autoOn: d2edShinraAutoOn };
d2edKeepLeaderboardOff();
d2edPerfApplyDpr();
setTimeout(d2edPerfApplyGame, 1500);

const rawGet = WeakMap.prototype.get;
WeakMap.prototype.get = function (key) {
const v = rawGet.call(this, key);
if (v && key && typeof key === 'object' && key.mastery && key.cls && key.weaponDamage !== undefined && typeof v.crit === 'number') {
if (D2ED.player !== key) d2edKeepSchedule(key);
D2ED.player = key;
D2ED.extras = v;
}
if (key && typeof key === 'object' && key !== D2ED.world && Array.isArray(key.pickups) && key.player && key.stage) {
D2ED.world = key;
}
return v;
};

const style = document.createElement('style');
style.textContent = `
.d2ed-top-btn { position: fixed; top: 12px; z-index: 2147483646; display: block; height: 24px; padding: 0 8px;
background: linear-gradient(180deg, #3a2e1c, #1a140c); border: 1px solid #8f743e; border-radius: 4px;
color: #e8dcc0; text-shadow: 1px 1px 0 #000, -1px 0 #000, 0 -1px #000, 0 0 3px #000;
box-shadow: 0 3px 8px rgba(0, 0, 0, .55); cursor: grab; font: bold 10px ${UI_FONT}; letter-spacing: 0.5px; white-space: nowrap;
touch-action: none; user-select: none; -webkit-user-select: none; }
.d2ed-top-btn:hover { color: #fff; border-color: #f0c94a; }
#d2ed-overlay { position: fixed; inset: 0; z-index: 2147483647; display: grid; grid-template-rows: minmax(0, 1fr); place-items: center; padding: 12px;
background: rgba(0,0,0,.6); font: 14px/1.5 ${UI_FONT}; color: #e8e2d0; }
#d2ed-overlay .d2ed-card { position: relative; width: min(560px, 100%); max-height: 100%; min-height: 0; display: flex; flex-direction: column;
background: linear-gradient(180deg, #221a12, #120d08); border: 2px solid #8f743e; border-radius: 8px; box-shadow: 0 10px 40px #000; }
#d2ed-overlay .d2ed-head { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 10px; padding: 10px 14px; border-bottom: 1px solid #4a3418; }
#d2ed-overlay .d2ed-head b { color: #f0c94a; font-size: 18px; white-space: nowrap; }
#d2ed-overlay .d2ed-head button { white-space: nowrap; }
#d2ed-overlay .d2ed-ver { padding: 0 6px; border: 1px solid #8f743e; border-radius: 4px; color: #c7a45f; font-size: 12px; line-height: 18px; }
#d2ed-overlay .d2ed-msg { flex: 1; color: #9fd38a; font-size: 13px; }
#d2ed-overlay .d2ed-x { background: none; border: 0; color: #d8d0c0; font-size: 24px; line-height: 1; cursor: pointer; }
#d2ed-overlay .d2ed-body { overflow: auto; padding: 4px 14px 14px; }
#d2ed-overlay h3 { margin: 12px 0 4px; color: #c7a45f; font-size: 16px; }
#d2ed-overlay .d2ed-note { margin: 4px 0; color: #a39a82; font-size: 12px; }
#d2ed-overlay .d2ed-keep { display: flex; align-items: center; justify-content: flex-start; gap: 6px; margin: 8px 0 0; color: #e8dcc0; font-size: 13px; cursor: pointer; }
#d2ed-overlay .d2ed-keeprow { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 12px; margin-top: 8px; }
#d2ed-overlay .d2ed-presets { display: flex; flex-direction: column; gap: 6px; width: 100%; }
#d2ed-overlay .d2ed-presets > div { display: flex; align-items: center; gap: 6px; }
#d2ed-overlay .d2ed-presets button { flex: none; padding: 3px 8px; font-size: 13px; }
#d2ed-overlay select.d2ed-preset { flex: 1; min-width: 0; padding: 4px 6px; color: #f3e3b0; background: #000; border: 1px solid #5a4a2a; border-radius: 4px; font: 13px ${UI_FONT}; }
#d2ed-overlay input.d2ed-preset-name { flex: 1; min-width: 0; width: auto; font: 13px ${UI_FONT}; }
#d2ed-overlay .d2ed-keep input { flex: none; width: 16px; height: 16px; margin: 0; padding: 0; accent-color: #c7a45f; cursor: pointer; }
#d2ed-overlay .d2ed-attrs { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 6px; margin: 6px 0; }
#d2ed-overlay .d2ed-attr { display: flex; align-items: center; gap: 6px; padding: 4px 8px; background: rgba(0,0,0,.35); border: 1px solid #2e2216; border-radius: 6px; }
#d2ed-overlay .d2ed-attr b { flex: 1; color: #f3e3b0; }
#d2ed-overlay .d2ed-attr .d2ed-now { margin-left: 6px; color: #a89a7c; font-weight: normal; font-size: 12px; }
#d2ed-overlay .d2ed-count { min-width: 3em; text-align: center; color: #9fd38a; }
#d2ed-overlay .d2ed-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 6px 12px; margin: 6px 0; }
#d2ed-overlay label { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
#d2ed-overlay label span { display: flex; flex-direction: column; }
#d2ed-overlay small { color: #7d7462; font-size: 11px; }
#d2ed-overlay input { width: 96px; padding: 4px 6px; color: #f3e3b0; background: #000; border: 1px solid #5a4a2a; border-radius: 4px; font: 14px ui-monospace, Consolas, monospace; }
#d2ed-overlay button:not(.d2ed-x) { padding: 4px 12px; cursor: pointer; color: #f3e3b0; background: #2c2014; border: 1px solid #8f743e; border-radius: 4px; font: inherit; }
#d2ed-overlay button.d2ed-main { color: #17120b; background: #c7a45f; font-weight: bold; }
#d2ed-overlay .d2ed-row { display: flex; gap: 8px; margin-top: 8px; }
#d2ed-overlay .d2ed-modal { position: absolute; inset: 0; display: grid; place-items: center; padding: 16px; background: rgba(0,0,0,.75); border-radius: 6px; }
#d2ed-overlay .d2ed-modal-box { width: min(420px, 100%); padding: 16px 18px; background: linear-gradient(180deg, #2a1610, #140a06); border: 2px solid #b8402e; border-radius: 8px; box-shadow: 0 8px 30px #000; }
#d2ed-overlay .d2ed-modal-box b { display: block; margin-bottom: 8px; color: #ff8a66; font-size: 18px; }
#d2ed-overlay .d2ed-modal-box ul { margin: 6px 0; padding-left: 20px; color: #d8d0c0; }
#d2ed-overlay button:disabled { opacity: .45; cursor: not-allowed; }
#d2ec-overlay { position: fixed; inset: 0; z-index: 2147483647; display: flex; flex-direction: column; background: #120d08; font: 14px/1.4 ${UI_FONT}; color: #e8e2d0; }
#d2ec-overlay button { padding: 4px 12px; cursor: pointer; color: #f3e3b0; background: #2c2014; border: 1px solid #8f743e; border-radius: 4px; font: inherit; }
#d2ec-overlay input, #d2ec-overlay select { padding: 4px 6px; color: #f3e3b0; background: #000; border: 1px solid #5a4a2a; border-radius: 4px; font: 14px ${UI_FONT}; }
#d2ec-overlay .d2ec-head { flex: none; display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-bottom: 1px solid #4a3418; }
#d2ec-overlay .d2ec-head b { color: #f0c94a; font-size: 17px; white-space: nowrap; }
#d2ec-overlay .d2ec-search { flex: 1; min-width: 0; font-size: 15px; }
#d2ec-overlay .d2ec-pick, #d2ec-overlay .d2ec-grow { flex: none; }
#d2ec-overlay .d2ec-grow { flex: 1; }
#d2ec-overlay button.d2ec-x { flex: none; padding: 0 6px; background: none; border: 0; color: #d8d0c0; font-size: 26px; line-height: 1; }
#d2ec-overlay .d2ec-main { flex: 1; min-height: 0; display: grid; grid-template-columns: minmax(180px, 2fr) 5fr; }
#d2ec-overlay .d2ec-results { overflow-y: auto; padding: 6px; border-right: 1px solid #4a3418; }
#d2ec-overlay .d2ec-editor { overflow-y: auto; padding: 8px 14px; }
#d2ec-overlay .d2ec-hint { margin: 8px 4px; color: #a39a82; }
#d2ec-overlay button.d2ec-result { display: flex; align-items: center; gap: 8px; width: 100%; margin-bottom: 4px; padding: 3px 6px; text-align: left; background: rgba(0,0,0,.35); border-color: #2e2216; }
#d2ec-overlay button.d2ec-result.on { border-color: #f0c94a; background: rgba(150,120,50,.24); }
#d2ec-overlay .d2ec-result img { flex: none; width: 28px; height: 28px; object-fit: contain; image-rendering: pixelated; }
#d2ec-overlay .d2ec-result span { min-width: 0; }
#d2ec-overlay small { display: block; color: #a89a7c; font-size: 12px; }
#d2ec-overlay .d2ec-r-unique, #d2ec-overlay .d2ec-r-runeword { color: #d9c27e; }
#d2ec-overlay .d2ec-r-set { color: #4bd04b; }
#d2ec-overlay .d2ec-r-rare { color: #ffe86a; }
#d2ec-overlay .d2ec-r-magic { color: #8f9cff; }
#d2ec-overlay .d2ec-title { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
#d2ec-overlay .d2ec-title img { max-height: 64px; image-rendering: pixelated; }
#d2ec-overlay .d2ec-title b { font-size: 18px; }
#d2ec-overlay .d2ec-base { margin: 2px 0 6px; color: #d8d0c0; }
#d2ec-overlay h4 { margin: 10px 0 2px; color: #4bd04b; font-size: 13px; font-weight: normal; }
#d2ec-overlay .d2ec-row { display: flex; align-items: center; gap: 10px; padding: 3px 0; border-bottom: 1px solid #2e2216; }
#d2ec-overlay .d2ec-label { flex: 1; min-width: 0; color: #8f9cff; }
#d2ec-overlay .d2ec-range { flex: none; color: #a89a7c; font-size: 12px; white-space: nowrap; }
#d2ec-overlay .d2ec-row input { flex: none; width: 76px; font-family: ui-monospace, Consolas, monospace; }
#d2ec-overlay .d2ec-row select { flex: 1; min-width: 0; max-width: 60%; }
#d2ec-overlay .d2ec-fixed { margin: 0; padding: 3px 0; color: #8f9cff; }
#d2ec-overlay .d2ec-actions { position: sticky; bottom: -8px; display: flex; align-items: center; gap: 12px; margin-top: 8px; padding: 6px 0 8px; background: #120d08; }
#d2ec-overlay button.d2ec-ok { padding: 5px 28px; color: #17120b; background: #c7a45f; font-weight: bold; }
#d2ec-overlay .d2ec-msg { color: #9fd38a; }
#d2ec-overlay .d2ec-inv { flex: none; padding: 6px 12px 8px; border-top: 1px solid #4a3418; background: #0b0805; --d2ec-cell: min(34px, 7.4vh, calc((100vw - 24px) / 10)); }
#d2ec-overlay .d2ec-invhead { display: flex; align-items: center; gap: 12px; margin-bottom: 4px; font-size: 13px; color: #a89a7c; }
#d2ec-overlay .d2ec-invhead b { color: #c7a45f; font-weight: normal; }
#d2ec-overlay .d2ec-invinfo { color: #e8e2d0; }
#d2ec-overlay .d2ec-grid { display: grid; grid-template-columns: repeat(10, var(--d2ec-cell)); grid-template-rows: repeat(4, var(--d2ec-cell)); width: max-content; background-color: #000;
background-image: linear-gradient(#2e2216 1px, transparent 1px), linear-gradient(90deg, #2e2216 1px, transparent 1px); background-size: var(--d2ec-cell) var(--d2ec-cell); outline: 1px solid #4a3418; }
#d2ec-overlay .d2ec-item { display: grid; place-items: center; overflow: hidden; background: rgba(90,90,180,.22); font-size: 10px; line-height: 1.1; text-align: center; }
#d2ec-overlay .d2ec-item img { max-width: 100%; max-height: 100%; image-rendering: pixelated; pointer-events: none; }
#d2ec-overlay .d2ec-picker { position: absolute; inset: 0; display: flex; flex-direction: column; background: #120d08; }
#d2ec-overlay .d2ec-tabs { flex: none; display: flex; flex-wrap: wrap; gap: 3px; padding: 6px 12px; border-bottom: 1px solid #4a3418; }
#d2ec-overlay .d2ec-tabs button { padding: 2px 7px; font-size: 13px; }
#d2ec-overlay .d2ec-tabs button.on { color: #17120b; background: #c7a45f; }
#d2ec-overlay .d2ec-slots { flex: 1; min-height: 0; overflow-y: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); grid-auto-rows: 118px; gap: 4px; padding: 8px 12px; }
#d2ec-overlay button.d2ec-slot { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 4px 2px; overflow: hidden; background: rgba(0,0,0,.55); border-color: transparent; text-align: center; }
#d2ec-overlay button.d2ec-slot:hover { border-color: #7a6a3a; }
#d2ec-overlay button.d2ec-slot.kept { background: rgba(150,120,50,.24); }
#d2ec-overlay .d2ec-slot img { flex: 1; min-height: 0; max-width: 100%; object-fit: contain; image-rendering: pixelated; }
#d2ec-overlay .d2ec-slot span { flex: none; font-size: 13px; line-height: 1.15; }
#d2ec-overlay .d2ec-modal { position: absolute; inset: 0; display: grid; place-items: center; padding: 16px; background: rgba(0,0,0,.75); }
#d2ec-overlay .d2ec-modal-box { width: min(380px, 100%); padding: 16px 18px; background: linear-gradient(180deg, #2a1610, #140a06); border: 2px solid #b8402e; border-radius: 8px; }
#d2ec-overlay .d2ec-modal-box p { margin: 0 0 12px; }
@media (max-width: 620px) { #d2ec-overlay .d2ec-main { grid-template-columns: 1fr; grid-template-rows: minmax(70px, 2fr) 5fr; } #d2ec-overlay .d2ec-results { border-right: 0; border-bottom: 1px solid #4a3418; } }
`;
document.head.append(style);

D2ED.button = d2edEl('button', { id: 'd2ed-btn', class: 'd2ed-top-btn', type: 'button' }, '大神系統');
D2ED.pullBtn = d2edEl('button', { id: 'd2ed-pull-btn', class: 'd2ed-top-btn', type: 'button' }, '吞天');
D2ED.shinraBtn = d2edEl('button', { id: 'd2ed-shinra-btn', class: 'd2ed-top-btn', type: 'button' }, '神羅天征');
d2edSyncPullLabel();
d2edSyncShinraLabel();
document.body.append(D2ED.button, D2ED.pullBtn, D2ED.shinraBtn);

const allTopBtns = () => [D2ED.button, D2ED.pullBtn, D2ED.shinraBtn];

attachDraggable(D2ED.button, D2ED_SYS_POS_KEY, allTopBtns, () => {
d2edOpen();
});

attachDraggable(D2ED.pullBtn, D2ED_PULL_POS_KEY, allTopBtns, () => {
const res = d2edPullItemsToPlayer();
pullTempText = res.total ? `吞天 ${res.items}物/${res.chests}箱` : '吞天 (無)';
d2edSyncPullLabel();
clearTimeout(pullTempTimer);
pullTempTimer = setTimeout(() => {
pullTempText = '';
d2edSyncPullLabel();
}, 1000);
});

D2ED.pullBtn.addEventListener('contextmenu', (e) => {
e.preventDefault();
e.stopPropagation();
const next = !d2edEndPullOn();
try { localStorage.setItem(D2ED_ENDPULL_KEY, next ? '1' : '0'); } catch (_) {}
pullTempText = '';
d2edSyncPullLabel();
if (D2ED.panel) d2edRender();
});

attachDraggable(D2ED.shinraBtn, D2ED_SHINRA_POS_KEY, allTopBtns, () => {
const res = d2edPullEnemiesToFixedPoint(D2ED_SHINRA_DIST, D2ED_SHINRA_ANGLE);
shinraTempText = !res.ready ? '神羅天征 (未抓到)' : res.pulled ? `神羅天征 ${res.pulled}怪` : '神羅天征 (無)';
d2edSyncShinraLabel();
clearTimeout(shinraTempTimer);
shinraTempTimer = setTimeout(() => {
shinraTempText = '';
d2edSyncShinraLabel();
}, 1000);
});

D2ED.shinraBtn.addEventListener('contextmenu', (e) => {
e.preventDefault();
e.stopPropagation();
const next = !d2edShinraAutoOn();
try { localStorage.setItem(D2ED_SHINRA_AUTO_KEY, next ? '1' : '0'); } catch (_) {}
shinraTempText = '';
d2edSyncShinraLabel();
if (D2ED.panel) d2edRender();
});

for (const type of ['mousedown', 'mouseup', 'touchstart', 'touchend']) {
window.addEventListener(type, e => {
if (e.target instanceof Element && (e.target.closest('.d2ed-top-btn') || e.target.closest('#d2ed-overlay') || e.target.closest('#d2ec-overlay'))) {
e.stopImmediatePropagation();
}
}, true);
}

requestAnimationFrame(() => {
initDefaultPositions();
d2edPlaceButton();
});
window.addEventListener('resize', () => {
initDefaultPositions();
});
}

d2edInstall();
})();
