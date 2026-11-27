(() => {
  if (window.__D2IE_TEMPER_OBSERVER) {
    window.__D2IE_TEMPER_OBSERVER.disconnect();
    window.__D2IE_TEMPER_OBSERVER = null;
  }

  const processed = new WeakSet();

  const fmtSign = (n) => {
    if (n === undefined || n === null) return null;
    const s = String(n).trim();
    if (!s || s === 'undefined' || s === 'null') return null;
    return s.startsWith('+') || s.startsWith('-') ? s : `+${s}`;
  };

  const hasNum = (n) =>
    n !== undefined &&
    n !== null &&
    String(n).trim() !== '' &&
    String(n).trim() !== 'undefined';

  // 以後只改這裡的 V0_SKILLS / V0_RULES / V0_PHRASES 即可
  const V0_SKILLS = [
    ['teeth', '骸骨之牙'],
    ['bone armor', '骸骨護甲'],
    ['bone spear', '骨矛'],
    ['bone spirit', '骸骨之魂'],
    ['bone wall', '骨牆'],
    ['skeleton mastery', '骷髏專精'],
    ['poison and bone skills', '毒素與骸骨技能'],
    ['combat skills', '戰鬥技能'],
    ['druid skills', '德魯伊技能'],
    ['werebear', '熊人變化'],
    ['lycanthropy', '變形術'],
    ['chilling armor', '寒冰甲'],
    ['curses', '詛咒'],
    ['defensive auras', '防禦靈氣'],
    ['offensive auras', '攻擊靈氣'],
    ['battle command', '戰鬥指揮'],
    ['battle orders', '戰鬥命令'],
    ['battle cry', '戰吼']
  ];

  const V0_RULES = [
    [/^\+?(\d+(?:\.\d+)?)\s+to\s+Barbarian\s+Skill\s+Levels$/i, (m) =>
      hasNum(m[1]) ? `${fmtSign(m[1])} 野蠻人技能等級` : null
    ],
    [
      /^([+-]?\d+(?:\.\d+)?)\s+to\s+([a-zA-Z\s]+?)\s*\((?:Barbarian Only|只限野蠻人)\)$/i,
      (m) => {
        if (!hasNum(m[1])) return null;
        const name = String(m[2] || '').trim().toLowerCase();
        const found = V0_SKILLS.find(([en]) => name.includes(en));
        return found ? `${fmtSign(m[1])} 至${found[1]} (只限野蠻人)` : null;
      }
    ],
    [
      /^Spear\s+on\s+striking\s+.*?(\d+(?:\.\d+)?)\s*%\s*機率施展等級\s*(\d+)\s*骸骨$/i,
      (m) =>
        hasNum(m[1]) && hasNum(m[2])
          ? `擊中時有 ${m[1]}% 機率施展等級 ${m[2]} 骨矛`
          : null
    ],
    [
      /^Armor\s+when\s+struck\s+.*?(\d+(?:\.\d+)?)\s*%\s*機率施展等級\s*(\d+)\s*骸骨$/i,
      (m) =>
        hasNum(m[1]) && hasNum(m[2])
          ? `被擊中時有 ${m[1]}% 機率施展等級 ${m[2]} 骸骨護甲`
          : null
    ],
    [/^Freezes\s+target\s*([+-]?\d+(?:\.\d+)?)$/i, (m) =>
      hasNum(m[1]) ? `凍結目標 ${fmtSign(m[1])}` : null
    ],
    [
      /^Nova\s+on\s+striking\s+.*?(\d+(?:\.\d+)?)\s*%\s*機率施展等級\s*(\d+)\s*Frost$/i,
      (m) =>
        hasNum(m[1]) && hasNum(m[2])
          ? `擊中時有 ${m[1]}% 機率施展等級 ${m[2]} 冰霜新星`
          : null
    ],
    [/^Poison\s+Length\s+Reduced\s+by\s*(\d+(?:\.\d+)?)\s*%?$/i, (m) =>
      hasNum(m[1]) ? `中毒時效縮短 ${m[1]}%` : null
    ],
    [
      /^when\s+struck\s+.*?(\d+(?:\.\d+)?)\s*%\s*機率施展等級\s*(\d+)\s*削弱$/i,
      (m) =>
        hasNum(m[1]) && hasNum(m[2])
          ? `被擊中時有 ${m[1]}% 機率施展等級 ${m[2]} 削弱`
          : null
    ],
    [
      /^on\s+striking\s+.*?(\d+(?:\.\d+)?)\s*%\s*機率施展等級\s*(\d+)\s*旋風術$/i,
      (m) =>
        hasNum(m[1]) && hasNum(m[2])
          ? `擊中時有 ${m[1]}% 機率施展等級 ${m[2]} 旋風術`
          : null
    ],
    [
      /^Armor\s+when\s+struck\s+.*?(\d+(?:\.\d+)?)\s*%\s*機率施展等級\s*(\d+)\s*颶風$/i,
      (m) =>
        hasNum(m[1]) && hasNum(m[2])
          ? `被擊中時有 ${m[1]}% 機率施展等級 ${m[2]} 氣旋護甲`
          : null
    ],
    [/^\+?(\d+(?:\.\d+)?)\s+to\s+Druid\s+Skills$/i, (m) =>
      hasNum(m[1]) ? `${fmtSign(m[1])} 德魯伊技能` : null
    ],
    [/^(?:等級\s*)?(\d+)\s+Immolation Arrow\s*\((\d+\/\d+)\s*(?:Charges|次)\)$/i, (m) =>
      hasNum(m[1]) && hasNum(m[2]) ? `等級 ${m[1]} 熾炎箭 (${m[2]} 次)` : null
    ],
    [
      /^Bolt\s+on\s+striking\s+.*?(\d+(?:\.\d+)?)\s*%\s*機率施展等級\s*(\d+)\s*神聖$/i,
      (m) =>
        hasNum(m[1]) && hasNum(m[2])
          ? `擊中時有 ${m[1]}% 機率施展等級 ${m[2]} 聖光彈`
          : null
    ],
    [/^\+?(\d+(?:\.\d+)?)\s+to\s+Paladin\s+Skill\s+Levels$/i, (m) =>
      hasNum(m[1]) ? `${fmtSign(m[1])} 聖騎士技能等級` : null
    ],
    [
      /^Lightning\s+when\s+struck\s+.*?(\d+(?:\.\d+)?)\s*%\s*機率施展等級\s*(\d+)\s*連鎖$/i,
      (m) =>
        hasNum(m[1]) && hasNum(m[2])
          ? `被擊中時有 ${m[1]}% 機率施展等級 ${m[2]} 連鎖閃電`
          : null
    ],
    [
      /^Bolt\s+when\s+struck\s+.*?(\d+(?:\.\d+)?)\s*%\s*機率施展等級\s*(\d+)\s*電荷$/i,
      (m) =>
        hasNum(m[1]) && hasNum(m[2])
          ? `被擊中時有 ${m[1]}% 機率施展等級 ${m[2]} 電能彈`
          : null
    ],
    [/^(?:等級\s*)?(\d+)\s+Thorns\s+Aura\s+When\s+Equipped$/i, (m) =>
      hasNum(m[1]) ? `裝備時賦予等級 ${m[1]} 荊棘靈氣` : null
    ],
    [/^Reduces\s+all\s+Vendor\s+Prices\s*(\d+(?:\.\d+)?)\s*%?$/i, (m) =>
      hasNum(m[1]) ? `所有商人的價格降低 ${m[1]}%` : null
    ],
    [
      /^(\d+(?:\.\d+)?)\s*%\s*Better\s+Chance\s+of\s+Getting\s+Magic\s+Items\s*\(Based\s+on\s+Character\s+Level\)$/i,
      (m) =>
        hasNum(m[1])
          ? `尋獲魔法物品機率提高 ${m[1]}% (依角色等級而定)`
          : null
    ],
    [/^Attacker\s+Takes\s+Damage\s+of\s*(\d+(?:\.\d+)?)$/i, (m) =>
      hasNum(m[1]) ? `攻擊者反傷 ${m[1]}` : null
    ],
    [/^Hit\s+Blinds\s+Target$/i, () => '擊中使目標目盲'],
    [/^\+?(\d+(?:\.\d+)?)\s+to\s+Minimum\s+Damage$/i, (m) =>
      hasNum(m[1]) ? `${fmtSign(m[1])} 最小傷害` : null
    ],
    [/^(?:等級\s*)?(\d+)\s+Fanaticism\s+Aura\s+When\s+Equipped$/i, (m) =>
      hasNum(m[1]) ? `裝備時賦予等級 ${m[1]} 狂熱靈氣` : null
    ],
    [/^(?:等級\s*)?(\d+)\s+Summon\s+Grizzly\s*\((\d+\/\d+)\s*(?:Charges|次)\)$/i, (m) =>
      hasNum(m[1]) && hasNum(m[2]) ? `等級 ${m[1]} 召喚灰熊 (${m[2]} 次)` : null
    ],
    [/^(\d+(?:\.\d+)?)\s*%\s*Chance\s+of\s+Open\s+Wounds$/i, (m) =>
      hasNum(m[1]) ? `${m[1]}% 開放傷口機率` : null
    ],
    [/^\+?(\d+(?:\.\d+)?)\s+Heal\s+Stamina\s+Plus\s*\(Based\s+on\s+Character\s+Level\)$/i, (m) =>
      hasNum(m[1]) ? `${fmtSign(m[1])} 精力恢復 (依角色等級而定)` : null
    ],
    [/^(\d+(?:\.\d+)?)\s*%\s*Extra\s+Gold\s+from\s+Monsters$/i, (m) =>
      hasNum(m[1]) ? `怪物金幣掉落量提高 ${m[1]}%` : null
    ],
    [/^Fire\s+Absorb\s*(\d+(?:\.\d+)?)\s*%?$/i, (m) =>
      hasNum(m[1]) ? `火焰吸收 ${m[1]}%` : null
    ],
    [/^\+?(\d+(?:\.\d+)?)\s+Defense\s+vs\.\s+Missile$/i, (m) =>
      hasNum(m[1]) ? `${fmtSign(m[1])} 對遠程防禦` : null
    ],
    [
      /^Spike\s+on\s+attack\s+.*?(\d+(?:\.\d+)?)\s*%\s*機率施展等級\s*(\d+)\s*冰河$/i,
      (m) =>
        hasNum(m[1]) && hasNum(m[2])
          ? `攻擊時有 ${m[1]}% 機率施展等級 ${m[2]} 冰川之槍`
          : null
    ],
    [
      /^Lightning\s+when\s+you\s+Die\s+.*?(\d+(?:\.\d+)?)\s*%\s*機率施展等級\s*(\d+)\s*連鎖閃電$/i,
      (m) =>
        hasNum(m[1]) && hasNum(m[2])
          ? `當你死亡時有 ${m[1]}% 機率施展等級 ${m[2]} 連鎖閃電`
          : null
    ],
    [/^\+?(\d+(?:\.\d+)?)\s*%\s*Enhanced Defense$/i, (m) =>
      hasNum(m[1]) ? `增強防禦 ${fmtSign(m[1])}%` : null
    ],
    [/^\+?(\d+(?:\.\d+)?)\s+Defense$/i, (m) =>
      hasNum(m[1]) ? `${fmtSign(m[1])} 防禦` : null
    ],
    [/^Armor when struck\s*(.*)$/i, (m) => {
      const rest = String(m[1] || '').trim();
      return rest ? `被擊中時 ${rest}` : '被擊中時';
    }],
    [/^when struck\s*(.*)$/i, (m) => {
      const rest = String(m[1] || '').trim();
      return rest ? `被擊中時 ${rest}` : '被擊中時';
    }],
    [/^(\d+(?:\.\d+)?)\s*%\s*Increased Chance of Blocking$/i, (m) =>
      hasNum(m[1]) ? `${m[1]}% 格擋機率提高` : null
    ],
    [/^([+-]?\d+(?:\.\d+)?)\s*%\s*Faster Block Rate$/i, (m) =>
      hasNum(m[1]) ? `${fmtSign(m[1])}% 格擋速度` : null
    ],
    [/^(\d+(?:\.\d+)?)\s*%\s*Chance of Crushing Blow$/i, (m) =>
      hasNum(m[1]) ? `${m[1]}% 粉碎打擊機率` : null
    ],
    [/^Hit Causes Monster to Flee\s*(\d+(?:\.\d+)?)\s*%?$/i, (m) =>
      hasNum(m[1]) ? `擊中使怪物逃跑 ${m[1]}%` : null
    ],
    [
      /^\+?(\d+(?:\.\d+)?)\s+to\s+Minimum\s+Poison\s+Damage\s*,\s*\+?(\d+(?:\.\d+)?)\s+to\s+Maximum\s+Poison\s+Damage$/i,
      (m) =>
        hasNum(m[1]) && hasNum(m[2])
          ? `${fmtSign(m[1])} 最小毒素傷害，${fmtSign(m[2])} 最大毒素傷害`
          : null
    ],
    [/^\+?(\d+(?:\.\d+)?)\s*%\s*to\s+(Fire|Lightning|Cold|Poison)\s+Skill\s+Damage$/i, (m) => {
      if (!hasNum(m[1])) return null;
      const elMap = { fire: '火焰', lightning: '電擊', cold: '冰寒', poison: '毒素' };
      const zhEl = elMap[String(m[2] || '').toLowerCase()] || m[2];
      return `${fmtSign(m[1])}% ${zhEl}技能傷害`;
    }],
    [/^(\d+(?:\.\d+)?)\s*%\s*Deadly\s+Strike\s*\(Based\s+on\s+Character\s+Level\)$/i, (m) =>
      hasNum(m[1]) ? `${m[1]}% 致命打擊 (依角色等級而定)` : null
    ],
    [/^(?:等級\s*)?(\d+)\s+Blood Golem\s*\((\d+\/\d+)\s*(?:Charges|次)\)$/i, (m) =>
      hasNum(m[1]) && hasNum(m[2]) ? `等級 ${m[1]} 鮮血魔像 (${m[2]} 次)` : null
    ],
    [/^(?:等級\s*)?(\d+)\s+Bone Prison\s*\((\d+\/\d+)\s*(?:Charges|次)\)$/i, (m) =>
      hasNum(m[1]) && hasNum(m[2]) ? `等級 ${m[1]} 骨牢 (${m[2]} 次)` : null
    ],
    [/^(?:等級\s*)?(\d+)\s+Life Tap\s*\((\d+\/\d+)\s*(?:Charges|次)\)$/i, (m) =>
      hasNum(m[1]) && hasNum(m[2]) ? `等級 ${m[1]} 偷取生命 (${m[2]} 次)` : null
    ],
    [/^(?:等級\s*)?(\d+)\s+Venom\s*\((\d+\/\d+)\s*(?:Charges|次)\)$/i, (m) =>
      hasNum(m[1]) && hasNum(m[2]) ? `等級 ${m[1]} 淬毒 (${m[2]} 次)` : null
    ],
    [/^Heal Stamina Plus\s*\+?(\d+(?:\.\d+)?)\s*%?$/i, (m) =>
      hasNum(m[1]) ? `精力恢復 ${m[1]}%` : null
    ],
    [/^\+?(\d+(?:\.\d+)?)\s+Maximum Stamina$/i, (m) =>
      hasNum(m[1]) ? `${fmtSign(m[1])} 精力上限` : null
    ],
    [/^\+?(\d+(?:\.\d+)?)\s+to\s+Necromancer Skill Levels$/i, (m) =>
      hasNum(m[1]) ? `${fmtSign(m[1])} 死靈法師技能等級` : null
    ],
    [/^[+\/]\s*(?:to\s+)?([a-zA-Z\s]+?)\s*\((?:Necromancer Only|只限死靈法師)\)$/i, (m) => {
      const name = String(m[1] || '').trim().toLowerCase();
      const found = V0_SKILLS.find(([en]) => name.includes(en));
      return found ? `+2 至${found[1]} (只限死靈法師)` : null;
    }],
    [/^([+-]?\d+(?:\.\d+)?)\s+to\s+([a-zA-Z\s]+?)\s*\((?:Necromancer Only|只限死靈法師)\)$/i, (m) => {
      if (!hasNum(m[1])) return null;
      const name = String(m[2] || '').trim().toLowerCase();
      const found = V0_SKILLS.find(([en]) => name.includes(en));
      return found ? `${fmtSign(m[1])} 至${found[1]} (只限死靈法師)` : null;
    }],
    [/^([+-]?\d+(?:\.\d+)?)\s+to\s+([a-zA-Z\s]+?)\s*\((?:Paladin Only|只限聖騎士)\)$/i, (m) => {
      if (!hasNum(m[1])) return null;
      const name = String(m[2] || '').trim().toLowerCase();
      const found = V0_SKILLS.find(([en]) => name.includes(en));
      return found ? `${fmtSign(m[1])} 至${found[1]} (只限聖騎士)` : null;
    }],
    [/^([+-]?\d+(?:\.\d+)?)\s+to\s+([a-zA-Z\s]+?)\s*\((?:Sorcerer Only|Sorceress Only|只限魔法使)\)$/i, (m) => {
      if (!hasNum(m[1])) return null;
      const name = String(m[2] || '').trim().toLowerCase();
      const found = V0_SKILLS.find(([en]) => name.includes(en));
      return found ? `${fmtSign(m[1])} 至${found[1]} (只限魔法使)` : null;
    }],
    [/^([+-]?\d+(?:\.\d+)?)\s+to\s+([a-zA-Z\s]+?)$/i, (m) => {
      if (!hasNum(m[1])) return null;
      const name = String(m[2] || '').trim().toLowerCase();
      const found = V0_SKILLS.find(([en]) => name.includes(en));
      return found ? `${fmtSign(m[1])} 至${found[1]}` : null;
    }],
    [/^(\d+(?:\.\d+)?)\s*%\s*Better Chance of Getting Magic Items$/i, (m) =>
      hasNum(m[1]) ? `尋獲魔法物品機率提高 ${m[1]}%` : null
    ],
    [/^([+-]?\d+(?:\.\d+)?)\s*%\s*Damage to Demons$/i, (m) =>
      hasNum(m[1]) ? `${fmtSign(m[1])}% 對惡魔的傷害` : null
    ],
    [/^([+-]?\d+(?:\.\d+)?)\s*%\s*Damage to Undead$/i, (m) =>
      hasNum(m[1]) ? `${fmtSign(m[1])}% 對不死怪物的傷害` : null
    ],
    [/^Slows Target by\s*(\d+(?:\.\d+)?)\s*%$/i, (m) =>
      hasNum(m[1]) ? `使目標減緩 ${m[1]}%` : null
    ],
    [/^([+-]?\d+(?:\.\d+)?)\s*%\s*Increased Attack Speed$/i, (m) =>
      hasNum(m[1]) ? `${fmtSign(m[1])}% 攻擊速度` : null
    ],
    [/^Adds\s+(\d+(?:\.\d+)?\s*-\s*\d+(?:\.\d+)?)\s+fire damage$/i, (m) =>
      hasNum(m[1]) ? `附加 ${m[1].replace(/\s+/g, '')} 火焰傷害` : null
    ],
    [/^Adds\s+(\d+(?:\.\d+)?\s*-\s*\d+(?:\.\d+)?)\s+lightning damage$/i, (m) =>
      hasNum(m[1]) ? `附加 ${m[1].replace(/\s+/g, '')} 電擊傷害` : null
    ],
    [/^Adds\s+(\d+(?:\.\d+)?\s*-\s*\d+(?:\.\d+)?)\s+cold damage$/i, (m) =>
      hasNum(m[1]) ? `附加 ${m[1].replace(/\s+/g, '')} 冰寒傷害` : null
    ],
    [/^([+-]?\d+(?:\.\d+)?)\s+magic\s+damage$/i, (m) =>
      hasNum(m[1]) ? `${fmtSign(m[1])} 魔法傷害` : null
    ],
    [/^\+?(\d+(?:\.\d+)?)\s*%\s*Faster Cast Rate$/i, (m) =>
      hasNum(m[1]) ? `${fmtSign(m[1])}% 施法速度` : null
    ],
    [/^(\d+(?:\.\d+)?)\s*%\s*Damage Taken Goes To Mana$/i, (m) =>
      hasNum(m[1]) ? `${m[1]}% 受到的傷害轉為法力` : null
    ],
    [/^\+?(\d+(?:\.\d+)?)\s+to\s+Life\s*\(Based on Character Level\)$/i, (m) =>
      hasNum(m[1]) ? `${fmtSign(m[1])} 生命 (依角色等級而定)` : null
    ],
    [/^Damage Reduced by\s*(\d+(?:\.\d+)?)$/i, (m) =>
      hasNum(m[1]) ? `傷害降低 ${m[1]}` : null
    ],
    [/^Replenish Life\s*([+-]?\d+(?:\.\d+)?)$/i, (m) =>
      hasNum(m[1]) ? `生命恢復 ${fmtSign(m[1])}` : null
    ],
    [/^\+?(\d+(?:\.\d+)?)\s*%\s*to\s+Maximum\s+(Fire|Lightning|Cold|Poison)\s+Resist$/i, (m) => {
      if (!hasNum(m[1])) return null;
      const elMap = { fire: '火焰', lightning: '電擊', cold: '冰寒', poison: '毒素' };
      const zhEl = elMap[String(m[2] || '').toLowerCase()] || m[2];
      return `${fmtSign(m[1])}% ${zhEl}抗性上限`;
    }]
  ];

  const V0_PHRASES = [
    ['all skills', '所有技能'],
    ['poison and bone skills', '毒素與骸骨技能'],
    ['combat skills', '戰鬥技能'],
    ['druid skills', '德魯伊技能'],
    ['freezes target', '凍結目標'],
    ['immolation arrow', '熾炎箭'],
    ['poison length reduced', '中毒時效縮短'],
    ['werebear', '熊人變化'],
    ['lycanthropy', '變形術'],
    ['fanaticism', '狂熱靈氣'],
    ['thorns', '荊棘靈氣'],
    ['vendor prices', '所有商人的價格降低'],
    ['attacker takes damage', '攻擊者反傷'],
    ['summon grizzly', '召喚灰熊'],
    ['open wounds', '開放傷口機率'],
    ['blinds target', '擊中使目標目盲'],
    ['minimum damage', '最小傷害'],
    ['extra gold from monsters', '怪物金幣掉落量提高'],
    ['fire absorb', '火焰吸收'],
    ['fire resist', '火焰抗性'],
    ['lightning resist', '電擊抗性'],
    ['cold resist', '冰寒抗性'],
    ['poison resist', '毒素抗性'],
    ['fire skill damage', '火焰技能傷害'],
    ['lightning skill damage', '電擊技能傷害'],
    ['cold skill damage', '冰寒技能傷害'],
    ['poison skill damage', '毒素技能傷害'],
    ['all resistances', '所有抗性'],
    ['strength', '力量'],
    ['dexterity', '敏捷'],
    ['vitality', '體能'],
    ['energy', '精力'],
    ['all attributes', '所有屬性'],
    ['enhanced damage', '傷害強化'],
    ['enhanced defense', '增強防禦'],
    ['defense vs. missile', '對遠程防禦'],
    ['attack rating', '攻擊準確率'],
    ['faster cast rate', '施法速度'],
    ['faster block rate', '格擋速度'],
    ['crushing blow', '粉碎打擊機率'],
    ['deadly strike', '致命打擊'],
    ['blood golem', '鮮血魔像'],
    ['monster to flee', '擊中使怪物逃跑'],
    ['minimum poison damage', '最小毒素傷害'],
    ['maximum poison damage', '最大毒素傷害'],
    ['magic damage', '魔法傷害'],
    ['lightning damage', '電擊傷害'],
    ['cold damage', '冰寒傷害'],
    ['fire damage', '火焰傷害'],
    ['faster hit recovery', '加快失衡恢復'],
    ['faster run/walk', '跑步/行走速度'],
    ['magic find', '尋獲魔法物品機率'],
    ['gold find', '額外金幣掉落'],
    ['damage reduced by', '傷害降低'],
    ['magic damage reduced by', '魔法傷害降低'],
    ['maximum life', '生命上限'],
    ['maximum mana', '法力上限'],
    ['life', '生命'],
    ['mana', '法力']
  ];

  function trDirect(s) {
    try {
      return (
        (window.D2I18N &&
          typeof window.D2I18N.translate === 'function' &&
          window.D2I18N.translate(s)) ||
        ''
      );
    } catch (_) {
      return '';
    }
  }

  function translateHead(raw) {
    if (!raw || typeof raw !== 'string') return null;
    const s = raw.trim();
    if (!s || s.includes('undefined')) return null;

    for (const [re, fn] of V0_RULES) {
      const hit = s.match(re);
      if (hit) {
        const res = fn(hit);
        if (res && !res.includes('undefined')) return res;
      }
    }

    if (!/[a-zA-Z]{2,}/.test(s)) return s;

    const d = trDirect(s);
    if (d && d !== s && /[\u4e00-\u9fff]/.test(d) && !d.includes('undefined')) return d;

    let rest = s, prefix = '', suffix = '';
    const pct = rest.match(/([+-]?\d+(?:\.\d+)?)\s*%\s*$/);
    if (pct && hasNum(pct[1])) {
      suffix = ` ${fmtSign(pct[1])}%`;
      rest = rest.slice(0, pct.index).trim();
    }
    const lead = rest.match(/^([+-]?\d+(?:\.\d+)?)\s+(?:to\s+)?/i);
    if (lead && hasNum(lead[1])) {
      prefix = `${fmtSign(lead[1])} `;
      rest = rest.slice(lead[0].length).trim();
    }

    const core = rest.replace(/^to\s+/i, '').trim().toLowerCase();
    const dCore = trDirect(core);
    if (dCore && dCore !== core && /[\u4e00-\u9fff]/.test(dCore) && !dCore.includes('undefined')) {
      return `${prefix}${dCore}${suffix}`.trim();
    }

    for (const [en, zh] of V0_PHRASES) {
      if (core.includes(en)) {
        const out = `${prefix}${zh}${suffix}`.trim();
        return out.includes('undefined') ? null : out;
      }
    }
    return null;
  }

  function run() {
    const labels = document.querySelectorAll(
      '#d2ec-overlay .d2ec-editor label.d2ec-row > span.d2ec-label'
    );
    labels.forEach((span) => {
      if (processed.has(span)) return;
      const txt = span.textContent || '';
      const m = txt.match(/^(.*?)\s*（強化\s*(\d+)\s*次）$/);
      if (!m) return;
      const zh = translateHead(m[1]);
      if (!zh || zh === m[1].trim()) return;
      processed.add(span);
      span.textContent = `${zh}（強化 ${m[2]} 次）`;
    });
  }

  run();
  const observer = new MutationObserver(() => run());
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  window.__D2IE_TEMPER_OBSERVER = observer;

  window.__D2IE_TEMPER_DICT_V0 = {
    version: 'v0.8',
    rules: V0_RULES,
    phrases: V0_PHRASES,
    skills: V0_SKILLS,
    translateHead,
    run,
    addRule(regex, formatter) {
      V0_RULES.unshift([regex, formatter]);
      run();
    },
    addPhrase(enLower, zh) {
      V0_PHRASES.unshift([String(enLower).toLowerCase(), zh]);
      run();
    }
  };
})();
