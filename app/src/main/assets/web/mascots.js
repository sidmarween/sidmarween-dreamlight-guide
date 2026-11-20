/* Eigene Maskottchen des Dreamlight Guide (frei erfunden, © marween):
 * Funkel – das Sternchen, Mumi – der Pilz, Wolki – die Wolke, Sprössi – der Keimling */
'use strict';

window.DG_MASCOTS = (function () {
  const face = (cx, cy, s, sleepy) => `
    ${sleepy
      ? `<path d="M${cx - 9 * s},${cy} q${4 * s},${4 * s} ${8 * s},0 M${cx + 1 * s},${cy} q${4 * s},${4 * s} ${8 * s},0" stroke="#3A2466" stroke-width="${2.4 * s}" fill="none" stroke-linecap="round"/>`
      : `<ellipse cx="${cx - 6 * s}" cy="${cy}" rx="${3.2 * s}" ry="${4 * s}" fill="#3A2466"/>
         <ellipse cx="${cx + 6 * s}" cy="${cy}" rx="${3.2 * s}" ry="${4 * s}" fill="#3A2466"/>
         <circle cx="${cx - 5 * s}" cy="${cy - 1.6 * s}" r="${1.3 * s}" fill="#fff"/>
         <circle cx="${cx + 7 * s}" cy="${cy - 1.6 * s}" r="${1.3 * s}" fill="#fff"/>`}
    <ellipse cx="${cx - 12 * s}" cy="${cy + 5 * s}" rx="${3.6 * s}" ry="${2.2 * s}" fill="#FF8FB8" opacity=".75"/>
    <ellipse cx="${cx + 12 * s}" cy="${cy + 5 * s}" rx="${3.6 * s}" ry="${2.2 * s}" fill="#FF8FB8" opacity=".75"/>
    <path d="M${cx - 3.2 * s},${cy + 5 * s} q${3.2 * s},${3.4 * s} ${6.4 * s},0" stroke="#3A2466" stroke-width="${2 * s}" fill="none" stroke-linecap="round"/>`;

  const sparkle = (x, y, r, c) =>
    `<path d="M${x},${y - r} Q${x + r * .18},${y - r * .18} ${x + r},${y} Q${x + r * .18},${y + r * .18} ${x},${y + r} Q${x - r * .18},${y + r * .18} ${x - r},${y} Q${x - r * .18},${y - r * .18} ${x},${y - r}Z" fill="${c || '#FFE9A8'}"/>`;

  function funkel(size, opts) {
    opts = opts || {};
    return `<svg class="m-funkel" width="${size}" height="${size}" viewBox="0 0 120 120" aria-hidden="true">
      <defs><radialGradient id="fkg" cx="45%" cy="35%" r="70%"><stop offset="0" stop-color="#FFF4C7"/><stop offset=".6" stop-color="#FFD66E"/><stop offset="1" stop-color="#F7B23B"/></radialGradient></defs>
      <circle cx="60" cy="62" r="46" fill="#FFD66E" opacity=".18"/>
      <path d="M60,14 C66,14 68,34 74,40 C80,46 102,44 104,50 C106,57 88,68 86,76 C84,84 94,102 88,106 C82,110 66,96 60,96 C54,96 38,110 32,106 C26,102 36,84 34,76 C32,68 14,57 16,50 C18,44 40,46 46,40 C52,34 54,14 60,14Z"
        fill="url(#fkg)" stroke="#F2A93B" stroke-width="2.5" stroke-linejoin="round"/>
      ${face(60, 62, 1, opts.sleepy)}
      ${opts.noSparks ? '' : sparkle(104, 20, 7) + sparkle(16, 28, 5, '#FFC7E0') + sparkle(100, 96, 4, '#BDE7FF')}
    </svg>`;
  }

  function mumi(size, opts) {
    opts = opts || {};
    return `<svg class="m-mumi" width="${size}" height="${size}" viewBox="0 0 120 120" aria-hidden="true">
      <ellipse cx="60" cy="108" rx="30" ry="5" fill="#000" opacity=".18"/>
      <path d="M40,70 C40,96 46,106 60,106 C74,106 80,96 80,70Z" fill="#FFF3E3" stroke="#E8CFAF" stroke-width="2"/>
      ${face(60, 84, .8, opts.sleepy)}
      <path d="M14,70 C14,34 36,18 60,18 C84,18 106,34 106,70 C106,76 98,78 60,78 C22,78 14,76 14,70Z" fill="#FF8FB8" stroke="#E46A98" stroke-width="2.5"/>
      <circle cx="40" cy="44" r="7" fill="#fff" opacity=".9"/><circle cx="66" cy="32" r="5" fill="#fff" opacity=".9"/>
      <circle cx="84" cy="54" r="6" fill="#fff" opacity=".9"/><circle cx="58" cy="58" r="4" fill="#fff" opacity=".8"/>
    </svg>`;
  }

  function wolki(size, opts) {
    opts = opts || {};
    return `<svg class="m-wolki" width="${size}" height="${size * .8}" viewBox="0 0 120 96" aria-hidden="true">
      <path d="M28,78 C12,78 6,66 10,56 C14,46 24,44 30,46 C30,30 44,20 58,22 C70,24 76,32 78,38 C84,32 98,32 104,44 C112,48 114,58 110,66 C106,74 100,78 92,78Z"
        fill="#F3EEFF" stroke="#C9B9F2" stroke-width="2.5" stroke-linejoin="round"/>
      ${face(60, 56, .85, opts.sleepy !== false)}
      ${sparkle(104, 14, 6) }
      <path d="M18,12 a10,10 0 1,0 12,14 a8,8 0 1,1 -12,-14Z" fill="#FFE7A8"/>
    </svg>`;
  }

  function sproessi(size, opts) {
    opts = opts || {};
    return `<svg class="m-sproessi" width="${size}" height="${size}" viewBox="0 0 120 120" aria-hidden="true">
      <ellipse cx="60" cy="108" rx="28" ry="5" fill="#000" opacity=".18"/>
      <path d="M60,40 C60,30 58,24 60,16" stroke="#4FB38A" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M60,22 C48,10 34,14 32,22 C44,28 54,28 60,22Z" fill="#7BE0A8" stroke="#4FB38A" stroke-width="2"/>
      <path d="M60,20 C70,6 86,8 88,16 C78,24 66,26 60,20Z" fill="#9AF0BF" stroke="#4FB38A" stroke-width="2"/>
      <ellipse cx="60" cy="74" rx="34" ry="34" fill="#B8F0D2" stroke="#5CC596" stroke-width="2.5"/>
      ${face(60, 72, 1, opts.sleepy)}
    </svg>`;
  }

  /* Kleine Szene für die Startseite: Hügel, Mond, Maskottchen */
  function heroScene() {
    return `<svg class="hero-scene" viewBox="0 0 360 120" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <path d="M0,70 C60,48 120,52 180,62 C240,72 300,54 360,58 L360,120 L0,120Z" fill="#3B2680" opacity=".7"/>
      <path d="M0,86 C70,70 140,74 200,84 C260,94 310,80 360,84 L360,120 L0,120Z" fill="#4FB38A"/>
      <path d="M0,100 C80,92 160,96 230,104 C290,110 330,100 360,102 L360,120 L0,120Z" fill="#3C9474"/>
      <g fill="#FF8FB8"><circle cx="40" cy="96" r="3"/><circle cx="52" cy="100" r="2.4"/><circle cx="300" cy="92" r="3"/><circle cx="318" cy="96" r="2.4"/></g>
      <g fill="#FFE9A8"><circle cx="150" cy="102" r="2.6"/><circle cx="240" cy="106" r="2.2"/></g>
    </svg>`;
  }

  const tips = [
    'Rede jeden Tag mit deinen Lieblingsfiguren – das bringt Freundschaft!',
    'Lieblingsgeschenke bringen am meisten Freundschaft. Schau auf der Figurenseite nach!',
    'Kritter zähmst du mit ihrem Lieblingsfutter. Tipp auf „Kritter & Begleiter“!',
    'Vergiss nicht, deine Pflanzen zu gießen – sonst wachsen sie nicht weiter.',
    'Mit Traumlicht öffnest du neue Gebiete und Türen im Schloss.',
    'Hake in Missionen die Ziele ab – ich merke mir deinen Fortschritt!',
    'Du kannst einfach auf Deutsch suchen – ich übersetze für dich.',
    'Bei jedem Eintrag zeigt „Wo kommt das vor?“, wer und was damit zusammenhängt.',
    'Mit ☆ legst du Seiten auf deine Merkliste.',
    'Neu im Meer? Alles zu „The Keepsake Sea“ findest du unten bei den Add-ons.'
  ];

  return { funkel, mumi, wolki, sproessi, heroScene, sparkle, tips };
})();
