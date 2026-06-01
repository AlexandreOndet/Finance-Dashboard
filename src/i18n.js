// i18n for the app — en / fr, plus number formatting helpers.
export const I18N = {
  en: {
    appTitle: 'Allocator', appTag: 'Portfolio rebalancing',
    nav_overview: 'Overview', nav_accounts: 'Accounts', nav_data: 'Data',
    allAccounts: 'All accounts', netWorth: 'Total net worth', asOf: 'Updated May 31, 2026',
    globalAllocation: 'Global allocation', byAccount: 'By account',
    target: 'Target', actual: 'Actual', drift: 'Drift', weight: 'Weight',
    holdings: 'Holdings', asset: 'Asset', shares: 'Shares', price: 'Price', value: 'Value', today: 'Today', class: 'Class',
    overview: 'Overview', forecast: 'Forecast', nextTrades: 'Trades to reach target',
    buy: 'Buy', sell: 'Sell', hold: 'Hold', action: 'Action', deploy: 'Deploy', cash: 'Cash',
    toInvest: 'To invest', toRaise: 'To raise', netCash: 'Net cash', trades: 'trades', balanced: 'Balanced — on target',
    sharesToTrade: 'units', estimate: 'est.', onTarget: 'On target',
    positions: 'positions', viewAccount: 'Open account', backToOverview: 'Overview',
    // data page
    data_title: 'Holdings data', data_sub: 'Import, edit and export your positions',
    importCsv: 'Import CSV', exportCsv: 'Export CSV', addRow: 'Add holding', sampleData: 'Reset to sample',
    dropCsv: 'Drop a CSV file here, or click to browse', pasteCsv: 'or paste CSV',
    csvFormat: 'Expected format', csvNote: 'Prices and currencies are fetched from market data by ticker.',
    parsed: 'Parsed', rowsFound: 'rows found', apply: 'Apply', cancel: 'Cancel', remove: 'Remove',
    portfolio: 'Portfolio', targetPct: 'Target %', totalTarget: 'Targets total', mustBe100: 'should be 100%',
    priceLive: 'live', currency: 'Currency', language: 'Language', theme: 'Theme', light: 'Light', dark: 'Dark',
    // market data / settings
    settings: 'Market data', apiKey: 'Google Sheet CSV URL', apiKeyPlaceholder: 'Paste your published sheet CSV URL',
    apiKeyHelp: 'Paste the template below into cell A1 of a new Google Sheet, then Data → Split text to columns → separator "|". Publish it (File → Share → Publish to web → CSV) and paste that URL here. The URL is stored only in this browser. Add a row (ticker · name · gfSymbol · class · price) to track a new asset.',
    getKey: 'How to publish a sheet', refresh: 'Refresh prices', refreshing: 'Refreshing…',
    lastUpdated: 'Prices updated', never: 'never', usingSample: 'Using sample prices — add your Google Sheet URL for live data.',
    livePrices: 'Live prices active', sourceNote: 'Google Finance via your published Google Sheet · cached ~24h · ≤1 day old is fine.',
    fxRate: 'USD → CAD', clearKey: 'Remove URL', save: 'Save', close: 'Close',
    copyTemplate: 'Copy sheet template', copied: 'Copied!', sheetTemplateLabel: 'Sheet template (paste into cell A1)',
    accountTypes: { TFSA: 'TFSA', RRSP: 'RRSP', FHSA: 'FHSA', NONREG: 'Non-registered' },
    accountFull: { TFSA: 'Tax-Free Savings Account', RRSP: 'Registered Retirement Savings Plan', FHSA: 'First Home Savings Account', NONREG: 'Non-registered account' },
  },
  fr: {
    appTitle: 'Allocator', appTag: 'Rééquilibrage de portefeuille',
    nav_overview: "Vue d'ensemble", nav_accounts: 'Comptes', nav_data: 'Données',
    allAccounts: 'Tous les comptes', netWorth: 'Valeur nette totale', asOf: 'Mis à jour le 31 mai 2026',
    globalAllocation: 'Répartition globale', byAccount: 'Par compte',
    target: 'Cible', actual: 'Réel', drift: 'Écart', weight: 'Poids',
    holdings: 'Titres', asset: 'Actif', shares: 'Parts', price: 'Cours', value: 'Valeur', today: "Aujourd'hui", class: 'Catégorie',
    overview: "Vue d'ensemble", forecast: 'Prévision', nextTrades: 'Transactions pour atteindre la cible',
    buy: 'Acheter', sell: 'Vendre', hold: 'Conserver', action: 'Action', deploy: 'Déployer', cash: 'Liquidités',
    toInvest: 'À investir', toRaise: 'À dégager', netCash: 'Liquidités nettes', trades: 'transactions', balanced: 'Équilibré — sur la cible',
    sharesToTrade: 'parts', estimate: 'est.', onTarget: 'Sur la cible',
    positions: 'positions', viewAccount: 'Ouvrir le compte', backToOverview: "Vue d'ensemble",
    data_title: 'Données des titres', data_sub: 'Importez, modifiez et exportez vos positions',
    importCsv: 'Importer CSV', exportCsv: 'Exporter CSV', addRow: 'Ajouter un titre', sampleData: "Données d'exemple",
    dropCsv: 'Déposez un fichier CSV ici, ou cliquez pour parcourir', pasteCsv: 'ou collez le CSV',
    csvFormat: 'Format attendu', csvNote: 'Les cours et devises sont récupérés des données de marché par symbole.',
    parsed: 'Analysé', rowsFound: 'lignes trouvées', apply: 'Appliquer', cancel: 'Annuler', remove: 'Retirer',
    portfolio: 'Compte', targetPct: 'Cible %', totalTarget: 'Total des cibles', mustBe100: 'devrait être 100 %',
    priceLive: 'direct', currency: 'Devise', language: 'Langue', theme: 'Thème', light: 'Clair', dark: 'Sombre',
    settings: 'Données de marché', apiKey: 'URL CSV de la feuille Google', apiKeyPlaceholder: "Collez l'URL CSV de votre feuille publiée",
    apiKeyHelp: "Collez le modèle ci-dessous dans la cellule A1 d'une nouvelle feuille Google, puis Données → Scinder le texte en colonnes → séparateur « | ». Publiez-la (Fichier → Partager → Publier sur le Web → CSV) et collez cette URL ici. L'URL est stockée uniquement dans ce navigateur. Ajoutez une ligne (ticker · nom · gfSymbol · classe · cours) pour suivre un nouvel actif.",
    getKey: 'Comment publier une feuille', refresh: 'Actualiser les cours', refreshing: 'Actualisation…',
    lastUpdated: 'Cours mis à jour', never: 'jamais', usingSample: "Cours d'exemple — ajoutez l'URL de votre feuille Google pour les données en direct.",
    livePrices: 'Cours en direct actifs', sourceNote: 'Google Finance via votre feuille Google publiée · en cache ~24 h · ≤ 1 jour suffit.',
    fxRate: 'USD → CAD', clearKey: "Retirer l'URL", save: 'Enregistrer', close: 'Fermer',
    copyTemplate: 'Copier le modèle', copied: 'Copié !', sheetTemplateLabel: 'Modèle de feuille (collez dans la cellule A1)',
    accountTypes: { TFSA: 'CELI', RRSP: 'REER', FHSA: 'CELIAPP', NONREG: 'Non enregistré' },
    accountFull: { TFSA: "Compte d'épargne libre d'impôt", RRSP: "Régime enregistré d'épargne-retraite", FHSA: "Compte d'épargne libre d'impôt pour l'achat d'une première propriété", NONREG: 'Compte non enregistré' },
  },
};

export const t = (lang, key) => {
  const d = I18N[lang] || I18N.en;
  return d[key] !== undefined ? d[key] : (I18N.en[key] ?? key);
};
export const acctLabel = (lang, type) => (I18N[lang] || I18N.en).accountTypes[type] || type;
export const acctFull = (lang, type) => (I18N[lang] || I18N.en).accountFull[type] || type;

export const fmtMoney = (v, disp, lang, opts = {}) => new Intl.NumberFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', {
  style: 'currency', currency: disp, minimumFractionDigits: opts.decimals ?? 0, maximumFractionDigits: opts.maxDecimals ?? opts.decimals ?? 0, currencyDisplay: 'narrowSymbol',
}).format(v);
export const fmtMoneySigned = (v, disp, lang, opts = {}) => (v >= 0 ? '+' : '−') + fmtMoney(Math.abs(v), disp, lang, opts);
export const fmtNum = (v, lang, dp = 0, maxDp = dp) => new Intl.NumberFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', { minimumFractionDigits: dp, maximumFractionDigits: maxDp }).format(v);
export const fmtPct = (v, lang, dp = 1) => fmtNum(v, lang, dp) + ' %';
export const fmtPctSigned = (v, lang, dp = 1) => (v >= 0 ? '+' : '−') + fmtPct(Math.abs(v), lang, dp);
