/* Dreamlight Guide – eigener deutscher Offline-Index.
 * Die Detailinhalte kommen live aus dem Dreamlight Valley Wiki (dreamlightvalleywiki.com),
 * hier stehen nur Übersicht, Zuordnung und deutsche Suchbegriffe. */
'use strict';

window.DG_DATA = {

  /* Themen auf der Startseite. cats/pages sind Kandidaten – die App prüft live,
   * welche Kategorie bzw. Übersichtsseite im Wiki wirklich existiert. */
  topics: [
    { id: 'figuren',     emoji: '🧑‍🤝‍🧑', label: 'Figuren',              hint: 'Alle Dorfbewohner, Lieblingsgeschenke, Freundschaft', cats: ['Characters', 'Villagers'], pages: ['Characters', 'Villagers'], q: 'villager' },
    { id: 'story',       emoji: '📜', label: 'Story-Missionen',      hint: 'Hauptgeschichte von Tal & Add-ons',          cats: ['Story Quests'], pages: ['Quests'], q: 'story quest' },
    { id: 'freundschaft',emoji: '💛', label: 'Freundschafts-Missionen', hint: 'Missionen der einzelnen Figuren',         cats: ['Friendship Quests'], pages: ['Quests'], q: 'friendship quest' },
    { id: 'reich',       emoji: '🌀', label: 'Reich-Missionen',      hint: 'Missionen in den Reichen des Schlosses',    cats: ['Realm Quests'], pages: ['Realms'], q: 'realm quest' },
    { id: 'kochen',      emoji: '🍲', label: 'Kochrezepte',          hint: 'Gerichte, Zutaten, Sterne & Energie',       cats: ['Meals', 'Cooking Recipes', 'Recipes'], pages: ['Cooking Recipes', 'Meals', 'Cooking'], q: 'meal recipe' },
    { id: 'zutaten',     emoji: '🥕', label: 'Zutaten',              hint: 'Gemüse, Obst, Gewürze – wo man sie findet', cats: ['Ingredients'], pages: ['Ingredients'], q: 'ingredient' },
    { id: 'handwerk',    emoji: '🔨', label: 'Handwerk',             hint: 'Herstellungsrezepte & Werkbank',            cats: ['Crafting Recipes', 'Crafting'], pages: ['Crafting Recipes', 'Crafting'], q: 'crafting' },
    { id: 'material',    emoji: '🪵', label: 'Materialien',          hint: 'Holz, Stein, Erze, Seltenes',               cats: ['Materials', 'Crafting Materials', 'Resources'], pages: ['Materials', 'Crafting Materials', 'Resources'], q: 'material' },
    { id: 'moebel',      emoji: '🛋️', label: 'Möbel & Deko',         hint: 'Möbel, Sets und wo man sie bekommt',        cats: ['Furniture'], pages: ['Furniture'], q: 'furniture' },
    { id: 'kleidung',    emoji: '👗', label: 'Kleidung',             hint: 'Outfits, Accessoires, Motive',              cats: ['Clothing'], pages: ['Clothing'], q: 'clothing' },
    { id: 'kritter',     emoji: '🦊', label: 'Kritter & Begleiter',  hint: 'Tiere zähmen, Lieblingsfutter, Zeiten',    cats: ['Critters', 'Companions'], pages: ['Critters', 'Companions'], q: 'critter' },
    { id: 'fische',      emoji: '🐟', label: 'Fische',               hint: 'Angeln: Ort, Seltenheit, Wasserfarbe',      cats: ['Fish'], pages: ['Fish', 'Fishing'], q: 'fish' },
    { id: 'edelsteine',  emoji: '💎', label: 'Edelsteine',           hint: 'Bergbau, Fundorte, Verkaufswert',           cats: ['Gems'], pages: ['Gems', 'Mining'], q: 'gem' },
    { id: 'aktivitaeten',emoji: '🎣', label: 'Aktivitäten',          hint: 'Gärtnern, Angeln, Bergbau, Sammeln, Kochen', cats: ['Activities', 'Skills', 'Gameplay'], pages: ['Activities', 'Skills', 'Gameplay'], q: 'skill' },
    { id: 'werkzeuge',   emoji: '🛠️', label: 'Werkzeuge',            hint: 'Königliche Werkzeuge & Upgrades',           cats: ['Tools', 'Royal Tools'], pages: ['Royal Tools', 'Tools'], q: 'royal tools' },
    { id: 'orte',        emoji: '🗺️', label: 'Orte & Biome',         hint: 'Gebiete freischalten, was es dort gibt',    cats: ['Biomes', 'Locations'], pages: ['Biomes', 'Locations', 'Map'], q: 'biome' },
    { id: 'reiche',      emoji: '🏰', label: 'Reiche',               hint: 'Türen im Traumschloss',                      cats: ['Realms'], pages: ['Realms', 'Dream Castle'], q: 'realm' },
    { id: 'pflichten',   emoji: '✨', label: 'Traumlicht-Aufgaben',  hint: 'Dreamlight Duties & Belohnungen',           cats: ['Dreamlight Duties'], pages: ['Dreamlight Duties', 'Dreamlight'], q: 'dreamlight duties' },
    { id: 'events',      emoji: '⭐', label: 'Events & Sternenpfade', hint: 'Zeitlich begrenzte Inhalte',               cats: ['Events', 'Star Paths'], pages: ['Events', 'Star Path'], q: 'star path' },
    { id: 'updates',     emoji: '🆕', label: 'Updates',              hint: 'Kostenlose Updates & Neuerungen',           cats: ['Updates'], pages: ['Updates', 'Patch Notes'], q: 'update' },
    { id: 'codes',       emoji: '🎁', label: 'Einlöse-Codes',        hint: 'Gratis-Gegenstände per Code',               cats: [], pages: ['Redemption Codes'], q: 'redemption codes' }
  ],

  /* Hauptspiel und alle Erweiterungen. Texte selbst verfasst (Deutsch). */
  dlcs: [
    {
      id: 'tal', name: 'Dreamlight Valley', sub: 'Hauptspiel', type: 'Hauptspiel',
      date: 'Early Access 06.09.2022 · Vollversion 05.12.2023', color: ['#4FB38A', '#2A6F8F'], emoji: '🌳',
      pages: ['Dreamlight Valley (Location)', 'Dreamlight Valley (Biome)', 'Biomes'],
      text: 'Das Tal wurde vom „Vergessen“ heimgesucht: Nachtdornen überwuchern alles, die Bewohner haben ihre Erinnerungen verloren. Du räumst das Tal auf, holst Figuren über Freundschafts- und Story-Missionen zurück, öffnest im Traumschloss die Reiche und baust dir mit Gärtnern, Angeln, Bergbau, Kochen und Handwerk dein eigenes Dorf auf. Kostenlose Updates bringen regelmäßig neue Figuren und Missionen.',
      features: ['Story „Vergessene Erinnerungen“ & Traumschloss', 'Reiche mit eigenen Figuren', 'Freundschaftsstufen bis 10', 'Sternenpfade & Events', 'Kritter-Begleiter'],
      biomes: ['Plaza', 'Peaceful Meadow', 'Dazzle Beach', 'Forest of Valor', 'Glade of Trust', 'Sunlit Plateau', 'Frosted Heights', 'Forgotten Lands'],
      chars: [],
      allChars: true
    },
    {
      id: 'rift', name: 'A Rift in Time', sub: 'Erweiterung 1 · Ewigkeitsinsel', type: 'Erweiterungspass',
      date: 'seit 05.12.2023', color: ['#E0A64B', '#B4502E'], emoji: '⏳',
      pages: ['A Rift in Time', 'Eternity Isle'],
      text: 'Jafar hat mit der Zeit experimentiert – auf der Ewigkeitsinsel (Eternity Isle) suchst du gemeinsam mit neuen Bekannten die Schätze der „Alten“ (Ancients), reparierst Zeitrisse und stellst dich am Ende Jafar.',
      features: ['Neue Region Ewigkeitsinsel', 'Story um Jafar & die Alten', 'Neue Zutaten, Rezepte & Möbel', 'Zeitbiegen (Timebending)'],
      biomes: ["Ancient's Landing", 'Glittering Dunes', 'Wild Tangle'],
      chars: ['Jafar', 'Rapunzel', 'EVE', 'Gaston', 'Zurg']
    },
    {
      id: 'vale', name: 'The Storybook Vale', sub: 'Erweiterung 2 · Märchental', type: 'Erweiterungspass',
      date: 'seit 04.12.2024', color: ['#8D6BE8', '#4C2E9E'], emoji: '📖',
      pages: ['The Storybook Vale'],
      text: 'Über eine magische Bibliothek gelangst du ins Märchental: Hier verschwimmen Märchen und Mythen. Mit der Hüterin der Geschichten (The Lorekeeper) bringst du verlorene Geschichten zurück und triffst auf Helden und Schurken aus Sage und Märchen.',
      features: ['Drei neue Biome', 'Neue Märchen-Story', 'Neue Rezepte, Kleidung & Möbel', 'Neue Kritter'],
      biomes: ['Everafter', 'Mythopia', 'The Bind'],
      chars: ['Merida', 'Maleficent', 'Hades', 'Flynn Rider', 'Aurora', 'The Lorekeeper']
    },
    {
      id: 'ranch', name: 'Wishblossom Ranch', sub: 'Erweiterung 3 · Ranch & Pferde', type: 'Erweiterungspass',
      date: 'seit 19.11.2025', color: ['#F08BB0', '#B5487A'], emoji: '🐴',
      pages: ['Wishblossom Ranch'],
      text: 'Cruella hat die Wishblossom Ranch während des Vergessens heruntergewirtschaftet – du baust sie wieder auf. Highlight sind Pferde: Du freundest dich mit ihnen an, reitest auf ihnen und nimmst sie mit ins Tal, wo sie beim Gärtnern, Bergbau und Aufräumen helfen. Pegasus kann gleiten, Maximus macht weite Sprünge.',
      features: ['Pferde reiten & mitnehmen', 'Pegasus (Gleiten) & Maximus (Weitsprung)', 'Neue Begleiter: Gänse, Stinktiere, Bienen', 'Neues Bau- & Herstellungs-System'],
      biomes: ['Wishing Alps', 'Glamor Gulch', 'Pixie Acres'],
      chars: ['Snow White', 'Cruella', 'Tinker Bell', 'Tigger']
    },
    {
      id: 'honey', name: 'Honeyglow Woods', sub: 'Abenteuer-Paket · Winnie Puuh & Freunde', type: 'Abenteuer-Paket',
      date: 'seit 08.07.2026', color: ['#F6C343', '#C98A1A'], emoji: '🍯',
      pages: ['Honeyglow Woods', 'Honeyglow Woods Adventure Pack'],
      text: 'Das erste „Adventure Pack“ – kleiner als eine große Erweiterung. In den Honeyglow Woods mit vier Teilgebieten und einem Dungeon erlebst du eine eigene Geschichte rund um Winnie Puuh und seine Freunde.',
      features: ['Imkerei (Beekeeping)', 'Pu-Stöckchen-Minispiel', 'Honig-Rezepte', 'Igel als neue Kritter'],
      biomes: ['Honeyglow Woods'],
      chars: ['Winnie the Pooh', 'Piglet', 'Eeyore']
    },
    {
      id: 'sea', name: 'The Keepsake Sea', sub: 'Erweiterung 4 · Unter Wasser & auf See', type: 'Erweiterungspass',
      date: 'seit 18.11.2026 – ganz neu!', color: ['#3FC1D9', '#1D5FA8'], emoji: '🌊',
      pages: ['The Keepsake Sea'],
      text: 'Die neueste Erweiterung führt aufs und unters Meer: Du verwandelst dich in eine Meerjungfrau bzw. einen Meermann, segelst mit deinem eigenen Schiff und triffst die vier Wächter der Keepsake Sea. Freunde ohne Flossen begleiten dich in kleinen U-Booten. Unter Wasser kannst du sogar bauen und dekorieren.',
      features: ['Meermenschen-Verwandlung & Unterwasser-Erkundung', 'Eigenes Schiff segeln', 'Unterwasser bauen & gestalten', 'Tukane als Begleiter', 'Herz-Feldfrüchte & neuer Obstbaum'],
      biomes: ['Shipwreck Shores', 'Candy Cove', 'Kingdom of Oublié'],
      chars: ['Milo', 'Captain Jack Sparrow', 'Megara', 'Captain Hook', 'Wendy'],
      note: 'Sehr neu – das Wiki ergänzt die Inhalte gerade täglich.'
    }
  ],

  /* Deutsche Suchbegriffe → englische Wiki-Begriffe (ganze Wörter, ohne Groß/klein). */
  glossary: {
    'traumlicht': 'dreamlight', 'sternenmünzen': 'star coins', 'sternmünzen': 'star coins', 'münzen': 'star coins',
    'mondsteine': 'moonstones', 'mondstein': 'moonstone', 'nachtdornen': 'night thorns', 'nachtdorn': 'night thorns',
    'kritter': 'critters', 'begleiter': 'companion', 'rezept': 'recipe', 'rezepte': 'recipes',
    'mission': 'quest', 'missionen': 'quests', 'quest': 'quest', 'aufgabe': 'quest',
    'freundschaftsmission': 'friendship quest', 'freundschaftsmissionen': 'friendship quests', 'freundschaft': 'friendship',
    'storymission': 'story quest', 'story-mission': 'story quest', 'reich': 'realm', 'reiche': 'realms', 'biom': 'biome', 'biome': 'biomes',
    'möbel': 'furniture', 'kleidung': 'clothing', 'edelstein': 'gem', 'edelsteine': 'gems',
    'angeln': 'fishing', 'fisch': 'fish', 'fische': 'fish', 'kochen': 'cooking', 'handwerk': 'crafting', 'herstellen': 'crafting',
    'gärtnern': 'gardening', 'bergbau': 'mining', 'sammeln': 'foraging', 'werkzeug': 'tool', 'werkzeuge': 'tools',
    'königliche werkzeuge': 'royal tools', 'traumschloss': 'dream castle', 'schloss': 'castle',
    'ewigkeitsinsel': 'eternity isle', 'märchental': 'storybook vale', 'sternenpfad': 'star path',
    'lieblingsgeschenk': 'favorite gifts', 'lieblingsgeschenke': 'favorite gifts', 'geschenk': 'gift', 'geschenke': 'gifts',
    'dorfbewohner': 'villagers', 'bewohner': 'villagers', 'samen': 'seeds', 'saatgut': 'seeds',
    'goofys stand': "goofy's stall", 'scrooges laden': "scrooge's store", 'dagoberts laden': "scrooge's store",
    'platz': 'plaza', 'friedliche wiese': 'peaceful meadow', 'glitzerstrand': 'dazzle beach', 'wald der tapferkeit': 'forest of valor',
    'lichtung des vertrauens': 'glade of trust', 'sonnenplateau': 'sunlit plateau', 'frostige höhen': 'frosted heights', 'frosthöhen': 'frosted heights',
    'vergessene lande': 'forgotten lands', 'pferd': 'horse', 'pferde': 'horses', 'meerjungfrau': 'mermaid', 'meermann': 'merfolk', 'schiff': 'ship',
    'imkerei': 'beekeeping', 'honig': 'honey', 'igel': 'hedgehog', 'tukan': 'toucan',
    /* Figuren mit anderem deutschen Namen */
    'micky': 'mickey mouse', 'micky maus': 'mickey mouse', 'dagobert': 'scrooge mcduck', 'dagobert duck': 'scrooge mcduck',
    'arielle': 'ariel', 'prinz erik': 'prince eric', 'erik': 'prince eric', 'biest': 'the beast', 'das biest': 'the beast',
    'gute fee': 'fairy godmother', 'schneewittchen': 'snow white', 'tinkerbell': 'tinker bell', 'dornröschen': 'aurora',
    'malefiz': 'maleficent', 'ferkel': 'piglet', 'i-aah': 'eeyore', 'iaah': 'eeyore', 'puuh': 'winnie the pooh', 'winnie puuh': 'winnie the pooh',
    'mutter gothel': 'mother gothel', 'vaiana': 'moana', 'susi': 'lady', 'strolch': 'tramp', 'aschenputtel': 'cinderella',
    'käpt\'n hook': 'captain hook', 'kapitän hook': 'captain hook', 'jack sparrow': 'captain jack sparrow', 'meg': 'megara',
    'eve': 'eve', 'wall-e': 'wall-e', 'buzz': 'buzz lightyear', 'mike glotzkowski': 'mike wazowski', 'sulley': 'sulley',
    'ralph': 'wreck-it ralph', 'randale ralph': 'wreck-it ralph', 'merlin': 'merlin', 'zurg': 'zurg'
  },

  changelog: [
    { v: '1.0', date: '20.11.2026', items: [
      'Erste Version des Dreamlight Guide',
      'Live-Suche im kompletten Dreamlight Valley Wiki (über 11.000 Einträge)',
      'Deutsche Suchbegriffe & automatische Übersetzung der Wiki-Texte (ML Kit, auf dem Handy)',
      'Themen: Figuren, Missionen, Rezepte, Zutaten, Möbel, Kritter, Orte u. v. m.',
      'Hauptspiel & alle Add-ons bis „The Keepsake Sea“ im deutschen Index',
      'Missions-Checklisten zum Abhaken, Merkliste, Verlauf',
      '„Wo kommt das vor?“ – Zusammenhänge zwischen Gegenständen, Figuren & Missionen',
      'Offline-Speicher für bereits geöffnete Seiten'
    ]}
  ]
};
