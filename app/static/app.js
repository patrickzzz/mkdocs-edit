const { createApp, nextTick } = Vue;

let nodeCounter = 0;
const EDITOR_MODE_STORAGE_KEY = "mkdocs-edit-editor-mode";

function createNodeId() {
  nodeCounter += 1;
  return `node-${Date.now()}-${nodeCounter}`;
}

function normalizeNode(node) {
  const normalized = {
    id: node.id || createNodeId(),
    type: node.type,
    title: node.title || "",
  };
  if (node.type === "group") {
    normalized.children = Array.isArray(node.children) ? node.children.map(normalizeNode) : [];
  } else {
    normalized.path = node.path || "";
  }
  return normalized;
}

function encodeNodeForApi(node) {
  if (node.type === "group") {
    return {
      type: "group",
      title: node.title,
      children: node.children.map(encodeNodeForApi),
    };
  }
  return {
    type: "link",
    title: node.title,
    path: node.path,
  };
}

function buildNodeMap(nodes, map = {}) {
  for (const node of nodes) {
    map[node.id] = node;
    if (node.type === "group") {
      buildNodeMap(node.children, map);
    }
  }
  return map;
}

const I18N = {
  de: {
    "app.title": "MkDocsEdit",
    "preview.label": "Preview",
    "preview.reload": "Neu laden",
    "preview.openTab": "Im Tab öffnen",
    "preview.title": "mkdocs serve",
    "nav.title": "Navigation",
    "nav.save": "Nav speichern",
    "nav.newPage": "Neue Seite",
    "nav.link": "Verweis",
    "nav.group": "Gruppe",
    "nav.dragHint": "Sortieren per Drag and Drop: Ziehen zwischen Gruppen oder im Root.",
    "page.noneLoaded": "Keine Seite geladen",
    "page.edit": "Seite bearbeiten",
    "page.upload": "Datei hochladen",
    "page.save": "Speichern",
    "page.noContentTitle": "Kein Seiteninhalt editierbar",
    "page.noContentBody": "Dieser Eintrag verweist extern. Du kannst den Link ueber 'Seite bearbeiten' aendern.",
    "group.edit": "Gruppe bearbeiten",
    "group.noContentTitle": "Gruppen haben keinen eigenen Inhalt",
    "group.noContentBody": "Du kannst nur den Gruppentitel bearbeiten oder Untereintraege verwalten.",
    "common.delete": "Löschen",
    "common.title": "Titel",
    "common.filePath": "Datei / Pfad",
    "common.cancel": "Abbrechen",
    "common.save": "Speichern",
    "link.new": "Neuer Link",
    "link.edit": "Link bearbeiten",
    "link.type": "Typ",
    "link.typeInternal": "Interne Seite",
    "link.typeExternal": "Externe URL",
    "link.url": "URL",
    "link.pathExample": "guide/start.md",
    "settings.button": "Settings",
    "settings.title": "Einstellungen",
    "settings.form": "Form",
    "settings.siteName": "Site Name",
    "settings.docLanguage": "Doku-Sprache",
    "settings.autoDefault": "(Auto)",
    "settings.logoPath": "Logo Datei (theme.logo)",
    "settings.logoUpload": "Logo hochladen",
    "settings.logoIcon": "Logo Icon (theme.icon.logo)",
    "settings.primaryColor": "Primary Farbe",
    "settings.accentColor": "Accent Farbe",
    "settings.colorScheme": "Farbschema",
    "settings.uploadDir": "Upload Ordner (unter docs/)",
    "settings.allowedTypes": "Erlaubte Datei-Endungen (Komma-getrennt)",
    "settings.navTabs": "Hauptmenü als Top-Tabs aktivieren (Material only)",
    "settings.navTabsSticky": "Top-Tabs im Header fixieren (Material only)",
    "settings.firstGroupHint": "Mit Top-Tabs wird die erste Navigationsebene (z. B. erste Gruppe) im Header-Menü angezeigt.",
    "settings.managedSummary": "Welche Settings werden hier gepflegt?",
    "settings.managedKeys": "site_name, theme.language, theme.logo, theme.icon.logo, theme.palette.{scheme,primary,accent}, theme.features[navigation.tabs], editor.upload.*",
    "language.label": "Sprache",
    "runtime.confirmUnsavedSwitch": "Du hast ungespeicherte Aenderungen auf der Seite. Trotzdem wechseln?",
    "runtime.popupBlocked": "Popup blockiert. Bitte Popups erlauben.",
    "runtime.pageSaved": "Seite gespeichert",
    "runtime.pageCreated": "Seite erstellt",
    "runtime.navSaved": "Navigation gespeichert",
    "runtime.selectPageFirst": "Bitte zuerst eine Seite auswaehlen",
    "runtime.noPageSelected": "Keine Seite ausgewaehlt",
    "runtime.selectLinkFirst": "Bitte zuerst einen Link auswaehlen",
    "runtime.selectGroupFirst": "Bitte zuerst eine Gruppe auswaehlen",
    "runtime.groupTitleRequired": "Titel ist erforderlich.",
    "runtime.groupNotFound": "Gruppe wurde nicht gefunden.",
    "runtime.groupUpdated": "Gruppe aktualisiert",
    "runtime.mkdocsSaved": "mkdocs.yml gespeichert",
    "runtime.siteNameRequired": "Site Name darf nicht leer sein.",
    "runtime.uploadDirRequired": "Upload Ordner darf nicht leer sein.",
    "runtime.fileTypeRequired": "Mindestens ein Dateityp ist erforderlich.",
    "runtime.settingsSaved": "Einstellungen gespeichert",
    "runtime.titleTargetRequired": "Titel und Ziel sind erforderlich.",
    "runtime.externalNeedsHttp": "Externe Links muessen mit http:// oder https:// starten.",
    "runtime.internalNoExternal": "Interne Seiten duerfen keine externe URL sein.",
    "runtime.linkAdded": "Link hinzugefuegt",
    "runtime.linkNotFound": "Link wurde nicht gefunden.",
    "runtime.linkUpdated": "Link aktualisiert",
    "runtime.titlePathRequired": "Titel und Dateipfad sind erforderlich.",
    "runtime.pageNotFound": "Seite wurde nicht gefunden.",
    "runtime.pageUpdated": "Seite aktualisiert",
    "runtime.selectionNotFound": "Auswahl nicht gefunden",
    "runtime.itemRemoved": "Eintrag entfernt",
    "runtime.selectPageForUpload": "Bitte zuerst eine Seite waehlen",
    "runtime.selectInternalPageForUpload": "Bitte zuerst eine interne Seite waehlen",
    "runtime.nothingToSave": "Nichts zu speichern",
    "runtime.errorPrefix": "Fehler: {message}",
    "runtime.loadConfigFailed": "Konnte mkdocs.yml nicht laden: {message}",
    "runtime.yamlError": "YAML Fehler: {message}",
    "runtime.saveFailed": "Speichern fehlgeschlagen: {message}",
    "runtime.renameFailed": "Umbenennen fehlgeschlagen: {message}",
    "runtime.deleteFileFailed": "Datei nicht geloescht: {message}",
    "runtime.uploadFailed": "Upload fehlgeschlagen: {message}",
    "runtime.uploadSuccess": "Datei hochgeladen",
    "runtime.confirmEmbedImage": "Bild direkt einbinden?\nOK = Bild einbetten, Abbrechen = normaler Link",
    "runtime.confirmDeleteGroup": "Gruppe {title} inklusive Inhalt entfernen?",
    "runtime.confirmDeleteLink": "Link {path} aus Navigation entfernen?",
    "runtime.confirmDeletePage": "Seite {path} loeschen?",
    "runtime.editExternalViaLink": "Externe Links bitte ueber 'Link bearbeiten' aendern",
  },
  en: {
    "app.title": "MkDocsEdit",
    "preview.label": "Preview",
    "preview.reload": "Reload",
    "preview.openTab": "Open in tab",
    "preview.title": "mkdocs serve",
    "nav.title": "Navigation",
    "nav.save": "Save nav",
    "nav.newPage": "New page",
    "nav.link": "Link",
    "nav.group": "Group",
    "nav.dragHint": "Sort with drag and drop: move between groups or root.",
    "page.noneLoaded": "No page loaded",
    "page.edit": "Edit page",
    "page.upload": "Upload",
    "page.save": "Save",
    "page.noContentTitle": "No page content to edit",
    "page.noContentBody": "This item points to an external URL. Edit it via 'Edit page'.",
    "group.edit": "Edit group",
    "group.noContentTitle": "Groups do not have own content",
    "group.noContentBody": "You can edit the group title or manage its child entries.",
    "common.delete": "Delete",
    "common.title": "Title",
    "common.filePath": "File / path",
    "common.cancel": "Cancel",
    "common.save": "Save",
    "link.new": "New link",
    "link.edit": "Edit link",
    "link.type": "Type",
    "link.typeInternal": "Internal page",
    "link.typeExternal": "External URL",
    "link.url": "URL",
    "link.pathExample": "guide/start.md",
    "settings.button": "Settings",
    "settings.title": "Settings",
    "settings.form": "Form",
    "settings.siteName": "Site name",
    "settings.docLanguage": "Docs language",
    "settings.autoDefault": "(Auto)",
    "settings.logoPath": "Logo file (theme.logo)",
    "settings.logoUpload": "Upload logo",
    "settings.logoIcon": "Logo icon (theme.icon.logo)",
    "settings.primaryColor": "Primary color",
    "settings.accentColor": "Accent color",
    "settings.colorScheme": "Color scheme",
    "settings.uploadDir": "Upload directory (under docs/)",
    "settings.allowedTypes": "Allowed file extensions (comma separated)",
    "settings.navTabs": "Enable top navigation tabs (Material only)",
    "settings.navTabsSticky": "Keep top tabs sticky in header (Material only)",
    "settings.firstGroupHint": "Top tabs use first-level navigation items (for example your first group) in the header menu.",
    "settings.managedSummary": "Which settings are managed here?",
    "settings.managedKeys": "site_name, theme.language, theme.logo, theme.icon.logo, theme.palette.{scheme,primary,accent}, theme.features[navigation.tabs], editor.upload.*",
    "language.label": "Language",
    "runtime.confirmUnsavedSwitch": "You have unsaved page changes. Switch anyway?",
    "runtime.popupBlocked": "Popup blocked. Please allow popups.",
    "runtime.pageSaved": "Page saved",
    "runtime.pageCreated": "Page created",
    "runtime.navSaved": "Navigation saved",
    "runtime.selectPageFirst": "Please select a page first",
    "runtime.noPageSelected": "No page selected",
    "runtime.selectLinkFirst": "Please select a link first",
    "runtime.selectGroupFirst": "Please select a group first",
    "runtime.groupTitleRequired": "Title is required.",
    "runtime.groupNotFound": "Group not found.",
    "runtime.groupUpdated": "Group updated",
    "runtime.mkdocsSaved": "mkdocs.yml saved",
    "runtime.siteNameRequired": "Site name cannot be empty.",
    "runtime.uploadDirRequired": "Upload directory cannot be empty.",
    "runtime.fileTypeRequired": "At least one file type is required.",
    "runtime.settingsSaved": "Settings saved",
    "runtime.titleTargetRequired": "Title and target are required.",
    "runtime.externalNeedsHttp": "External links must start with http:// or https://.",
    "runtime.internalNoExternal": "Internal pages cannot use an external URL.",
    "runtime.linkAdded": "Link added",
    "runtime.linkNotFound": "Link not found.",
    "runtime.linkUpdated": "Link updated",
    "runtime.titlePathRequired": "Title and file path are required.",
    "runtime.pageNotFound": "Page not found.",
    "runtime.pageUpdated": "Page updated",
    "runtime.selectionNotFound": "Selection not found",
    "runtime.itemRemoved": "Item removed",
    "runtime.selectPageForUpload": "Please select a page first",
    "runtime.selectInternalPageForUpload": "Please select an internal page first",
    "runtime.nothingToSave": "Nothing to save",
    "runtime.errorPrefix": "Error: {message}",
    "runtime.loadConfigFailed": "Could not load mkdocs.yml: {message}",
    "runtime.yamlError": "YAML error: {message}",
    "runtime.saveFailed": "Save failed: {message}",
    "runtime.renameFailed": "Rename failed: {message}",
    "runtime.deleteFileFailed": "Could not delete file: {message}",
    "runtime.uploadFailed": "Upload failed: {message}",
    "runtime.uploadSuccess": "File uploaded",
    "runtime.confirmEmbedImage": "Embed image directly?\nOK = embed image, Cancel = regular link",
    "runtime.confirmDeleteGroup": "Remove group {title} including its items?",
    "runtime.confirmDeleteLink": "Remove link {path} from navigation?",
    "runtime.confirmDeletePage": "Delete page {path}?",
    "runtime.editExternalViaLink": "Please edit external links via 'Edit link'",
  },
  fr: {
    "app.title": "MkDocsEdit",
    "preview.label": "Apercu",
    "preview.reload": "Recharger",
    "preview.openTab": "Ouvrir onglet",
    "preview.title": "mkdocs serve",
    "nav.title": "Navigation",
    "nav.save": "Enregistrer nav",
    "nav.newPage": "Nouvelle page",
    "nav.link": "Lien",
    "nav.group": "Groupe",
    "nav.dragHint": "Reorganiser par glisser-deposer entre groupes ou racine.",
    "page.noneLoaded": "Aucune page chargee",
    "page.edit": "Modifier page",
    "page.upload": "Televerser",
    "page.save": "Enregistrer",
    "page.noContentTitle": "Aucun contenu editable",
    "page.noContentBody": "Cet element pointe vers une URL externe. Modifiez-le via 'Modifier page'.",
    "group.edit": "Modifier groupe",
    "group.noContentTitle": "Les groupes n'ont pas de contenu",
    "group.noContentBody": "Vous pouvez modifier le titre du groupe ou ses sous-elements.",
    "common.delete": "Supprimer",
    "common.title": "Titre",
    "common.filePath": "Fichier / chemin",
    "common.cancel": "Annuler",
    "common.save": "Enregistrer",
    "link.new": "Nouveau lien",
    "link.edit": "Modifier lien",
    "link.type": "Type",
    "link.typeInternal": "Page interne",
    "link.typeExternal": "URL externe",
    "link.url": "URL",
    "link.pathExample": "guide/start.md",
    "settings.button": "Parametres",
    "settings.title": "Parametres",
    "settings.form": "Formulaire",
    "settings.siteName": "Nom du site",
    "settings.docLanguage": "Langue de la doc",
    "settings.autoDefault": "(Auto)",
    "settings.logoPath": "Fichier logo (theme.logo)",
    "settings.logoUpload": "Televerser logo",
    "settings.logoIcon": "Icone logo (theme.icon.logo)",
    "settings.primaryColor": "Couleur primaire",
    "settings.accentColor": "Couleur accent",
    "settings.colorScheme": "Schema de couleur",
    "settings.uploadDir": "Dossier d'upload (dans docs/)",
    "settings.allowedTypes": "Extensions autorisees (separees par virgules)",
    "settings.navTabs": "Activer les onglets de navigation (Material only)",
    "settings.navTabsSticky": "Conserver les onglets en haut (Material only)",
    "settings.firstGroupHint": "Les onglets reprennent les elements de premier niveau (ex. votre premier groupe).",
    "settings.managedSummary": "Quels parametres sont geres ici ?",
    "settings.managedKeys": "site_name, theme.language, theme.logo, theme.icon.logo, theme.palette.{scheme,primary,accent}, theme.features[navigation.tabs], editor.upload.*",
    "language.label": "Langue",
  },
  it: {
    "app.title": "MkDocsEdit",
    "preview.label": "Anteprima",
    "preview.reload": "Ricarica",
    "preview.openTab": "Apri in tab",
    "preview.title": "mkdocs serve",
    "nav.title": "Navigazione",
    "nav.save": "Salva menu",
    "nav.newPage": "Nuova pagina",
    "nav.link": "Link",
    "nav.group": "Gruppo",
    "nav.dragHint": "Riordina con drag and drop tra gruppi o root.",
    "page.noneLoaded": "Nessuna pagina caricata",
    "page.edit": "Modifica pagina",
    "page.upload": "Upload",
    "page.save": "Salva",
    "page.noContentTitle": "Nessun contenuto modificabile",
    "page.noContentBody": "Questo elemento punta a un URL esterno. Modificalo con 'Modifica pagina'.",
    "group.edit": "Modifica gruppo",
    "group.noContentTitle": "I gruppi non hanno contenuto",
    "group.noContentBody": "Puoi modificare il titolo del gruppo o i sotto-elementi.",
    "common.delete": "Elimina",
    "common.title": "Titolo",
    "common.filePath": "File / percorso",
    "common.cancel": "Annulla",
    "common.save": "Salva",
    "link.new": "Nuovo link",
    "link.edit": "Modifica link",
    "link.type": "Tipo",
    "link.typeInternal": "Pagina interna",
    "link.typeExternal": "URL esterno",
    "link.url": "URL",
    "link.pathExample": "guide/start.md",
    "settings.button": "Impostazioni",
    "settings.title": "Impostazioni",
    "settings.form": "Form",
    "settings.siteName": "Nome sito",
    "settings.docLanguage": "Lingua documentazione",
    "settings.autoDefault": "(Auto)",
    "settings.logoPath": "File logo (theme.logo)",
    "settings.logoUpload": "Carica logo",
    "settings.logoIcon": "Icona logo (theme.icon.logo)",
    "settings.primaryColor": "Colore primario",
    "settings.accentColor": "Colore accento",
    "settings.colorScheme": "Schema colore",
    "settings.uploadDir": "Cartella upload (in docs/)",
    "settings.allowedTypes": "Estensioni consentite (separate da virgola)",
    "settings.navTabs": "Abilita tab di navigazione (Material only)",
    "settings.navTabsSticky": "Mantieni i tab fissati in alto (Material only)",
    "settings.firstGroupHint": "I tab usano gli elementi di primo livello (es. primo gruppo) nell'header.",
    "settings.managedSummary": "Quali impostazioni sono gestite qui?",
    "settings.managedKeys": "site_name, theme.language, theme.logo, theme.icon.logo, theme.palette.{scheme,primary,accent}, theme.features[navigation.tabs], editor.upload.*",
    "language.label": "Lingua",
  },
  es: {
    "app.title": "MkDocsEdit",
    "preview.label": "Vista previa",
    "preview.reload": "Recargar",
    "preview.openTab": "Abrir en pestana",
    "preview.title": "mkdocs serve",
    "nav.title": "Navegacion",
    "nav.save": "Guardar menu",
    "nav.newPage": "Nueva pagina",
    "nav.link": "Enlace",
    "nav.group": "Grupo",
    "nav.dragHint": "Ordena con arrastrar y soltar entre grupos o raiz.",
    "page.noneLoaded": "Ninguna pagina cargada",
    "page.edit": "Editar pagina",
    "page.upload": "Subir",
    "page.save": "Guardar",
    "page.noContentTitle": "Sin contenido editable",
    "page.noContentBody": "Este elemento apunta a una URL externa. Editalo con 'Editar pagina'.",
    "group.edit": "Editar grupo",
    "group.noContentTitle": "Los grupos no tienen contenido",
    "group.noContentBody": "Puedes editar el titulo del grupo o sus elementos hijos.",
    "common.delete": "Eliminar",
    "common.title": "Titulo",
    "common.filePath": "Archivo / ruta",
    "common.cancel": "Cancelar",
    "common.save": "Guardar",
    "link.new": "Nuevo enlace",
    "link.edit": "Editar enlace",
    "link.type": "Tipo",
    "link.typeInternal": "Pagina interna",
    "link.typeExternal": "URL externa",
    "link.url": "URL",
    "link.pathExample": "guide/start.md",
    "settings.button": "Ajustes",
    "settings.title": "Ajustes",
    "settings.form": "Formulario",
    "settings.siteName": "Nombre del sitio",
    "settings.docLanguage": "Idioma de la documentacion",
    "settings.autoDefault": "(Auto)",
    "settings.logoPath": "Archivo logo (theme.logo)",
    "settings.logoUpload": "Subir logo",
    "settings.logoIcon": "Icono logo (theme.icon.logo)",
    "settings.primaryColor": "Color primario",
    "settings.accentColor": "Color de acento",
    "settings.colorScheme": "Esquema de color",
    "settings.uploadDir": "Directorio de subida (en docs/)",
    "settings.allowedTypes": "Extensiones permitidas (separadas por comas)",
    "settings.navTabs": "Activar pestanas de navegacion (Material only)",
    "settings.navTabsSticky": "Fijar pestanas en el encabezado (Material only)",
    "settings.firstGroupHint": "Las pestanas usan el primer nivel de navegacion (por ejemplo el primer grupo).",
    "settings.managedSummary": "Que ajustes se gestionan aqui?",
    "settings.managedKeys": "site_name, theme.language, theme.logo, theme.icon.logo, theme.palette.{scheme,primary,accent}, theme.features[navigation.tabs], editor.upload.*",
    "language.label": "Idioma",
  },
  ja: {},
  ko: {},
  zh: {},
};

I18N.ja = {
  ...I18N.en,
  "preview.reload": "再読み込み",
  "preview.openTab": "タブで開く",
  "nav.save": "ナビを保存",
  "nav.newPage": "新しいページ",
  "nav.link": "リンク",
  "nav.group": "グループ",
  "page.noneLoaded": "ページが読み込まれていません",
  "page.edit": "ページを編集",
  "page.upload": "アップロード",
  "page.save": "保存",
  "group.edit": "グループを編集",
  "common.delete": "削除",
  "common.title": "タイトル",
  "common.filePath": "ファイル / パス",
  "common.cancel": "キャンセル",
  "common.save": "保存",
  "settings.button": "設定",
  "settings.title": "設定",
  "settings.form": "フォーム",
  "settings.siteName": "サイト名",
  "settings.docLanguage": "ドキュメント言語",
  "settings.logoUpload": "ロゴをアップロード",
  "settings.uploadDir": "アップロード先（docs/配下）",
  "settings.allowedTypes": "許可する拡張子（カンマ区切り）",
  "language.label": "言語",
  "runtime.pageSaved": "ページを保存しました",
  "runtime.navSaved": "ナビゲーションを保存しました",
  "runtime.settingsSaved": "設定を保存しました",
  "runtime.uploadSuccess": "ファイルをアップロードしました",
  "runtime.nothingToSave": "保存する内容はありません",
};

I18N.ko = {
  ...I18N.en,
  "preview.reload": "새로고침",
  "preview.openTab": "탭에서 열기",
  "nav.save": "네비 저장",
  "nav.newPage": "새 페이지",
  "nav.link": "링크",
  "nav.group": "그룹",
  "page.noneLoaded": "불러온 페이지가 없습니다",
  "page.edit": "페이지 편집",
  "page.upload": "업로드",
  "page.save": "저장",
  "group.edit": "그룹 편집",
  "common.delete": "삭제",
  "common.title": "제목",
  "common.filePath": "파일 / 경로",
  "common.cancel": "취소",
  "common.save": "저장",
  "settings.button": "설정",
  "settings.title": "설정",
  "settings.form": "폼",
  "settings.siteName": "사이트 이름",
  "settings.docLanguage": "문서 언어",
  "settings.logoUpload": "로고 업로드",
  "settings.uploadDir": "업로드 폴더 (docs 하위)",
  "settings.allowedTypes": "허용 확장자 (콤마 구분)",
  "language.label": "언어",
  "runtime.pageSaved": "페이지가 저장되었습니다",
  "runtime.navSaved": "네비게이션이 저장되었습니다",
  "runtime.settingsSaved": "설정이 저장되었습니다",
  "runtime.uploadSuccess": "파일이 업로드되었습니다",
  "runtime.nothingToSave": "저장할 내용이 없습니다",
};

I18N.zh = {
  ...I18N.en,
  "preview.reload": "刷新",
  "preview.openTab": "在新标签打开",
  "nav.save": "保存导航",
  "nav.newPage": "新建页面",
  "nav.link": "链接",
  "nav.group": "分组",
  "page.noneLoaded": "未加载页面",
  "page.edit": "编辑页面",
  "page.upload": "上传",
  "page.save": "保存",
  "group.edit": "编辑分组",
  "common.delete": "删除",
  "common.title": "标题",
  "common.filePath": "文件 / 路径",
  "common.cancel": "取消",
  "common.save": "保存",
  "settings.button": "设置",
  "settings.title": "设置",
  "settings.form": "表单",
  "settings.siteName": "站点名称",
  "settings.docLanguage": "文档语言",
  "settings.logoUpload": "上传 Logo",
  "settings.uploadDir": "上传目录（docs 下）",
  "settings.allowedTypes": "允许的扩展名（逗号分隔）",
  "language.label": "语言",
  "runtime.pageSaved": "页面已保存",
  "runtime.navSaved": "导航已保存",
  "runtime.settingsSaved": "设置已保存",
  "runtime.uploadSuccess": "文件已上传",
  "runtime.nothingToSave": "没有可保存的内容",
};

function detectLocaleFromBrowser() {
  const lang = (navigator.language || "en").toLowerCase();
  if (lang.startsWith("de")) return "de";
  if (lang.startsWith("fr")) return "fr";
  if (lang.startsWith("it")) return "it";
  if (lang.startsWith("es")) return "es";
  if (lang.startsWith("ja")) return "ja";
  if (lang.startsWith("ko")) return "ko";
  if (lang.startsWith("zh")) return "zh";
  return "en";
}

function hashString(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function buildProjectPreviewTabName() {
  const key = `${window.location.origin}${window.location.pathname}`;
  return `mkdocs-preview-${hashString(key)}`;
}

const NavNode = {
  name: "NavNode",
  template: "#nav-node-template",
  props: {
    node: { type: Object, required: true },
    selectedNodeId: { type: String, default: null },
  },
};

createApp({
  components: { NavNode },
  data() {
    const storedLocale = window.localStorage.getItem("mkdocs-editor-locale");
    const browserLocale = detectLocaleFromBrowser();
    const preferred = storedLocale || browserLocale;
    const locale = Object.prototype.hasOwnProperty.call(I18N, preferred) ? preferred : "en";
    return {
      locale,
      nav: [],
      selectedPath: null,
      selectedNodeId: null,
      navDirty: false,
      pageDirty: false,
      lastSavedMarkdown: "",
      loadingPage: false,
      previewUrl: "http://127.0.0.1:8000",
      previewFrameUrl: "http://127.0.0.1:8000",
      currentPreviewPath: "/",
      previewUseDirectoryUrls: true,
      previewTabName: buildProjectPreviewTabName(),
      editor: null,
      sortables: [],
      settings: {
        siteName: "",
        uploadDir: "assets/uploads",
        uploadAllowedTypes: [],
        navigationTabs: false,
        navigationTabsSticky: false,
        docLanguage: "",
        logoPath: "",
        logoIcon: "",
        palette: {
          scheme: "",
          primary: "",
          accent: "",
        },
      },
      pageModal: {
        open: false,
        mode: "create",
        nodeId: null,
        title: "",
        path: "",
        error: "",
        backdropPressed: false,
      },
      linkModal: {
        open: false,
        mode: "create",
        nodeId: null,
        title: "",
        kind: "internal",
        path: "",
        error: "",
        backdropPressed: false,
      },
      groupModal: {
        open: false,
        nodeId: null,
        title: "",
        error: "",
        backdropPressed: false,
      },
      settingsModal: {
        open: false,
        tab: "form",
        siteName: "",
        uploadDir: "assets/uploads",
        allowedTypesText: "",
        navigationTabs: false,
        navigationTabsSticky: false,
        docLanguage: "",
        logoPath: "",
        logoIcon: "",
        colorScheme: "",
        primaryColor: "",
        accentColor: "",
        rawConfig: "",
        rawLoaded: false,
        error: "",
        backdropPressed: false,
      },
      settingsOptions: {
        docLanguages: [
          { value: "de", label: "Deutsch" },
          { value: "en", label: "English" },
          { value: "fr", label: "Francais" },
          { value: "it", label: "Italiano" },
          { value: "es", label: "Espanol" },
          { value: "ja", label: "Japanese" },
          { value: "ko", label: "Korean" },
          { value: "zh", label: "Chinese" },
        ],
        paletteSchemes: ["default", "slate"],
        paletteColors: [
          "red",
          "pink",
          "purple",
          "deep purple",
          "indigo",
          "blue",
          "light blue",
          "cyan",
          "teal",
          "green",
          "light green",
          "lime",
          "yellow",
          "amber",
          "orange",
          "deep orange",
          "brown",
          "grey",
          "blue grey",
          "black",
          "white",
        ],
        logoIcons: [
          "material/library",
          "material/book-open-page-variant",
          "material/book",
          "material/file-document",
          "material/home",
          "material/rocket-launch",
        ],
      },
    };
  },
  computed: {
    selectedNode() {
      if (!this.selectedNodeId) {
        return null;
      }
      const context = this.findNodeContext(this.selectedNodeId);
      return context ? context.node : null;
    },
    selectedNodeTitle() {
      return this.selectedNode ? this.selectedNode.title : "";
    },
    selectedLinkNode() {
      if (this.selectedNode && this.selectedNode.type === "link") {
        return this.selectedNode;
      }
      if (this.selectedPath) {
        return this.findLinkNodeByPath(this.selectedPath);
      }
      return null;
    },
    selectedGroupNode() {
      return this.selectedNode && this.selectedNode.type === "group" ? this.selectedNode : null;
    },
    selectedInternalPageNode() {
      if (!this.selectedLinkNode) {
        return null;
      }
      return this.isExternalPath(this.selectedLinkNode.path) ? null : this.selectedLinkNode;
    },
  },
  watch: {
    nav: {
      deep: true,
      handler() {
        nextTick(() => this.initSortables());
      },
    },
  },
  mounted() {
    this.setupEditor();
    this.bootstrap();
    window.addEventListener("beforeunload", this.beforeUnloadHandler);
    window.addEventListener("keydown", this.shortcutHandler, true);
  },
  beforeUnmount() {
    this.destroySortables();
    window.removeEventListener("beforeunload", this.beforeUnloadHandler);
    window.removeEventListener("keydown", this.shortcutHandler, true);
  },
  methods: {
    t(key) {
      return I18N[this.locale]?.[key] || I18N.en[key] || I18N.de[key] || key;
    },
    tf(key, vars = {}) {
      let text = this.t(key);
      Object.entries(vars).forEach(([name, value]) => {
        text = text.replaceAll(`{${name}}`, String(value));
      });
      return text;
    },
    persistLocale() {
      window.localStorage.setItem("mkdocs-editor-locale", this.locale);
    },
    showToast(message, isError = false) {
      const toast = document.getElementById("toast");
      if (!toast) {
        return;
      }
      toast.textContent = message;
      toast.style.background = isError ? "#8c2c2c" : "#1c6f5d";
      toast.classList.add("show");
      window.setTimeout(() => toast.classList.remove("show"), 1800);
    },
    async api(path, options = {}) {
      const response = await fetch(path, {
        headers: { "Content-Type": "application/json" },
        ...options,
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `API error ${response.status}`);
      }
      return response.json();
    },
    async apiForm(path, formData) {
      const response = await fetch(path, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `API error ${response.status}`);
      }
      return response.json();
    },
    splitLinkTarget(target) {
      const hashIndex = target.indexOf("#");
      const queryIndex = target.indexOf("?");
      let cutIndex = -1;
      if (hashIndex >= 0 && queryIndex >= 0) {
        cutIndex = Math.min(hashIndex, queryIndex);
      } else if (hashIndex >= 0) {
        cutIndex = hashIndex;
      } else if (queryIndex >= 0) {
        cutIndex = queryIndex;
      }

      if (cutIndex < 0) {
        return { path: target, suffix: "" };
      }
      return {
        path: target.slice(0, cutIndex),
        suffix: target.slice(cutIndex),
      };
    },
    resolveDocPathRelative(target) {
      const cleanTarget = (target || "").trim();
      if (!cleanTarget) {
        return cleanTarget;
      }

      if (
        cleanTarget.startsWith("http://") ||
        cleanTarget.startsWith("https://") ||
        cleanTarget.startsWith("mailto:") ||
        cleanTarget.startsWith("tel:") ||
        cleanTarget.startsWith("#") ||
        cleanTarget.startsWith("/")
      ) {
        return cleanTarget;
      }

      const split = this.splitLinkTarget(cleanTarget);
      const pathOnly = split.path;
      const base = this.selectedPath || "index.md";
      const baseDir = base.includes("/") ? base.slice(0, base.lastIndexOf("/")) : "";
      const normalizedBase = baseDir ? `/${baseDir}/` : "/";
      const url = new URL(pathOnly, `https://local${normalizedBase}`);
      const resolved = url.pathname.replace(/^\/+/, "");
      if (!resolved) {
        return cleanTarget;
      }
      return `/_docs/${resolved}${split.suffix}`;
    },
    rewriteMarkdownForPreview(markdown) {
      const source = markdown || "";
      return source.replace(/(!?\[[^\]]*\]\()([^\s)]+)(\))/g, (_all, prefix, target, suffix) => {
        const rewritten = this.resolveDocPathRelative(target);
        return `${prefix}${rewritten}${suffix}`;
      });
    },
    createEditorInstance(initialValue = "") {
      const initialEditType = this.getPreferredEditorMode();
      const instance = new toastui.Editor({
        el: document.querySelector("#editor"),
        height: "100%",
        previewStyle: "vertical",
        initialEditType,
        initialValue,
        previewBeforeHook: (markdown) => this.rewriteMarkdownForPreview(markdown),
      });
      instance.on("changeMode", (mode) => {
        this.persistEditorMode(mode);
      });
      instance.on("change", () => {
        if (this.loadingPage || !this.selectedPath) {
          return;
        }
        const current = this.normalizeMarkdown(this.editor.getMarkdown() || "");
        this.pageDirty = current !== this.lastSavedMarkdown;
      });

      window.setTimeout(() => {
        const tabButtons = document.querySelectorAll(".toastui-editor-tabs button");
        tabButtons.forEach((button) => {
          button.addEventListener("click", () => {
            window.setTimeout(() => {
              this.persistEditorMode(this.getCurrentEditorMode());
            }, 0);
          });
        });
      }, 0);

      return instance;
    },
    getPreferredEditorMode() {
      const mode = window.localStorage.getItem(EDITOR_MODE_STORAGE_KEY);
      if (mode === "markdown" || mode === "wysiwyg") {
        return mode;
      }
      return "markdown";
    },
    persistEditorMode(mode) {
      if (mode !== "markdown" && mode !== "wysiwyg") {
        return;
      }
      window.localStorage.setItem(EDITOR_MODE_STORAGE_KEY, mode);
    },
    getCurrentEditorMode() {
      if (!this.editor) {
        return this.getPreferredEditorMode();
      }
      if (typeof this.editor.isWysiwygMode === "function" && this.editor.isWysiwygMode()) {
        return "wysiwyg";
      }
      return "markdown";
    },
    normalizeMarkdown(value) {
      return (value || "").replace(/\r\n/g, "\n").trimEnd();
    },
    setupEditor() {
      this.editor = this.createEditorInstance("");
    },
    async setEditorMarkdownSafe(value) {
      const markdown = value || "";
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          this.editor.setMarkdown(markdown, false);
          return;
        } catch (error) {
          const message = String(error?.message || "");
          const shouldRetry = message.toLowerCase().includes("mismatched transaction");
          if (!shouldRetry || attempt === 1) {
            throw error;
          }

          await new Promise((resolve) => window.setTimeout(resolve, 30));
          try {
            this.editor.destroy();
          } catch (_ignored) {
            // no-op
          }
          this.editor = this.createEditorInstance(markdown);
          return;
        }
      }
    },
    destroySortables() {
      for (const sortable of this.sortables) {
        sortable.destroy();
      }
      this.sortables = [];
    },
    initSortables() {
      this.destroySortables();
      const lists = document.querySelectorAll("#nav-root, #nav-root .nav-children");
      lists.forEach((list) => {
        const sortable = new Sortable(list, {
          group: "mkdocs-nav",
          animation: 160,
          fallbackOnBody: true,
          swapThreshold: 0.65,
          emptyInsertThreshold: 16,
          onEnd: () => this.syncNavFromDom(),
        });
        this.sortables.push(sortable);
      });
    },
    syncNavFromDom() {
      const root = document.getElementById("nav-root");
      if (!root) {
        return;
      }
      const nodeMap = buildNodeMap(this.nav);
      const rebuildList = (ul) => {
        const output = [];
        const children = Array.from(ul.children).filter((child) => child.classList.contains("nav-li"));
        for (const li of children) {
          const nodeId = li.dataset.nodeId;
          const source = nodeMap[nodeId];
          if (!source) {
            continue;
          }
          const cloned = { id: source.id, type: source.type, title: source.title };
          if (source.type === "group") {
            const childList = li.querySelector(":scope > .group-dropzone > .nav-children");
            cloned.children = childList ? rebuildList(childList) : [];
          } else {
            cloned.path = source.path;
          }
          output.push(cloned);
        }
        return output;
      };

      this.nav = rebuildList(root);
      if (this.selectedNodeId && !nodeMap[this.selectedNodeId]) {
        this.selectedNodeId = null;
        this.selectedPath = null;
      }
      this.navDirty = true;
    },
    findNodeContext(targetId, nodes = this.nav, parent = null) {
      for (let index = 0; index < nodes.length; index += 1) {
        const node = nodes[index];
        if (node.id === targetId) {
          return { node, nodes, index, parent };
        }
        if (node.type === "group") {
          const nested = this.findNodeContext(targetId, node.children, node);
          if (nested) {
            return nested;
          }
        }
      }
      return null;
    },
    findLinkNodeByPath(path, nodes = this.nav) {
      for (const node of nodes) {
        if (node.type === "link" && node.path === path) {
          return node;
        }
        if (node.type === "group") {
          const nested = this.findLinkNodeByPath(path, node.children);
          if (nested) {
            return nested;
          }
        }
      }
      return null;
    },
    isExternalPath(path) {
      return /^https?:\/\//i.test((path || "").trim());
    },
    async selectNode(node) {
      const targetPath = node.type === "link" ? node.path : null;
      if (this.pageDirty && targetPath !== this.selectedPath) {
        const shouldSwitch = window.confirm(this.t("runtime.confirmUnsavedSwitch"));
        if (!shouldSwitch) {
          return;
        }
      }

      this.selectedNodeId = node.id;

      if (node.type !== "link") {
        this.selectedPath = null;
        this.lastSavedMarkdown = "";
        this.pageDirty = false;
        return;
      }

      if (this.isExternalPath(node.path)) {
        this.selectedPath = null;
        this.lastSavedMarkdown = "";
        this.pageDirty = false;
        return;
      }

      this.selectedPath = node.path;
      await this.loadPage(node.path);
      const previewPath = this.docPathToPreviewPath(node.path);
      this.currentPreviewPath = previewPath;
      this.reloadPreview(previewPath);
    },
    editNode(node) {
      if (node.type === "group") {
        this.openGroupModal(node);
        return;
      }

      if (node.type === "link") {
        this.openLinkModal("edit", node);
      }
    },
    editSelectedNode() {
      if (!this.selectedNode) {
        return;
      }
      if (this.selectedNode.type === "group") {
        this.openGroupModal(this.selectedNode);
        return;
      }
      if (this.selectedInternalPageNode) {
        this.openEditPageModal(this.selectedInternalPageNode);
        return;
      }
      if (this.selectedLinkNode) {
        this.openLinkModal("edit", this.selectedLinkNode);
      }
    },
    async loadSettings() {
      const data = await this.api("/api/settings");
      if (typeof data.preview?.url === "string" && data.preview.url.trim()) {
        this.previewUrl = data.preview.url.trim();
      }
      if (typeof data.preview?.use_directory_urls === "boolean") {
        this.previewUseDirectoryUrls = data.preview.use_directory_urls;
      }
      this.settings.siteName = data.site_name || "";
      const allowed = data.upload?.allowed_types;
      this.settings.uploadAllowedTypes = Array.isArray(allowed) ? allowed : [];
      this.settings.uploadDir = data.upload?.dir || "assets/uploads";
      this.settings.navigationTabs = Boolean(data.theme?.navigation_tabs);
      this.settings.navigationTabsSticky = Boolean(data.theme?.navigation_tabs_sticky);
      this.settings.docLanguage = data.theme?.language || "";
      this.settings.logoPath = data.theme?.logo || "";
      this.settings.logoIcon = data.theme?.logo_icon || "";
      this.settings.palette = {
        scheme: data.theme?.palette?.scheme || "",
        primary: data.theme?.palette?.primary || "",
        accent: data.theme?.palette?.accent || "",
      };
      const input = this.$refs.uploadInput;
      if (input && this.settings.uploadAllowedTypes.length > 0) {
        input.setAttribute("accept", this.settings.uploadAllowedTypes.join(","));
      }

      this.settingsModal.siteName = this.settings.siteName;
      this.settingsModal.uploadDir = this.settings.uploadDir;
      this.settingsModal.allowedTypesText = this.settings.uploadAllowedTypes.join(",");
      this.settingsModal.navigationTabs = this.settings.navigationTabs;
      this.settingsModal.navigationTabsSticky = this.settings.navigationTabsSticky;
      this.settingsModal.docLanguage = this.settings.docLanguage;
      this.settingsModal.logoPath = this.settings.logoPath;
      this.settingsModal.logoIcon = this.settings.logoIcon;
      this.settingsModal.colorScheme = this.settings.palette.scheme;
      this.settingsModal.primaryColor = this.settings.palette.primary;
      this.settingsModal.accentColor = this.settings.palette.accent;
    },
    async loadNav() {
      const data = await this.api("/api/nav");
      this.nav = Array.isArray(data.nav) ? data.nav.map(normalizeNode) : [];
      const firstLink = this.findFirstLink(this.nav);
      if (firstLink) {
        this.selectedNodeId = firstLink.id;
        this.selectedPath = firstLink.path;
      }
      this.navDirty = false;
    },
    findFirstLink(nodes) {
      for (const node of nodes) {
        if (node.type === "link" && !this.isExternalPath(node.path)) {
          return node;
        }
        if (node.type === "group") {
          const found = this.findFirstLink(node.children);
          if (found) {
            return found;
          }
        }
      }
      return null;
    },
    docPathToPreviewPath(docPath) {
      const cleaned = (docPath || "").trim().replace(/^\/+/, "");
      const useDirectoryUrls = this.previewUseDirectoryUrls;
      if (!cleaned || cleaned.toLowerCase() === "index.md") {
        return "/";
      }
      if (cleaned.toLowerCase().endsWith("/index.md")) {
        const section = cleaned.slice(0, -"index.md".length);
        if (useDirectoryUrls) {
          return `/${section}`;
        }
        return `/${section.replace(/\/$/, "")}.html`;
      }
      if (cleaned.toLowerCase().endsWith(".md")) {
        const stem = cleaned.slice(0, -3);
        if (useDirectoryUrls) {
          return `/${stem}/`;
        }
        return `/${stem}.html`;
      }
      return `/${cleaned}`;
    },
    async loadPage(path) {
      const data = await this.api(`/api/page?path=${encodeURIComponent(path)}`);
      this.loadingPage = true;
      try {
        const loaded = data.content || "";
        await this.setEditorMarkdownSafe(loaded);
        this.lastSavedMarkdown = this.normalizeMarkdown(loaded);
        this.pageDirty = false;
      } finally {
        this.loadingPage = false;
      }
    },
    reloadPreview(preferredPath = null) {
      if (preferredPath instanceof Event) {
        preferredPath = null;
      }
      const base = this.previewUrl.trim() || "http://127.0.0.1:8000";
      const url = new URL(base);

      if (preferredPath) {
        url.pathname = preferredPath;
      } else if (this.currentPreviewPath) {
        url.pathname = this.currentPreviewPath;
      } else {
        try {
          const current = new URL(this.previewFrameUrl, window.location.href);
          if (current.origin === url.origin && current.pathname) {
            url.pathname = current.pathname;
          }
        } catch (_ignored) {
          // keep base path
        }
      }

      url.searchParams.set("t", Date.now().toString());
      this.previewFrameUrl = url.toString();
    },
    buildPreviewUrlForTab(preferredPath = null) {
      const base = this.previewUrl.trim() || "http://127.0.0.1:8000";
      const url = new URL(base);
      if (preferredPath) {
        url.pathname = preferredPath;
      } else if (this.currentPreviewPath) {
        url.pathname = this.currentPreviewPath;
      }
      return url.toString();
    },
    openPreviewInTab() {
      const targetUrl = this.buildPreviewUrlForTab(this.currentPreviewPath || null);
      const win = window.open(targetUrl, this.previewTabName);
      if (!win) {
        this.showToast(this.t("runtime.popupBlocked"), true);
      }
    },
    onPreviewLoad() {
      const iframe = document.getElementById("preview-frame");
      if (!iframe || !iframe.contentWindow) {
        return;
      }
      try {
        const location = iframe.contentWindow.location;
        this.currentPreviewPath = location.pathname || "/";
      } catch (_ignored) {
        // ignore cross-origin/temporary access errors
      }
    },
    async saveCurrentPage() {
      if (!this.selectedPath) {
        this.showToast(this.t("runtime.noPageSelected"), true);
        return false;
      }
      try {
        const markdown = this.editor.getMarkdown();
        await this.api("/api/page", {
          method: "POST",
          body: JSON.stringify({
            path: this.selectedPath,
            content: markdown,
          }),
        });
        this.lastSavedMarkdown = this.normalizeMarkdown(markdown);
        this.pageDirty = false;
        this.showToast(this.t("runtime.pageSaved"));
        const preferred = this.selectedPath ? this.docPathToPreviewPath(this.selectedPath) : null;
        this.reloadPreview(preferred);
        return true;
      } catch (error) {
        this.showToast(this.tf("runtime.errorPrefix", { message: error.message }), true);
        return false;
      }
    },
    async saveNavigation() {
      try {
        await this.api("/api/nav", {
          method: "POST",
          body: JSON.stringify({ nav: this.nav.map(encodeNodeForApi) }),
        });
        this.navDirty = false;
        this.showToast(this.t("runtime.navSaved"));
        this.reloadPreview(this.currentPreviewPath || null);
        return true;
      } catch (error) {
        this.showToast(this.tf("runtime.errorPrefix", { message: error.message }), true);
        return false;
      }
    },
    openCreatePageModal() {
      this.pageModal.open = true;
      this.pageModal.mode = "create";
      this.pageModal.nodeId = null;
      this.pageModal.title = "Neue Seite";
      this.pageModal.path = "neueseite.md";
      this.pageModal.error = "";
    },
    openEditPageModal(node = null) {
      if (node && (node instanceof Event || node.type === "click")) {
        node = null;
      }
      const target = node || this.selectedInternalPageNode || this.findFirstLink(this.nav);
      if (!target || target.type !== "link") {
        this.showToast(this.t("runtime.selectPageFirst"), true);
        return;
      }
      if (this.isExternalPath(target.path)) {
        this.showToast(this.t("runtime.editExternalViaLink"), true);
        return;
      }
      this.selectedNodeId = target.id;
      this.selectedPath = target.path;
      this.pageModal.open = true;
      this.pageModal.mode = "edit";
      this.pageModal.nodeId = target.id;
      this.pageModal.title = target.title || "";
      this.pageModal.path = target.path || "";
      this.pageModal.error = "";
    },
    closePageModal() {
      this.pageModal.open = false;
      this.pageModal.error = "";
      this.pageModal.backdropPressed = false;
    },
    onModalMouseDown(event) {
      this.pageModal.backdropPressed = event.target === event.currentTarget;
    },
    onModalMouseUp(event) {
      const releasedOnBackdrop = event.target === event.currentTarget;
      if (this.pageModal.backdropPressed && releasedOnBackdrop) {
        this.closePageModal();
        return;
      }
      this.pageModal.backdropPressed = false;
    },
    openLinkModal(mode = "create", node = null) {
      this.linkModal.open = true;
      this.linkModal.mode = mode;
      this.linkModal.error = "";
      this.linkModal.backdropPressed = false;

      if (mode === "edit") {
        const target = node || this.selectedLinkNode;
        if (!target || target.type !== "link") {
          this.linkModal.open = false;
          this.showToast(this.t("runtime.selectLinkFirst"), true);
          return;
        }
        this.linkModal.nodeId = target.id;
        this.linkModal.title = target.title || "";
        this.linkModal.path = target.path || "";
        this.linkModal.kind = this.isExternalPath(target.path) ? "external" : "internal";
        return;
      }

      this.linkModal.nodeId = null;
      this.linkModal.title = "Neuer Link";
      this.linkModal.kind = "internal";
      this.linkModal.path = "seite.md";
    },
    closeLinkModal() {
      this.linkModal.open = false;
      this.linkModal.error = "";
      this.linkModal.backdropPressed = false;
    },
    onLinkModalMouseDown(event) {
      this.linkModal.backdropPressed = event.target === event.currentTarget;
    },
    onLinkModalMouseUp(event) {
      const releasedOnBackdrop = event.target === event.currentTarget;
      if (this.linkModal.backdropPressed && releasedOnBackdrop) {
        this.closeLinkModal();
        return;
      }
      this.linkModal.backdropPressed = false;
    },
    openGroupModal(node = null) {
      const target = node || this.selectedGroupNode;
      if (!target || target.type !== "group") {
        this.showToast(this.t("runtime.selectGroupFirst"), true);
        return;
      }
      this.groupModal.open = true;
      this.groupModal.nodeId = target.id;
      this.groupModal.title = target.title || "";
      this.groupModal.error = "";
      this.groupModal.backdropPressed = false;
    },
    closeGroupModal() {
      this.groupModal.open = false;
      this.groupModal.error = "";
      this.groupModal.backdropPressed = false;
    },
    onGroupModalMouseDown(event) {
      this.groupModal.backdropPressed = event.target === event.currentTarget;
    },
    onGroupModalMouseUp(event) {
      const releasedOnBackdrop = event.target === event.currentTarget;
      if (this.groupModal.backdropPressed && releasedOnBackdrop) {
        this.closeGroupModal();
        return;
      }
      this.groupModal.backdropPressed = false;
    },
    submitGroupModal() {
      const title = (this.groupModal.title || "").trim();
      if (!title) {
        this.groupModal.error = this.t("runtime.groupTitleRequired");
        return;
      }
      const context = this.findNodeContext(this.groupModal.nodeId);
      if (!context || context.node.type !== "group") {
        this.groupModal.error = this.t("runtime.groupNotFound");
        return;
      }
      context.node.title = title;
      this.navDirty = true;
      this.closeGroupModal();
      this.showToast(this.t("runtime.groupUpdated"));
    },
    openSettingsModal() {
      this.settingsModal.open = true;
      this.settingsModal.error = "";
      this.settingsModal.backdropPressed = false;
      this.settingsModal.tab = "form";
      this.settingsModal.rawLoaded = false;
      this.settingsModal.siteName = this.settings.siteName;
      this.settingsModal.uploadDir = this.settings.uploadDir;
      this.settingsModal.allowedTypesText = this.settings.uploadAllowedTypes.join(",");
      this.settingsModal.navigationTabs = this.settings.navigationTabs;
      this.settingsModal.navigationTabsSticky = this.settings.navigationTabsSticky;
      this.settingsModal.docLanguage = this.settings.docLanguage;
      this.settingsModal.logoPath = this.settings.logoPath;
      this.settingsModal.logoIcon = this.settings.logoIcon;
      this.settingsModal.colorScheme = this.settings.palette.scheme;
      this.settingsModal.primaryColor = this.settings.palette.primary;
      this.settingsModal.accentColor = this.settings.palette.accent;
    },
    closeSettingsModal() {
      this.settingsModal.open = false;
      this.settingsModal.error = "";
      this.settingsModal.backdropPressed = false;
    },
    onSettingsModalMouseDown(event) {
      this.settingsModal.backdropPressed = event.target === event.currentTarget;
    },
    onSettingsModalMouseUp(event) {
      const releasedOnBackdrop = event.target === event.currentTarget;
      if (this.settingsModal.backdropPressed && releasedOnBackdrop) {
        this.closeSettingsModal();
        return;
      }
      this.settingsModal.backdropPressed = false;
    },
    async switchToRawConfigTab() {
      this.settingsModal.tab = "raw";
      this.settingsModal.error = "";
      if (this.settingsModal.rawLoaded) {
        return;
      }
      try {
        const data = await this.api("/api/config/raw");
        this.settingsModal.rawConfig = data.content || "";
        this.settingsModal.rawLoaded = true;
      } catch (error) {
        this.settingsModal.error = this.tf("runtime.loadConfigFailed", { message: error.message });
      }
    },
    parseAllowedTypesText(value) {
      return value
        .split(",")
        .map((entry) => entry.trim().toLowerCase())
        .filter((entry) => entry.length > 0)
        .map((entry) => (entry.startsWith(".") ? entry : `.${entry}`));
    },
    hasOption(options, value) {
      if (!value) {
        return false;
      }
      if (!Array.isArray(options)) {
        return false;
      }
      if (options.length > 0 && typeof options[0] === "object") {
        return options.some((item) => item.value === value);
      }
      return options.includes(value);
    },
    triggerLogoUpload() {
      const input = this.$refs.settingsLogoInput;
      if (input) {
        input.click();
      }
    },
    async onLogoUploadChange(event) {
      const file = event.target.files ? event.target.files[0] : null;
      event.target.value = "";
      if (!file) {
        return;
      }

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("page_path", "");
        const result = await this.apiForm("/api/upload", formData);
        this.settingsModal.logoPath = result.path;
        this.showToast(this.t("runtime.uploadSuccess"));
      } catch (error) {
        this.settingsModal.error = this.tf("runtime.uploadFailed", { message: error.message });
      }
    },
    async saveSettingsModal() {
      this.settingsModal.error = "";
      if (this.settingsModal.tab === "raw") {
        try {
          await this.api("/api/config/raw", {
            method: "POST",
            body: JSON.stringify({ content: this.settingsModal.rawConfig }),
          });
          await this.loadSettings();
          await this.loadNav();
          if (this.selectedPath && !this.isExternalPath(this.selectedPath)) {
            await this.loadPage(this.selectedPath);
          }
          this.reloadPreview(this.currentPreviewPath || null);
          this.closeSettingsModal();
          this.showToast(this.t("runtime.mkdocsSaved"));
        } catch (error) {
          this.settingsModal.error = this.tf("runtime.yamlError", { message: error.message });
        }
        return;
      }

      const siteName = (this.settingsModal.siteName || "").trim();
      const uploadDir = (this.settingsModal.uploadDir || "").trim();
      const allowedTypes = this.parseAllowedTypesText(this.settingsModal.allowedTypesText || "");
      const docLanguage = (this.settingsModal.docLanguage || "").trim();
      const logoPath = (this.settingsModal.logoPath || "").trim();
      const logoIcon = (this.settingsModal.logoIcon || "").trim();
      const colorScheme = (this.settingsModal.colorScheme || "").trim();
      const primaryColor = (this.settingsModal.primaryColor || "").trim();
      const accentColor = (this.settingsModal.accentColor || "").trim();
      if (!siteName) {
        this.settingsModal.error = this.t("runtime.siteNameRequired");
        return;
      }
      if (!uploadDir) {
        this.settingsModal.error = this.t("runtime.uploadDirRequired");
        return;
      }
      if (allowedTypes.length === 0) {
        this.settingsModal.error = this.t("runtime.fileTypeRequired");
        return;
      }

      try {
        await this.api("/api/settings", {
          method: "POST",
          body: JSON.stringify({
            site_name: siteName,
            upload: {
              dir: uploadDir,
              allowed_types: allowedTypes,
            },
            theme: {
              navigation_tabs: Boolean(this.settingsModal.navigationTabs),
              navigation_tabs_sticky: Boolean(this.settingsModal.navigationTabsSticky),
              language: docLanguage,
              logo: logoPath,
              logo_icon: logoIcon,
              palette: {
                scheme: colorScheme,
                primary: primaryColor,
                accent: accentColor,
              },
            },
          }),
        });
        await this.loadSettings();
        this.reloadPreview(this.currentPreviewPath || null);
        this.closeSettingsModal();
        this.showToast(this.t("runtime.settingsSaved"));
      } catch (error) {
        this.settingsModal.error = this.tf("runtime.saveFailed", { message: error.message });
      }
    },
    async submitLinkModal() {
      const title = (this.linkModal.title || "").trim();
      const path = (this.linkModal.path || "").trim();
      const kind = this.linkModal.kind;

      if (!title || !path) {
        this.linkModal.error = this.t("runtime.titleTargetRequired");
        return;
      }

      if (kind === "external" && !this.isExternalPath(path)) {
        this.linkModal.error = this.t("runtime.externalNeedsHttp");
        return;
      }
      if (kind === "internal" && this.isExternalPath(path)) {
        this.linkModal.error = this.t("runtime.internalNoExternal");
        return;
      }

      if (this.linkModal.mode === "create") {
        const selected = this.selectedNodeId ? this.findNodeContext(this.selectedNodeId) : null;
        const linkNode = { id: createNodeId(), type: "link", title, path };
        if (selected && selected.node.type === "group") {
          selected.node.children.push(linkNode);
        } else if (selected && selected.parent && selected.parent.type === "group") {
          selected.parent.children.push(linkNode);
        } else {
          this.nav.push(linkNode);
        }
        this.selectedNodeId = linkNode.id;
        this.selectedPath = this.isExternalPath(path) ? null : path;
        this.navDirty = true;
        this.closeLinkModal();
        this.showToast(this.t("runtime.linkAdded"));
        if (!this.isExternalPath(path)) {
          await this.loadPage(path);
        }
        return;
      }

      const context = this.findNodeContext(this.linkModal.nodeId);
      if (!context || context.node.type !== "link") {
        this.linkModal.error = this.t("runtime.linkNotFound");
        return;
      }

      const wasExternal = this.isExternalPath(context.node.path);
      const willBeExternal = this.isExternalPath(path);
      if (!wasExternal && !willBeExternal && context.node.path !== path) {
        try {
          await this.api("/api/page/rename", {
            method: "POST",
            body: JSON.stringify({ old_path: context.node.path, new_path: path }),
          });
        } catch (error) {
          this.linkModal.error = this.tf("runtime.renameFailed", { message: error.message });
          return;
        }
      }

      context.node.title = title;
      context.node.path = path;
      this.selectedNodeId = context.node.id;
      this.selectedPath = willBeExternal ? null : path;
      this.navDirty = true;
      this.closeLinkModal();
      this.showToast(this.t("runtime.linkUpdated"));
      if (!willBeExternal) {
        await this.loadPage(path);
      } else {
        this.loadingPage = true;
        try {
          await this.setEditorMarkdownSafe(`# Externer Link\n\n[${title}](${path})\n`);
          this.lastSavedMarkdown = "";
          this.pageDirty = false;
        } finally {
          this.loadingPage = false;
        }
      }
    },
    async submitPageModal() {
      const title = (this.pageModal.title || "").trim();
      const path = (this.pageModal.path || "").trim();
      if (!title || !path) {
        this.pageModal.error = this.t("runtime.titlePathRequired");
        return;
      }

      if (this.pageModal.mode === "create") {
        try {
          await this.api("/api/page/create", {
            method: "POST",
            body: JSON.stringify({ path, title }),
          });
          const node = {
            id: createNodeId(),
            type: "link",
            title,
            path,
          };
          this.nav.push(node);
          this.navDirty = true;
          this.selectedNodeId = node.id;
          this.selectedPath = node.path;
          await this.loadPage(node.path);
          this.closePageModal();
          this.showToast(this.t("runtime.pageCreated"));
        } catch (error) {
          this.pageModal.error = this.tf("runtime.errorPrefix", { message: error.message });
        }
        return;
      }

      const context = this.findNodeContext(this.pageModal.nodeId);
      if (!context || context.node.type !== "link") {
        this.pageModal.error = this.t("runtime.pageNotFound");
        return;
      }

      const oldPath = context.node.path;
      if (oldPath !== path) {
        try {
          await this.api("/api/page/rename", {
            method: "POST",
            body: JSON.stringify({ old_path: oldPath, new_path: path }),
          });
        } catch (error) {
          this.pageModal.error = this.tf("runtime.renameFailed", { message: error.message });
          return;
        }
      }

      context.node.title = title;
      context.node.path = path;
      this.selectedNodeId = context.node.id;
      this.selectedPath = context.node.path;
      this.navDirty = true;
      this.closePageModal();
      await this.loadPage(context.node.path);
      this.showToast(this.t("runtime.pageUpdated"));
    },
    addLink() {
      this.openLinkModal("create");
    },
    addGroup() {
      const title = window.prompt("Gruppenname", "Neue Gruppe");
      if (!title) {
        return;
      }
      this.nav.push({ id: createNodeId(), type: "group", title, children: [] });
      this.navDirty = true;
    },
    async removeNode() {
      if (!this.selectedNodeId) {
        this.showToast(this.t("runtime.selectPageFirst"), true);
        return;
      }
      const context = this.findNodeContext(this.selectedNodeId);
      if (!context) {
        this.showToast(this.t("runtime.selectionNotFound"), true);
        return;
      }

      if (context.node.type === "group") {
        const confirmGroup = window.confirm(
          this.tf("runtime.confirmDeleteGroup", { title: context.node.title }),
        );
        if (!confirmGroup) {
          return;
        }
      } else {
        const isExternal = this.isExternalPath(context.node.path);
        const confirmFile = window.confirm(
          isExternal
            ? this.tf("runtime.confirmDeleteLink", { path: context.node.path })
            : this.tf("runtime.confirmDeletePage", { path: context.node.path }),
        );
        if (!confirmFile) {
          return;
        }
        if (!isExternal) {
          try {
            await this.api("/api/page/delete", {
              method: "POST",
              body: JSON.stringify({ path: context.node.path }),
            });
          } catch (error) {
            this.showToast(this.tf("runtime.deleteFileFailed", { message: error.message }), true);
          }
        }
      }

      context.nodes.splice(context.index, 1);
      this.navDirty = true;

      const fallback = this.findFirstAnyLink(this.nav);
      if (fallback) {
        await this.selectNode(fallback);
      } else {
        this.selectedNodeId = null;
        this.selectedPath = null;
        this.loadingPage = true;
        try {
          await this.setEditorMarkdownSafe("");
          this.lastSavedMarkdown = "";
          this.pageDirty = false;
        } finally {
          this.loadingPage = false;
        }
      }

      this.showToast(this.t("runtime.itemRemoved"));
    },
    findFirstAnyLink(nodes) {
      for (const node of nodes) {
        if (node.type === "link") {
          return node;
        }
        if (node.type === "group") {
          const found = this.findFirstAnyLink(node.children);
          if (found) {
            return found;
          }
        }
      }
      return null;
    },
    triggerUpload() {
      if (!this.selectedPath) {
        this.showToast(this.t("runtime.selectPageForUpload"), true);
        return;
      }
      this.$refs.uploadInput.click();
    },
    getPageDirectory(pagePath) {
      if (!pagePath || !pagePath.includes("/")) {
        return [];
      }
      const parts = pagePath.split("/");
      parts.pop();
      return parts;
    },
    toRelativePath(fromPagePath, toPath) {
      const fromParts = this.getPageDirectory(fromPagePath);
      const toParts = toPath.split("/");
      while (fromParts.length && toParts.length && fromParts[0] === toParts[0]) {
        fromParts.shift();
        toParts.shift();
      }
      const up = new Array(fromParts.length).fill("..");
      const relative = [...up, ...toParts].join("/");
      return relative || "./";
    },
    markdownForUpload(uploadedPath, filename, kind, embedImage = true) {
      const relativePath = this.toRelativePath(this.selectedPath || "", uploadedPath);
      if (kind === "image" && embedImage) {
        const altText = filename.replace(/\.[^/.]+$/, "");
        return `![${altText}](${relativePath})`;
      }
      return `[${filename}](${relativePath})`;
    },
    async onUploadChange(event) {
      const file = event.target.files ? event.target.files[0] : null;
      event.target.value = "";
      if (!file) {
        return;
      }

      if (!this.selectedInternalPageNode || !this.selectedPath) {
        this.showToast(this.t("runtime.selectInternalPageForUpload"), true);
        return;
      }

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("page_path", this.selectedPath || "");
        const result = await this.apiForm("/api/upload", formData);

        let embedImage = true;
        if (result.kind === "image") {
          embedImage = window.confirm(this.t("runtime.confirmEmbedImage"));
        }
        const snippet = this.markdownForUpload(result.path, result.name, result.kind, embedImage);
        const current = this.editor.getMarkdown() || "";
        const separator = current.endsWith("\n") || current.length === 0 ? "" : "\n";
        await this.setEditorMarkdownSafe(`${current}${separator}${snippet}\n`);
        this.pageDirty = true;
        this.showToast(this.t("runtime.uploadSuccess"));
      } catch (error) {
        this.showToast(this.tf("runtime.uploadFailed", { message: error.message }), true);
      }
    },
    beforeUnloadHandler(event) {
      if (!this.pageDirty && !this.navDirty) {
        return;
      }
      event.preventDefault();
      event.returnValue = "";
    },
    async shortcutHandler(event) {
      if (event.key === "Escape" && this.pageModal.open) {
        event.preventDefault();
        this.closePageModal();
        return;
      }
      if (event.key === "Escape" && this.linkModal.open) {
        event.preventDefault();
        this.closeLinkModal();
        return;
      }
      if (event.key === "Escape" && this.groupModal.open) {
        event.preventDefault();
        this.closeGroupModal();
        return;
      }
      if (event.key === "Escape" && this.settingsModal.open) {
        event.preventDefault();
        this.closeSettingsModal();
        return;
      }

      const isSaveShortcut =
        (event.ctrlKey || event.metaKey) &&
        (event.key.toLowerCase() === "s" || event.code === "KeyS");
      if (!isSaveShortcut) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === "function") {
        event.stopImmediatePropagation();
      }

      let didSaveAnything = false;
      if (this.pageDirty) {
        didSaveAnything = (await this.saveCurrentPage()) || didSaveAnything;
      }
      if (this.navDirty) {
        didSaveAnything = (await this.saveNavigation()) || didSaveAnything;
      }
      if (!didSaveAnything) {
        this.showToast(this.t("runtime.nothingToSave"));
      }
    },
    async bootstrap() {
      try {
        await this.loadSettings();
        await this.loadNav();
        if (this.selectedPath) {
          await this.loadPage(this.selectedPath);
        }
        this.reloadPreview();
      } catch (error) {
        this.showToast(`Startfehler: ${error.message}`, true);
      }
    },
  },
}).mount("#app");
