(() => {
  "use strict";

  const CHAPTERS = Object.freeze([
    Object.freeze({
      id: "CH01", path: "docs/台本/第一章_台本.csv",
      label: "第一章「失われた居場所」", endSeries: "第一章",
      endTitle: "第一章終了", nextLabel: "第二章へ続く"
    }),
    Object.freeze({
      id: "CH02", path: "docs/台本/第二章_台本.csv",
      label: "第二章「来なくなった人」", endSeries: "第二章",
      endTitle: "第二章　来なくなった人　終了", nextLabel: "第三章へ続く"
    }),
    Object.freeze({
      id: "CH03", path: "docs/台本/第三章_台本.csv",
      label: "第三章「書かれた未来」", endSeries: "第三章",
      endTitle: "第三章終了", nextLabel: "物語はここで終わります"
    })
  ]);
  const HEADERS = [
    "chapter_id", "scene_id", "subsection", "sequence", "record_type",
    "speaker", "delivery_mode", "text", "background", "environment",
    "bgm", "sfx", "time_cue", "direction"
  ];
  const ENABLE_DEV_TOOLS = true;
  const isLocalHost = location.hostname === "localhost" || location.hostname === "127.0.0.1";
  const isDevMode = ENABLE_DEV_TOOLS && isLocalHost && new URLSearchParams(location.search).get("dev") === "1";
  const DEV_MANUAL_KEY = "cursedDiaryDevCheckpointV1";
  const DEV_LAST_KEY = "cursedDiaryDevLastPositionV1";
  const PLAYER_PROGRESS_KEY = "cursedDiaryPlayerProgressV1";
  const PLAYER_PROGRESS_SCHEMA_VERSION = 1;
  const AUDIO_SETTINGS_KEY = "cursedDiaryAudioSettingsV1";
  const AUDIO_SETTINGS_SCHEMA_VERSION = 1;
  const TEXT_SETTINGS_KEY = "cursedDiaryTextSettingsV1";
  const TEXT_SETTINGS_SCHEMA_VERSION = 1;
  const AUTO_ADVANCE_MODES = Object.freeze({
    off: Object.freeze({ label: "OFF", baseDelay: 0 }),
    slow: Object.freeze({ label: "ゆっくり", baseDelay: 5000 }),
    normal: Object.freeze({ label: "標準", baseDelay: 3500 }),
    fast: Object.freeze({ label: "速い", baseDelay: 2000 })
  });
  const AUTO_ADVANCE_TEXT_TYPES = new Set(["dialogue", "narration", "time_cue"]);
  const AUTO_ADVANCE_CONTROL_TYPES = new Set(["background", "environment", "bgm", "sfx"]);
  const PERSISTENT_SFX_IDS = new Set(["SFX_EARTHQUAKE_SHAKE", "SFX_CH1_SC02_EARTHQUAKE_ROOM_SHAKE"]);
  const GAME_VERSION = "1.0.0";
  const UPDATE_HISTORY = Object.freeze([
    Object.freeze({
      version: GAME_VERSION,
      date: "2026-08-12",
      changes: Object.freeze([
        "正式版を公開",
        "第一章～第三章および全エンディングを完成",
        "テキスト自動送り機能を追加",
        "高速入力時のテキスト進行を安定化",
        "効果音の残留を改善",
        "BGM／環境音の重複を修整",
        "BAD END Bの一部文章を調整",
        "最終テストプレイおよび各種不具合修整を完了"
      ])
    }),
    Object.freeze({
      version: "0.9.0",
      date: "2026-08-12",
      changes: Object.freeze([
        "第一章～第三章を実装",
        "TRUE END／BAD END A／BAD END Bを実装",
        "人物図鑑を追加",
        "ゲーム進行に応じた人物情報の解放機能を追加",
        "タイトル専用背景・BGMを追加",
        "BGM／環境音／効果音の音量設定を追加",
        "各音量の個別ミュート機能を追加",
        "TRUE ENDのエンドクレジット演出を改善",
        "台詞・時間表示などの文章を調整",
        "第三章BAD ENDルートを中心にBGM／環境音の重複を修整"
      ])
    })
  ]);
  const DEFAULT_AUDIO_SETTINGS = Object.freeze({
    schemaVersion: AUDIO_SETTINGS_SCHEMA_VERSION,
    bgmVolume: 100,
    environmentVolume: 100,
    sfxVolume: 100,
    bgmMuted: false,
    environmentMuted: false,
    sfxMuted: false
  });
  const MENU_BACKGROUND_ID = "BG_TITLE_DIARY_ROOM";
  const MENU_BGM_ID = "BGM_TITLE_SILENT_ROOM_DIARY";
  const MENU_BGM_VOLUME = .12;
  const MENU_BGM_FADE_MS = 1200;
  const ENDING_TIMINGS = Object.freeze({
    titleHold: 2800, trueCredits: 40000,
    creditFade: 900, creditHold: 5200, creditFinalHold: 6200, creditGap: 1000,
    lastPageFadeIn: 1200, badAHold: 4200, badBHold: 5600, fadeOut: 900
  });

  const ASSETS = Object.freeze({
    BG_TITLE_DIARY_ROOM: "assets/images/backgrounds/a_dark_moody_dimly_lit_interior_scene_in_a_cinem_1.png",
    BG_SC01_TAKESHI_APARTMENT_DAY: "assets/images/backgrounds/BG_SC01_TAKESHI_APARTMENT_DAY.png",
    BG_SC01_TAKESHI_APARTMENT_NIGHT: "assets/images/backgrounds/BG_SC01_TAKESHI_APARTMENT_NIGHT.png",
    BG_SC01_UNIVERSITY_LECTURE_ROOM_DAY: "assets/images/backgrounds/BG_SC01_UNIVERSITY_LECTURE_ROOM_DAY.png",
    BG_SC02_APARTMENT_STREET_DAY: "assets/images/backgrounds/BG_SC02_APARTMENT_STREET_DAY.png",
    BG_SC02_SUPPORT_CENTER_EXTERIOR_DAY: "assets/images/backgrounds/BG_SC02_SUPPORT_CENTER_EXTERIOR_DAY.png",
    BG_SC03_SUPPORT_CENTER_WORKROOM_DAY: "assets/images/backgrounds/BG_SC03_SUPPORT_CENTER_WORKROOM_DAY.png",
    BG_SC04_QUIET_MEETING_ROOM_DAY: "assets/images/backgrounds/BG_SC04_QUIET_MEETING_ROOM_DAY.png",
    BG_SC04_STATION_FRONT_EVENING: "assets/images/backgrounds/BG_SC04_STATION_FRONT_EVENING.png",
    BG_CH2_SUPERMARKET_BACKROOM_EVENING: "assets/images/backgrounds/bg_ch2_supermarket_backroom_evening.png",
    BG_CH2_SUPERMARKET_SALES_FLOOR_EVENING: "assets/images/backgrounds/bg_ch2_supermarket_sales_floor_evening.png",
    BG_CH2_ANTIQUE_SHOP_EXTERIOR_EVENING: "assets/images/backgrounds/bg_ch2_antique_shop_exterior_evening.png",
    BG_CH2_ANTIQUE_SHOP_INTERIOR_EVENING: "assets/images/backgrounds/bg_ch2_antique_shop_interior_evening.png",
    BG_CH3_KANAKO_APARTMENT_DESK_NIGHT: "assets/images/backgrounds/BG_CH3_KANAKO_APARTMENT_DESK_NIGHT.png",
    BGM_SC01_QUIET_DAILY_LIFE: "assets/audio/bgm/BGM_SC01_QUIET_DAILY_LIFE.mp3",
    BGM_SC02_AFTER_DISASTER_SILENCE: "assets/audio/bgm/BGM_SC02_AFTER_DISASTER_SILENCE.mp3",
    BGM_SC03_SMALL_HOPE: "assets/audio/bgm/BGM_SC03_SMALL_HOPE.mp3",
    BGM_CH3_TRUE_END_LAST_PAGE: "assets/audio/bgm/Last Page.mp3",
    BGM_TITLE_SILENT_ROOM_DIARY: "assets/audio/bgm/Silent Room Diary (Take 1).mp3",
    BGM_SC04D_ANXIETY_AND_DECISION: "assets/audio/bgm/BGM_SC04D_ANXIETY_AND_DECISION.mp3",
    BGM_SC04_AUDIO_DISTURBANCE: "assets/audio/bgm/BGM_SC04_AUDIO_DISTURBANCE.mp3",
    ENV_CLOCK_TICKING: "assets/audio/environment/ENV_CLOCK_TICKING.mp3",
    ENV_QUIET_ROOM: "assets/audio/environment/ENV_QUIET_ROOM.mp3",
    ENV_STATION_EVENING: "assets/audio/environment/ENV_STATION_EVENING.mp3",
    ENV_UNIVERSITY_CLASSROOM: "assets/audio/environment/ENV_UNIVERSITY_CLASSROOM.mp3",
    AMB_CH2_SUPERMARKET_BACKROOM: "assets/audio/environment/amb_ch2_supermarket_backroom.mp3",
    AMB_CH2_SUPERMARKET_SALES_FLOOR: "assets/audio/environment/amb_ch2_supermarket_sales_floor.mp3",
    SFX_DISH_CLATTER: "assets/audio/sfx/SFX_DISH_CLATTER.mp3",
    SFX_DOOR_CLOSE: "assets/audio/sfx/SFX_DOOR_CLOSE.mp3",
    SFX_DOOR_OPEN: "assets/audio/sfx/SFX_DOOR_OPEN.mp3",
    SFX_CH1_SC02_EARTHQUAKE_ROOM_SHAKE: "assets/audio/sfx/sfx_earthquake_room_shake_01.mp3",
    SFX_EARTHQUAKE_SHAKE: "assets/audio/sfx/SFX_EARTHQUAKE_SHAKE.mp3",
    SFX_EMERGENCY_BRAKE: "assets/audio/sfx/SFX_EMERGENCY_BRAKE.mp3",
    SFX_FOOTSTEPS: "assets/audio/sfx/SFX_FOOTSTEPS.mp3",
    SFX_SLIPPER_RUNNING: "assets/audio/sfx/SFX_SLIPPER_RUNNING.mp3",
    SFX_SMARTPHONE_VIBRATION: "assets/audio/sfx/SFX_SMARTPHONE_VIBRATION.mp3",
    SFX_CH2_CART_ROLL: "assets/audio/sfx/sfx_cart_roll_short_01.mp3",
    SFX_CH2_HEAVY_BOX_DRAG: "assets/audio/sfx/sfx_heavy_box_drag_01.mp3",
    SFX_CAR_HORN: "assets/audio/sfx/車のクラクション.mp3"
  });

  const DELIVERY_LABELS = Object.freeze({ sign: "手話", written: "筆談", message: "メッセージ" });
  const PLAYER_PROGRESS_ALLOWED = Object.freeze({
    encounteredCharacters: new Set(["takeshi", "kanako", "itagaki", "antique_shop_owner"]),
    clearedChapters: new Set(["CH01", "CH02"]),
    reachedEndings: new Set(["TRUE", "BAD_A", "BAD_B"])
  });
  const CHARACTER_UNLOCKS = Object.freeze({
    "CH01|Scene01|9": "takeshi",
    "CH01|Scene03|50": "kanako",
    "CH01|Scene04|128": "itagaki",
    "CH02|Scene07|13": "antique_shop_owner"
  });
  const CHARACTERS = Object.freeze([
    {
      id: "takeshi",
      name: "たけし",
      summary: "大学とアルバイトへ通っている。",
      chapters: [
        { label: "第一章", condition: "basic" },
        { label: "第二章", condition: "CH01" },
        { label: "第三章", condition: "ANY_END" }
      ],
      profiles: [
        { title: "基本プロフィール", condition: "basic", text: "大学とアルバイトへ通っている。周囲とは必要以上に関わらず、決めた予定を崩さないことで日々を保っている。" },
        { title: "第一章クリア後", condition: "CH01", text: "地震の後、以前より音を強く感じるようになる。被災者支援所の作業に加わり、かなこと出会った。声だけでは届かない相手と話すため、手話を学び始める。" },
        { title: "第二章クリア後", condition: "CH02", text: "音を避ける工夫を重ねるうち、大学やアルバイト、支援所から少しずつ離れていく。予定を守ろうとするほど、外へ出るための道を狭めていった。" },
        { title: "第三章共通", condition: "ANY_END", text: "かなこから届いた連絡に、今はまだ行けないことを自分の言葉で返した。会える時期は決められなくても、関係を断つとは答えていない。" }
      ],
      records: [
        { ending: "TRUE", label: "TRUE END", title: "この世界を歩く", text: "音への苦しさが消えたわけではない。それでも、会う場所や時間、途中で退出できる条件を自分で選び、その場に残ることを決めた。" },
        { ending: "BAD_A", label: "BAD END A", title: "叶った願い", text: "音に苦しまないたけしへ変わった代わりに、かなこと出会い、手話を覚えた理由まで失われた。本人は、失われた過去を知らない。" },
        { ending: "BAD_B", label: "BAD END B", title: "理想のたけし", text: "かなこと出会った経緯は消え、彼女のいない現在を生きている。空いた椅子へ目を向けても、その理由を思い出すことはない。" }
      ]
    },
    {
      id: "kanako",
      name: "かなこ",
      summary: "被災者支援所の作業に関わっている。",
      chapters: [
        { label: "第一章", condition: "basic" },
        { label: "第二章", condition: "CH01" },
        { label: "第三章", condition: "ANY_END" }
      ],
      profiles: [
        { title: "基本プロフィール", condition: "basic", text: "被災者支援所の作業に関わっている。松葉杖を使い、文字や手、表情を通して周囲と意思を交わす。" },
        { title: "第一章クリア後", condition: "CH01", text: "支援所へ来たたけしと出会う。たけしの変化に気づいても無理に聞き出さず、次に戻れる場所があることを伝えた。" },
        { title: "第二章クリア後", condition: "CH02", text: "人の少ない時間や作業を選ぶようになった、たけしの変化に気づく。姿を見せなくなった後は、返事を求めない一度だけの連絡を送り、言葉を届けるための帳面を探した。" },
        { title: "第三章共通", condition: "ANY_END", text: "たけしの代わりに答えを決めず、本人が選べる会い方を板垣先生と考える。その一方で、机に置いた日記へ言葉を書くか迷っている。" }
      ],
      records: [
        { ending: "TRUE", label: "TRUE END", title: "この世界を歩く", text: "日記には何も書かず、提示した条件を変えずに待った。たけしが自分で選んだ時間を、そのまま一緒に過ごす。" },
        { ending: "BAD_A", label: "BAD END A", title: "叶った願い", text: "音に苦しまない明日を願って書いた言葉が、たけしの過去と二人の関係まで変えた。これ以上は書かず日記を返したが、元のたけしを覚えているのは彼女だけになった。" },
        { ending: "BAD_B", label: "BAD END B", title: "理想のたけし", text: "元へ戻したいという思いから、日記へ言葉を重ねた。やがて二人が出会うより前まで書き換えようとし、彼女の名前と存在は現在から失われた。" }
      ]
    },
    {
      id: "itagaki",
      name: "板垣先生",
      summary: "支援所で相談に応じる人物。",
      chapters: [
        { label: "第一章", condition: "basic" },
        { label: "第二章", condition: "CH01" },
        { label: "第三章", condition: "ANY_END" }
      ],
      profiles: [
        { title: "基本プロフィール", condition: "basic", text: "支援所で相談に応じる人物。たけしに静かな部屋と短い時間を提案し、話すかどうかを本人へ委ねる。" },
        { title: "第一章クリア後", condition: "CH01", text: "音への苦しさを言葉にできないたけしを急かさず、戻れる場所があることを伝えた。" },
        { title: "第二章クリア後", condition: "CH02", text: "かなこから、たけしが来る時間や選ぶ作業の変化を聞く。結論を急がず、観察できた事実を確かめていく。" },
        { title: "第三章共通", condition: "ANY_END", text: "かなこと共に、たけしが場所や時間、退出の条件を選べる面談方法を整える。" }
      ],
      records: []
    },
    {
      id: "antique_shop_owner",
      name: "骨董品店の店主",
      summary: "街外れの骨董品店で古い品を扱う店主。",
      chapters: [
        { label: "第二章", condition: "basic" },
        { label: "第三章", condition: "BAD_A" }
      ],
      profiles: [
        { title: "基本プロフィール", condition: "basic", text: "街外れの骨董品店で古い品を扱う店主。新しいノートを探していたかなこへ、奥にある古い帳面を案内する。" },
        { title: "第二章クリア後", condition: "CH02", text: "題名も使用者名もない日記を、ほかの帳面と同じ品物としてかなこへ売った。日記を特別なものとして扱う様子はない。" }
      ],
      records: [
        { ending: "BAD_A", label: "BAD END A", title: "叶った願い", text: "返された日記を、再び帳面の箱へ戻した。以前の持ち主については、仕入れたときから名前がなく、それ以上は分からないと答えている。" }
      ]
    }
  ]);
  const AUDIO_CONTROL = /^(停止|途切れる|ざわめきが続く|継続|続く)$/;
  const DEFAULT_SFX_VOLUME = .26;
  const SFX_VOLUME_OVERRIDES = Object.freeze({
    SFX_CH1_SC02_EARTHQUAKE_ROOM_SHAKE: .48,
    SFX_EARTHQUAKE_SHAKE: .48,
    SFX_EMERGENCY_BRAKE: .44,
    SFX_CAR_HORN: .40,
    SFX_DISH_CLATTER: .34,
    SFX_SMARTPHONE_VIBRATION: .32,
    SFX_DOOR_OPEN: .28,
    SFX_DOOR_CLOSE: .28,
    SFX_SLIPPER_RUNNING: .26,
    SFX_FOOTSTEPS: .24,
    SFX_CH2_CART_ROLL: .26,
    SFX_CH2_HEAVY_BOX_DRAG: .28,
    ENV_CLOCK_TICKING: .20
  });

  const elements = {
    game: document.querySelector("#game"), background: document.querySelector("#background"),
    effect: document.querySelector("#effectLayer"), chapter: document.querySelector("#chapterLabel"),
    progress: document.querySelector("#progressLabel"), titleCard: document.querySelector("#titleCard"),
    titleText: document.querySelector("#titleText"), loadStatus: document.querySelector("#loadStatus"),
    start: document.querySelector("#startButton"), charactersButton: document.querySelector("#charactersButton"),
    settingsButton: document.querySelector("#settingsButton"), settingsCard: document.querySelector("#settingsCard"),
    updateHistoryButton: document.querySelector("#updateHistoryButton"), versionLabel: document.querySelector("#versionLabel"),
    updateHistoryCard: document.querySelector("#updateHistoryCard"), updateHistoryList: document.querySelector("#updateHistoryList"),
    updateHistoryBackButton: document.querySelector("#updateHistoryBackButton"),
    bgmVolumeInput: document.querySelector("#bgmVolumeInput"), bgmVolumeValue: document.querySelector("#bgmVolumeValue"),
    bgmMuteButton: document.querySelector("#bgmMuteButton"),
    environmentVolumeInput: document.querySelector("#environmentVolumeInput"), environmentVolumeValue: document.querySelector("#environmentVolumeValue"),
    environmentMuteButton: document.querySelector("#environmentMuteButton"),
    sfxVolumeInput: document.querySelector("#sfxVolumeInput"), sfxVolumeValue: document.querySelector("#sfxVolumeValue"),
    sfxMuteButton: document.querySelector("#sfxMuteButton"),
    autoAdvanceButtons: [...document.querySelectorAll("[data-auto-advance-mode]")],
    resetAudioSettingsButton: document.querySelector("#resetAudioSettingsButton"), settingsBackButton: document.querySelector("#settingsBackButton"),
    warning: document.querySelector("#warningCard"),
    confirmStart: document.querySelector("#confirmStartButton"), closeWarning: document.querySelector("#closeWarningButton"),
    characterListCard: document.querySelector("#characterListCard"), characterListEmpty: document.querySelector("#characterListEmpty"),
    characterListGrid: document.querySelector("#characterListGrid"), characterListBackButton: document.querySelector("#characterListBackButton"),
    characterDetailCard: document.querySelector("#characterDetailCard"), characterDetailName: document.querySelector("#characterDetailName"),
    characterDetailSummary: document.querySelector("#characterDetailSummary"), characterDetailChapters: document.querySelector("#characterDetailChapters"),
    characterDetailProfiles: document.querySelector("#characterDetailProfiles"), characterDetailRecords: document.querySelector("#characterDetailRecords"),
    characterDetailBackButton: document.querySelector("#characterDetailBackButton"),
    timeCard: document.querySelector("#timeCard"),
    timeText: document.querySelector("#timeText"), message: document.querySelector("#messageWindow"),
    speaker: document.querySelector("#speakerName"), badge: document.querySelector("#deliveryBadge"),
    text: document.querySelector("#messageText"), endCard: document.querySelector("#endCard"),
    choiceCard: document.querySelector("#choiceCard"), choiceOptions: document.querySelector("#choiceOptions"),
    endSeries: document.querySelector("#endSeries"), endText: document.querySelector("#endText"),
    endNext: document.querySelector("#endNext"), endCredits: document.querySelector("#endCredits"),
    endCreditCards: [...document.querySelectorAll(".end-card__credit-card")],
    endReturnButton: document.querySelector("#endReturnButton"), errorCard: document.querySelector("#errorCard"),
    errorText: document.querySelector("#errorText"),
    devPanel: document.querySelector("#devPanel"), devPanelToggle: document.querySelector("#devPanelToggle"),
    devPanelBody: document.querySelector("#devPanelBody"), devCurrentLocation: document.querySelector("#devCurrentLocation"),
    devChapterSelect: document.querySelector("#devChapterSelect"), devSceneSelect: document.querySelector("#devSceneSelect"),
    devSequenceInput: document.querySelector("#devSequenceInput"), devChapterRecordInput: document.querySelector("#devChapterRecordInput"),
    devGlobalIndexInput: document.querySelector("#devGlobalIndexInput"), devSceneJumpButton: document.querySelector("#devSceneJumpButton"),
    devSequenceJumpButton: document.querySelector("#devSequenceJumpButton"), devChapterRecordJumpButton: document.querySelector("#devChapterRecordJumpButton"),
    devGlobalIndexJumpButton: document.querySelector("#devGlobalIndexJumpButton"), devSaveButton: document.querySelector("#devSaveButton"),
    devLoadButton: document.querySelector("#devLoadButton"), devLoadLastButton: document.querySelector("#devLoadLastButton"),
    devRestartButton: document.querySelector("#devRestartButton"), devStatus: document.querySelector("#devStatus")
  };

  const diagnostics = {
    warnings: [], errors: [], playAttempts: [], cancelledPlays: [], playFailures: [], mediaErrors: [],
    processedIndexes: [], jumpedIndexes: [], droppedAdvanceInputs: 0, autoAdvanceSchedules: 0, autoAdvanceFires: 0, maxAutoAdvanceTimers: 0
  };
  const state = {
    records: [], index: -1, started: false, ended: false, locked: false, choiceActive: false,
    lastInput: 0, chapterId: "", scene: "", subsection: "", background: "",
    currentEndLabel: "", currentEndTitle: "", selectedChoices: {}
  };
  let playerProgress = readPlayerProgress();
  let audioSettings = readAudioSettings();
  let textSettings = readTextSettings();
  let bgm = null;
  let isAdvancing = false;
  let autoAdvanceTimer = null;
  let autoAdvanceGeneration = 0;
  let menuMode = false;
  let menuBgmFadeId = 0;
  let menuBgmRetryPending = false;
  let menuBgmAttemptPending = false;
  const environment = new Map();
  const activeSfx = new Set();
  const preplayedSfxIndexes = new Set();
  let endingSequenceId = 0;
  const endingTimeouts = new Map();

  function createDefaultAudioSettings() {
    return { ...DEFAULT_AUDIO_SETTINGS };
  }

  function reportAudioSettingsWarning(message) {
    diagnostics.warnings.push(message);
    console.warn(`[audio-settings] ${message}`);
  }

  function isValidAudioSettings(value) {
    if (!value || typeof value !== "object" || value.schemaVersion !== AUDIO_SETTINGS_SCHEMA_VERSION) return false;
    const volumeKeys = ["bgmVolume", "environmentVolume", "sfxVolume"];
    const muteKeys = ["bgmMuted", "environmentMuted", "sfxMuted"];
    return volumeKeys.every((key) => Number.isInteger(value[key]) && value[key] >= 0 && value[key] <= 100)
      && muteKeys.every((key) => typeof value[key] === "boolean");
  }

  function readAudioSettings() {
    const fallback = createDefaultAudioSettings();
    try {
      const stored = localStorage.getItem(AUDIO_SETTINGS_KEY);
      if (!stored) return fallback;
      const parsed = JSON.parse(stored);
      if (!isValidAudioSettings(parsed)) {
        reportAudioSettingsWarning("保存された音量設定が不正なため、初期設定を使用します。");
        return fallback;
      }
      return {
        schemaVersion: AUDIO_SETTINGS_SCHEMA_VERSION,
        bgmVolume: parsed.bgmVolume,
        environmentVolume: parsed.environmentVolume,
        sfxVolume: parsed.sfxVolume,
        bgmMuted: parsed.bgmMuted,
        environmentMuted: parsed.environmentMuted,
        sfxMuted: parsed.sfxMuted
      };
    } catch (error) {
      reportAudioSettingsWarning(`音量設定を読み込めませんでした: ${error.message}`);
      return fallback;
    }
  }

  function writeAudioSettings() {
    try {
      localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(audioSettings));
    } catch (error) {
      reportAudioSettingsWarning(`音量設定を書き込めませんでした: ${error.message}`);
    }
  }

  function createDefaultTextSettings() {
    return { schemaVersion: TEXT_SETTINGS_SCHEMA_VERSION, autoAdvanceMode: "off" };
  }

  function reportTextSettingsWarning(message) {
    diagnostics.warnings.push(message);
    console.warn(`[text-settings] ${message}`);
  }

  function readTextSettings() {
    const fallback = createDefaultTextSettings();
    try {
      const stored = localStorage.getItem(TEXT_SETTINGS_KEY);
      if (!stored) return fallback;
      const parsed = JSON.parse(stored);
      if (!parsed || parsed.schemaVersion !== TEXT_SETTINGS_SCHEMA_VERSION || !AUTO_ADVANCE_MODES[parsed.autoAdvanceMode]) {
        reportTextSettingsWarning("保存されたテキスト設定が不正なため、自動送りをOFFにします。");
        return fallback;
      }
      return { schemaVersion: TEXT_SETTINGS_SCHEMA_VERSION, autoAdvanceMode: parsed.autoAdvanceMode };
    } catch (error) {
      reportTextSettingsWarning(`テキスト設定を読み込めませんでした: ${error.message}`);
      return fallback;
    }
  }

  function writeTextSettings() {
    try {
      localStorage.setItem(TEXT_SETTINGS_KEY, JSON.stringify(textSettings));
    } catch (error) {
      reportTextSettingsWarning(`テキスト設定を書き込めませんでした: ${error.message}`);
    }
  }

  function createEmptyPlayerProgress() {
    return {
      schemaVersion: PLAYER_PROGRESS_SCHEMA_VERSION,
      encounteredCharacters: [],
      clearedChapters: [],
      reachedEndings: []
    };
  }

  function reportPlayerProgressWarning(message) {
    diagnostics.warnings.push(message);
    console.warn(`[player-progress] ${message}`);
  }

  function readPlayerProgress() {
    const empty = createEmptyPlayerProgress();
    try {
      const stored = localStorage.getItem(PLAYER_PROGRESS_KEY);
      if (!stored) return empty;
      const parsed = JSON.parse(stored);
      const validShape = parsed && typeof parsed === "object" && parsed.schemaVersion === PLAYER_PROGRESS_SCHEMA_VERSION
        && Array.isArray(parsed.encounteredCharacters) && Array.isArray(parsed.clearedChapters) && Array.isArray(parsed.reachedEndings);
      if (!validShape) {
        reportPlayerProgressWarning("保存データ形式が不正なため、空の進行状態として扱います。");
        return empty;
      }
      const sanitize = (field) => [...new Set(parsed[field].filter((value) =>
        typeof value === "string" && PLAYER_PROGRESS_ALLOWED[field].has(value)
      ))];
      return {
        schemaVersion: PLAYER_PROGRESS_SCHEMA_VERSION,
        encounteredCharacters: sanitize("encounteredCharacters"),
        clearedChapters: sanitize("clearedChapters"),
        reachedEndings: sanitize("reachedEndings")
      };
    } catch (error) {
      reportPlayerProgressWarning(`保存データを読み込めませんでした: ${error.message}`);
      return empty;
    }
  }

  function addPlayerProgress(field, value) {
    if (isDevMode || !PLAYER_PROGRESS_ALLOWED[field]?.has(value) || playerProgress[field].includes(value)) return false;
    playerProgress = {
      ...playerProgress,
      [field]: [...playerProgress[field], value]
    };
    try {
      localStorage.setItem(PLAYER_PROGRESS_KEY, JSON.stringify(playerProgress));
    } catch (error) {
      reportPlayerProgressWarning(`保存データを書き込めませんでした: ${error.message}`);
    }
    return true;
  }

  function getPlayerProgressSnapshot() {
    return JSON.parse(JSON.stringify(playerProgress));
  }

  function hasReachedAnyEnding() {
    return playerProgress.reachedEndings.some((ending) => PLAYER_PROGRESS_ALLOWED.reachedEndings.has(ending));
  }

  function isCharacterConditionUnlocked(condition) {
    if (condition === "basic") return true;
    if (condition === "ANY_END") return hasReachedAnyEnding();
    if (PLAYER_PROGRESS_ALLOWED.clearedChapters.has(condition)) return playerProgress.clearedChapters.includes(condition);
    if (PLAYER_PROGRESS_ALLOWED.reachedEndings.has(condition)) return playerProgress.reachedEndings.includes(condition);
    return false;
  }

  function getUnlockedCharacters() {
    return CHARACTERS.filter((character) => playerProgress.encounteredCharacters.includes(character.id));
  }

  function getCharacterViewModel(characterId) {
    const character = CHARACTERS.find((item) => item.id === characterId);
    if (!character || !playerProgress.encounteredCharacters.includes(character.id)) return null;
    return {
      id: character.id,
      name: character.name,
      summary: character.summary,
      chapters: character.chapters.filter((chapter) => isCharacterConditionUnlocked(chapter.condition)).map((chapter) => chapter.label),
      profiles: character.profiles.filter((profile) => isCharacterConditionUnlocked(profile.condition)).map((profile) => ({ ...profile })),
      records: character.records.filter((record) => playerProgress.reachedEndings.includes(record.ending)).map((record) => ({ ...record }))
    };
  }

  function createCharacterTextSection(title, text, headingLevel = 3) {
    const section = document.createElement("section");
    section.className = "character-detail-card__section";
    const heading = document.createElement(`h${headingLevel}`);
    heading.textContent = title;
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    section.append(heading, paragraph);
    return section;
  }

  function renderCharacterList() {
    const characters = getUnlockedCharacters();
    elements.characterListGrid.replaceChildren();
    elements.characterListEmpty.hidden = characters.length > 0;
    elements.characterListGrid.hidden = characters.length === 0;
    characters.forEach((character) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "character-list-card__item";
      button.dataset.characterId = character.id;
      const name = document.createElement("span");
      name.className = "character-list-card__name";
      name.textContent = character.name;
      const summary = document.createElement("span");
      summary.className = "character-list-card__summary";
      summary.textContent = character.summary;
      button.append(name, summary);
      button.addEventListener("pointerup", (event) => event.stopPropagation());
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        showCharacterDetail(character.id);
      });
      elements.characterListGrid.append(button);
    });
  }

  function showCharacterList(focusCharacterId = "") {
    cancelAutoAdvance();
    showMenuAtmosphere();
    renderCharacterList();
    elements.chapter.textContent = "登場人物";
    elements.progress.textContent = "人物図鑑";
    elements.titleCard.inert = true;
    setVisible(elements.characterListCard);
    if (focusCharacterId) {
      elements.characterListGrid.querySelector(`[data-character-id="${focusCharacterId}"]`)?.focus();
    } else {
      elements.characterListCard.focus();
    }
  }

  function showCharacterDetail(characterId) {
    showMenuAtmosphere();
    const character = getCharacterViewModel(characterId);
    if (!character) {
      showCharacterList();
      return;
    }
    elements.characterDetailName.textContent = character.name;
    elements.characterDetailSummary.textContent = character.summary;
    elements.characterDetailChapters.replaceChildren(...character.chapters.map((label) => {
      const item = document.createElement("span");
      item.className = "character-detail-card__chapter";
      item.textContent = label;
      return item;
    }));
    elements.characterDetailProfiles.replaceChildren(...character.profiles.map((profile) =>
      createCharacterTextSection(profile.title, profile.text)
    ));
    elements.characterDetailRecords.replaceChildren();
    if (character.records.length) {
      const title = document.createElement("h3");
      title.className = "character-detail-card__records-title";
      title.textContent = "記録";
      elements.characterDetailRecords.append(title, ...character.records.map((record) =>
        createCharacterTextSection(`${record.label}「${record.title}」`, record.text, 4)
      ));
    }
    elements.characterDetailCard.dataset.characterId = character.id;
    setVisible(elements.characterDetailCard);
    elements.characterDetailCard.scrollTop = 0;
    elements.characterDetailCard.focus();
  }

  const AUDIO_SETTING_CONTROLS = Object.freeze({
    bgm: Object.freeze({ input: elements.bgmVolumeInput, output: elements.bgmVolumeValue, mute: elements.bgmMuteButton }),
    environment: Object.freeze({ input: elements.environmentVolumeInput, output: elements.environmentVolumeValue, mute: elements.environmentMuteButton }),
    sfx: Object.freeze({ input: elements.sfxVolumeInput, output: elements.sfxVolumeValue, mute: elements.sfxMuteButton })
  });

  function renderAudioSettings() {
    Object.entries(AUDIO_SETTING_CONTROLS).forEach(([category, control]) => {
      const volume = audioSettings[`${category}Volume`];
      const muted = audioSettings[`${category}Muted`];
      control.input.value = String(volume);
      control.output.value = String(volume);
      control.output.textContent = String(volume);
      control.mute.setAttribute("aria-pressed", String(muted));
      control.mute.classList.toggle("is-muted", muted);
      control.mute.textContent = muted ? "ミュート解除" : "ミュート";
    });
  }

  function updateAudioSetting(category, change) {
    audioSettings = { ...audioSettings, ...change };
    writeAudioSettings();
    applyAudioSettingsToActiveAudio();
    renderAudioSettings();
  }

  function updateAudioVolume(category, value) {
    const volume = Number(value);
    if (!Number.isInteger(volume) || volume < 0 || volume > 100) return;
    updateAudioSetting(category, { [`${category}Volume`]: volume });
  }

  function toggleAudioMute(category) {
    updateAudioSetting(category, { [`${category}Muted`]: !audioSettings[`${category}Muted`] });
  }

  function resetAudioSettings() {
    audioSettings = createDefaultAudioSettings();
    writeAudioSettings();
    applyAudioSettingsToActiveAudio();
    renderAudioSettings();
  }

  function showSettings() {
    cancelAutoAdvance();
    showMenuAtmosphere();
    renderAudioSettings();
    renderTextSettings();
    elements.chapter.textContent = "設定";
    elements.progress.textContent = "音量設定";
    elements.titleCard.inert = true;
    setVisible(elements.settingsCard);
    elements.settingsCard.scrollTop = 0;
    elements.settingsCard.focus();
  }

  function renderTextSettings() {
    elements.autoAdvanceButtons.forEach((button) => {
      const selected = button.dataset.autoAdvanceMode === textSettings.autoAdvanceMode;
      button.setAttribute("aria-pressed", String(selected));
      button.classList.toggle("is-selected", selected);
    });
  }

  function setAutoAdvanceMode(mode) {
    const safeMode = AUTO_ADVANCE_MODES[mode] ? mode : "off";
    textSettings = { schemaVersion: TEXT_SETTINGS_SCHEMA_VERSION, autoAdvanceMode: safeMode };
    writeTextSettings();
    renderTextSettings();
    cancelAutoAdvance();
    scheduleAutoAdvance();
  }

  function renderUpdateHistory() {
    elements.versionLabel.textContent = `Ver ${GAME_VERSION}`;
    elements.updateHistoryList.replaceChildren(...UPDATE_HISTORY.map((entry) => {
      const article = document.createElement("article");
      article.className = "update-history-card__entry";
      const heading = document.createElement("h3");
      heading.textContent = `Ver ${entry.version}`;
      const date = document.createElement("time");
      date.dateTime = entry.date;
      date.textContent = entry.date;
      const changes = document.createElement("ul");
      changes.replaceChildren(...entry.changes.map((change) => {
        const item = document.createElement("li");
        item.textContent = change;
        return item;
      }));
      article.append(heading, date, changes);
      return article;
    }));
  }

  function showUpdateHistory() {
    cancelAutoAdvance();
    showMenuAtmosphere();
    renderUpdateHistory();
    elements.chapter.textContent = "アップデート履歴";
    elements.progress.textContent = `Ver ${GAME_VERSION}`;
    elements.titleCard.inert = true;
    setVisible(elements.updateHistoryCard);
    elements.updateHistoryCard.scrollTop = 0;
    elements.updateHistoryCard.focus();
  }

  function recordCharacterEncounter(record) {
    const key = `${record.chapter_id}|${record.scene_id}|${record.sequence}`;
    const characterId = CHARACTER_UNLOCKS[key];
    if (characterId) addPlayerProgress("encounteredCharacters", characterId);
  }

  function getEndingId(record) {
    const value = record?.direction || "";
    if (value.includes("TRUE END")) return "TRUE";
    if (value.includes("BAD END A")) return "BAD_A";
    if (value.includes("BAD END B")) return "BAD_B";
    return "";
  }

  function parseCsv(source) {
    const rows = [];
    let row = [], field = "", quoted = false;
    for (let i = 0; i < source.length; i += 1) {
      const char = source[i];
      if (quoted) {
        if (char === '"' && source[i + 1] === '"') { field += '"'; i += 1; }
        else if (char === '"') quoted = false;
        else field += char;
      } else if (char === '"') quoted = true;
      else if (char === ",") { row.push(field); field = ""; }
      else if (char === "\n") {
        if (field.endsWith("\r")) field = field.slice(0, -1);
        row.push(field); rows.push(row); row = []; field = "";
      } else field += char;
    }
    if (quoted) throw new Error("CSVの引用符が閉じられていません。");
    if (field !== "" || row.length) { row.push(field); rows.push(row); }
    while (rows.length && rows.at(-1).every((value) => value === "")) rows.pop();
    if (!rows.length || rows[0].join("\u001f") !== HEADERS.join("\u001f")) throw new Error("CSVヘッダーが仕様と一致しません。");
    return rows.slice(1).map((values, index) => {
      if (values.length !== HEADERS.length) throw new Error(`CSV ${index + 2}行目の列数が${values.length}です。`);
      return Object.fromEntries(HEADERS.map((header, column) => [header, values[column]]));
    });
  }

  function splitAssetIds(value) {
    return [...new Set(value.split("+").map((id) => id.trim()).filter(Boolean))];
  }

  function isAssetId(value) {
    return /^(BG_|BGM_|ENV_|AMB_|SFX_)[A-Z0-9_]+$/.test(value);
  }

  function resolveAsset(id) {
    if (!isAssetId(id) || !ASSETS[id]) {
      diagnostics.errors.push(`未登録素材ID: ${id}`);
      console.error(`[asset] 未登録素材ID: ${id}`);
      return null;
    }
    return ASSETS[id];
  }

  function getVolumeMultiplier(value) {
    if (value <= 0) return 0;
    return Math.sqrt(value / 100);
  }

  function getAudioCategory(id) {
    if (id.startsWith("BGM_")) return "bgm";
    if (id.startsWith("ENV_") || id.startsWith("AMB_")) return "environment";
    if (id.startsWith("SFX_")) return "sfx";
    return "";
  }

  function getAudioUserMultiplier(id) {
    const category = getAudioCategory(id);
    if (!category || audioSettings[`${category}Muted`]) return 0;
    return getVolumeMultiplier(audioSettings[`${category}Volume`]);
  }

  function getAudioVolumeScale(audio) {
    const value = Number(audio?.dataset.volumeScale ?? 1);
    return Number.isFinite(value) ? Math.max(0, value) : 1;
  }

  function applyAudioVolume(audio) {
    if (!audio) return;
    const baseVolume = Number(audio.dataset.baseVolume ?? 0);
    const finalVolume = baseVolume * getAudioVolumeScale(audio) * getAudioUserMultiplier(audio.dataset.assetId || "");
    audio.volume = Math.min(1, Math.max(0, Number.isFinite(finalVolume) ? finalVolume : 0));
  }

  function setAudioVolumeScale(audio, scale) {
    if (!audio) return;
    audio.dataset.volumeScale = String(Math.max(0, Number.isFinite(scale) ? scale : 1));
    applyAudioVolume(audio);
  }

  function applyAudioSettingsToActiveAudio() {
    applyAudioVolume(bgm);
    environment.forEach(applyAudioVolume);
    activeSfx.forEach(applyAudioVolume);
  }

  function createAudio(id, { loop = false, volume = .2, source = "" } = {}) {
    const path = source || resolveAsset(id);
    if (!path) return null;
    const audio = new Audio(path);
    audio.preload = "auto";
    audio.loop = loop;
    audio.dataset.baseVolume = String(volume);
    audio.dataset.volumeScale = "1";
    audio.dataset.assetId = id;
    applyAudioVolume(audio);
    audio.addEventListener("error", () => {
      const message = `${id}: media error ${audio.error?.code ?? "unknown"}`;
      diagnostics.mediaErrors.push(message);
      console.error(`[audio] ${message}`);
    }, { once: true });
    return audio;
  }

  function safePlay(audio) {
    if (!audio) return;
    diagnostics.playAttempts.push(audio.dataset.assetId);
    const result = audio.play();
    if (result && typeof result.catch === "function") {
      result.catch((error) => {
        const message = `${audio.dataset.assetId}: ${error.name}: ${error.message}`;
        if (error.name === "AbortError") {
          diagnostics.cancelledPlays.push(message);
          return;
        }
        diagnostics.playFailures.push(message);
        console.warn(`[audio] 再生できませんでした: ${message}`);
      });
    }
  }

  function stopAudio(audio) {
    if (!audio) return;
    audio.pause();
    try { audio.currentTime = 0; } catch { /* 読み込み前でも進行は継続する。 */ }
  }

  function stopBgm() {
    menuBgmFadeId += 1;
    menuBgmRetryPending = false;
    stopAudio(bgm);
    bgm = null;
  }

  async function fadeMenuBgm(audio, targetScale, ms, fadeId) {
    const startScale = getAudioVolumeScale(audio);
    const steps = 12;
    for (let step = 1; step <= steps; step += 1) {
      await wait(ms / steps);
      if (fadeId !== menuBgmFadeId || bgm !== audio) return false;
      setAudioVolumeScale(audio, startScale + (targetScale - startScale) * (step / steps));
    }
    return true;
  }

  async function startMenuBgm() {
    if (!menuMode || menuBgmAttemptPending) return false;
    let audio = bgm;
    if (audio?.dataset.assetId !== MENU_BGM_ID) {
      stopBgm();
      audio = createAudio(MENU_BGM_ID, { loop: true, volume: 0 });
      if (!audio) return false;
      audio.dataset.baseVolume = String(MENU_BGM_VOLUME);
      setAudioVolumeScale(audio, 0);
      bgm = audio;
    }
    if (!audio.paused && !audio.ended) return true;
    menuBgmAttemptPending = true;
    diagnostics.playAttempts.push(MENU_BGM_ID);
    try {
      await audio.play();
      if (!menuMode || bgm !== audio) return false;
      menuBgmRetryPending = false;
      const fadeId = ++menuBgmFadeId;
      setAudioVolumeScale(audio, 0);
      void fadeMenuBgm(audio, 1, MENU_BGM_FADE_MS, fadeId);
      return true;
    } catch (error) {
      if (error.name === "NotAllowedError") {
        menuBgmRetryPending = true;
        return false;
      }
      const message = `${MENU_BGM_ID}: ${error.name}: ${error.message}`;
      diagnostics.playFailures.push(message);
      console.warn(`[audio] 再生できませんでした: ${message}`);
      return false;
    } finally {
      menuBgmAttemptPending = false;
    }
  }

  async function stopMenuBgmForGame() {
    menuMode = false;
    menuBgmRetryPending = false;
    if (bgm?.dataset.assetId !== MENU_BGM_ID) {
      elements.game.classList.remove("is-menu");
      elements.background.style.backgroundImage = "";
      return;
    }
    const audio = bgm;
    if (audio.paused || getAudioVolumeScale(audio) <= 0) {
      stopBgm();
      elements.game.classList.remove("is-menu");
      elements.background.style.backgroundImage = "";
      return;
    }
    const fadeId = ++menuBgmFadeId;
    if (await fadeMenuBgm(audio, 0, MENU_BGM_FADE_MS, fadeId)) stopBgm();
    elements.game.classList.remove("is-menu");
    elements.background.style.backgroundImage = "";
  }

  function showMenuAtmosphere() {
    menuMode = true;
    elements.game.classList.add("is-menu");
    const path = resolveAsset(MENU_BACKGROUND_ID);
    if (path) elements.background.style.backgroundImage = `url("${path}")`;
    void startMenuBgm();
  }

  function retryMenuBgmAfterGesture() {
    if (menuMode && menuBgmRetryPending) void startMenuBgm();
  }

  function playBgm(value, record) {
    if (AUDIO_CONTROL.test(value)) { if (value === "停止") stopBgm(); return; }
    const id = splitAssetIds(value)[0];
    if (bgm?.dataset.assetId === id) return;
    stopBgm();
    bgm = createAudio(id, { loop: true, volume: record?.chapter_id === "CH01" ? .24 : .18 });
    safePlay(bgm);
  }

  async function playTrueEndingBgm(sequenceId) {
    const id = "BGM_CH3_TRUE_END_LAST_PAGE";
    if (bgm?.dataset.assetId === id) return true;
    stopBgm();
    stopEnvironment();
    let objectUrl = "";
    try {
      const response = await fetch(resolveAsset(id));
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      objectUrl = URL.createObjectURL(await response.blob());
      if (sequenceId !== endingSequenceId) {
        URL.revokeObjectURL(objectUrl);
        return false;
      }
      const endingBgm = createAudio(id, { loop: false, volume: 0, source: objectUrl });
      endingBgm.dataset.baseVolume = ".18";
      setAudioVolumeScale(endingBgm, 0);
      bgm = endingBgm;
      const releaseObjectUrl = () => {
        if (!objectUrl) return;
        URL.revokeObjectURL(objectUrl);
        objectUrl = "";
      };
      endingBgm.addEventListener("ended", releaseObjectUrl, { once: true });
      endingBgm.addEventListener("pause", releaseObjectUrl, { once: true });
      await new Promise((resolve, reject) => {
        if (endingBgm.readyState >= HTMLMediaElement.HAVE_METADATA) { resolve(); return; }
        endingBgm.addEventListener("loadedmetadata", resolve, { once: true });
        endingBgm.addEventListener("error", () => reject(new Error("metadata load failed")), { once: true });
      });
      await new Promise((resolve, reject) => {
        const onSeeked = () => {
          if (Math.abs(endingBgm.currentTime - 30) <= .25) resolve();
          else reject(new Error(`seek position ${endingBgm.currentTime.toFixed(3)}s`));
        };
        endingBgm.addEventListener("seeked", onSeeked, { once: true });
        endingBgm.currentTime = 30;
        if (!endingBgm.seeking && Math.abs(endingBgm.currentTime - 30) <= .25) resolve();
      });
      if (sequenceId !== endingSequenceId || bgm !== endingBgm) {
        if (bgm === endingBgm) stopBgm();
        else releaseObjectUrl();
        return false;
      }
      safePlay(endingBgm);
      void fadeInEndingBgm(endingBgm, 1, ENDING_TIMINGS.lastPageFadeIn, sequenceId);
      return true;
    } catch (error) {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      if (bgm?.dataset.assetId === id) stopBgm();
      const message = `${id}: seek error: ${error.message}`;
      diagnostics.mediaErrors.push(message);
      console.error(`[audio] ${message}`);
      return false;
    }
  }

  async function fadeInEndingBgm(audio, targetScale, ms, sequenceId) {
    const steps = 12;
    for (let step = 1; step <= steps; step += 1) {
      if (!(await waitForEnding(ms / steps, sequenceId))) return false;
      if (bgm !== audio) return false;
      setAudioVolumeScale(audio, targetScale * (step / steps));
    }
    return true;
  }

  function stopEnvironment() {
    environment.forEach(stopAudio);
    environment.clear();
  }

  function getEnvironmentVolume(id, record) {
    if (record?.chapter_id !== "CH02") return id.startsWith("ENV_") ? .14 : .11;
    if (id.startsWith("AMB_")) return .12;
    if (id === "ENV_STATION_EVENING") return .10;
    if (id === "ENV_QUIET_ROOM") return record.scene_id === "Scene07" ? .08 : .10;
    if (id === "ENV_UNIVERSITY_CLASSROOM") {
      return record.scene_id === "Scene02" && record.sequence === "11" ? .12 : .08;
    }
    return .10;
  }

  function playEnvironment(value, record) {
    if (value === "途切れる" || value === "停止") { stopEnvironment(); return; }
    if (value === "ざわめきが続く" || value === "継続" || value === "続く") return;
    if (!value.includes("_") && !value.includes("+")) {
      diagnostics.warnings.push(`未対応の環境音制御: ${value}`);
      console.warn(`[audio] 未対応の環境音制御: ${value}`);
      return;
    }
    const ids = splitAssetIds(value);
    environment.forEach((audio, id) => {
      if (!ids.includes(id)) { stopAudio(audio); environment.delete(id); }
    });
    ids.forEach((id) => {
      const existing = environment.get(id);
      if (existing && !existing.ended) return;
      const isLoop = id.startsWith("ENV_") || id.startsWith("AMB_");
      const audio = createAudio(id, { loop: isLoop, volume: getEnvironmentVolume(id, record) });
      if (!audio) return;
      environment.set(id, audio);
      if (!isLoop) audio.addEventListener("ended", () => environment.delete(id), { once: true });
      safePlay(audio);
    });
  }

  function playSfx(value) {
    if (AUDIO_CONTROL.test(value)) return;
    splitAssetIds(value).forEach((id) => {
      if ([...activeSfx].some((audio) => audio.dataset.assetId === id && !audio.ended)) return;
      const audio = createAudio(id, { volume: SFX_VOLUME_OVERRIDES[id] ?? DEFAULT_SFX_VOLUME });
      if (!audio) return;
      activeSfx.add(audio);
      audio.addEventListener("ended", () => activeSfx.delete(audio), { once: true });
      audio.addEventListener("error", () => activeSfx.delete(audio), { once: true });
      safePlay(audio);
    });
  }

  function stopActiveSfxById(id) {
    activeSfx.forEach((audio) => {
      if (audio.dataset.assetId !== id) return;
      stopAudio(audio);
      activeSfx.delete(audio);
    });
  }

  function stopActiveSfx() {
    activeSfx.forEach(stopAudio);
    activeSfx.clear();
  }

  function stopTransientSfx(previousRecord, currentRecord) {
    if (!previousRecord?.sfx || AUDIO_CONTROL.test(previousRecord.sfx)) return;
    const currentIds = new Set(splitAssetIds(currentRecord?.sfx || ""));
    splitAssetIds(previousRecord.sfx).forEach((id) => {
      if (!PERSISTENT_SFX_IDS.has(id) && id !== "ENV_CLOCK_TICKING" && !currentIds.has(id)) stopActiveSfxById(id);
    });
  }

  function stopAllAudio() {
    stopBgm(); stopEnvironment(); stopActiveSfx();
  }

  function setVisible(target) {
    [elements.titleCard, elements.characterListCard, elements.characterDetailCard, elements.settingsCard, elements.updateHistoryCard, elements.timeCard, elements.message, elements.choiceCard, elements.endCard, elements.errorCard]
      .forEach((element) => { element.hidden = element !== target; });
  }

  function clearMessage() {
    elements.message.hidden = true;
    elements.speaker.textContent = "";
    elements.text.textContent = "";
    elements.badge.textContent = "";
    elements.badge.hidden = true;
    elements.message.className = "message-window";
  }

  function renderMessage(record) {
    setVisible(elements.message);
    elements.message.className = "message-window";
    elements.speaker.textContent = record.record_type === "dialogue" ? record.speaker : "";
    elements.text.textContent = record.text;
    const label = DELIVERY_LABELS[record.delivery_mode] || "";
    elements.badge.textContent = label;
    elements.badge.hidden = !label;
    if (label) elements.message.classList.add(`is-${record.delivery_mode}`);
  }

  function applyTimeTone(record) {
    elements.game.classList.remove("is-time-morning", "is-time-day", "is-time-night");
    if (record?.chapter_id !== "CH03" || record.background !== "BG_CH3_KANAKO_APARTMENT_DESK_NIGHT") return;
    const cue = `${record.direction || ""} ${record.time_cue || ""}`;
    if (cue.includes("朝")) elements.game.classList.add("is-time-morning");
    else if (cue.includes("昼")) elements.game.classList.add("is-time-day");
    else elements.game.classList.add("is-time-night");
  }

  async function setBackground(id, record = null) {
    const path = resolveAsset(id);
    if (!path) return;
    elements.background.classList.add("is-loading");
    await new Promise((resolve) => {
      const image = new Image();
      image.onload = () => { elements.background.style.backgroundImage = `url("${path}")`; resolve(); };
      image.onerror = () => {
        const message = `${id}: 背景画像を読み込めませんでした。`;
        diagnostics.errors.push(message); console.error(`[background] ${message}`); resolve();
      };
      image.src = path;
    });
    elements.background.classList.remove("is-loading");
    state.background = id;
    applyTimeTone(record);
  }

  function setAmbientVolumeScale(scale) {
    setAudioVolumeScale(bgm, scale);
    environment.forEach((audio) => setAudioVolumeScale(audio, scale));
  }

  function parseChoiceDirection(value) {
    const match = /^選択肢：([^／]+)／([^／]+)／接続先：(Scene\d+)$/.exec(value || "");
    return match ? { id: match[1], label: match[2], targetScene: match[3] } : null;
  }

  function collectChoices(startIndex) {
    const choices = [];
    for (let index = startIndex; index < state.records.length; index += 1) {
      const record = state.records[index];
      if (record.chapter_id !== "CH03" || record.record_type !== "direction") break;
      const choice = parseChoiceDirection(record.direction);
      if (!choice) break;
      choices.push(choice);
    }
    return choices;
  }

  function clearChoice() {
    state.choiceActive = false;
    elements.choiceOptions.replaceChildren();
    elements.choiceCard.hidden = true;
  }

  function chooseRoute(choice) {
    if (!state.choiceActive || state.locked) return;
    cancelAutoAdvance();
    const targetIndex = state.records.findIndex((record) =>
      record.chapter_id === "CH03" && record.scene_id === choice.targetScene && record.sequence === "1"
    );
    if (targetIndex < 0) {
      const message = `${choice.id}: 接続先${choice.targetScene}が見つかりません。`;
      diagnostics.errors.push(message);
      console.error(`[choice] ${message}`);
      return;
    }
    state.selectedChoices = { ...state.selectedChoices, [choice.id]: true };
    clearChoice();
    state.index = targetIndex - 1;
    void advance();
  }

  function showChoices(choices) {
    cancelAutoAdvance();
    if (choices.length < 2) {
      diagnostics.errors.push(`選択肢グループが不足しています: index ${state.index}`);
      return;
    }
    state.choiceActive = true;
    elements.choiceOptions.replaceChildren();
    choices.forEach((choice) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "choice-card__option";
      button.dataset.choiceId = choice.id;
      button.textContent = choice.label;
      button.addEventListener("pointerup", (event) => event.stopPropagation());
      button.addEventListener("click", (event) => { event.stopPropagation(); chooseRoute(choice); });
      elements.choiceOptions.append(button);
    });
    setVisible(elements.choiceCard);
    elements.choiceOptions.querySelector("button")?.focus();
  }

  function showEndCue(kind, text) {
    if (kind === "label") state.currentEndLabel = text;
    else state.currentEndTitle = text;
    elements.endSeries.textContent = state.currentEndLabel || "END";
    elements.endText.textContent = state.currentEndTitle || "";
    elements.endNext.textContent = "クリックして進む";
    setVisible(elements.endCard);
  }

  function clearFinalEndingUi() {
    elements.endCard.classList.remove("is-final-ending", "is-credits", "is-true-end", "is-bad-a", "is-bad-b", "is-fading-out");
    elements.endSeries.hidden = false;
    elements.endText.hidden = false;
    elements.endNext.hidden = false;
    elements.endCredits.hidden = true;
    elements.endCreditCards.forEach((card) => {
      card.hidden = true;
      card.classList.remove("is-visible");
    });
    elements.endReturnButton.hidden = true;
  }

  function cancelEndingSequence() {
    cancelAutoAdvance();
    endingSequenceId += 1;
    endingTimeouts.forEach((resolve, timeoutId) => {
      window.clearTimeout(timeoutId);
      resolve(false);
    });
    endingTimeouts.clear();
    clearFinalEndingUi();
  }

  function waitForEnding(ms, sequenceId) {
    if (sequenceId !== endingSequenceId) return Promise.resolve(false);
    return new Promise((resolve) => {
      const timeoutId = window.setTimeout(() => {
        endingTimeouts.delete(timeoutId);
        resolve(sequenceId === endingSequenceId);
      }, ms);
      endingTimeouts.set(timeoutId, resolve);
    });
  }

  async function runTrueEndingCredits(sequenceId) {
    const lastIndex = elements.endCreditCards.length - 1;
    for (let index = 0; index < elements.endCreditCards.length; index += 1) {
      const card = elements.endCreditCards[index];
      card.hidden = false;
      void card.offsetWidth;
      card.classList.add("is-visible");
      if (!(await waitForEnding(ENDING_TIMINGS.creditFade, sequenceId))) return false;
      const hold = index === lastIndex ? ENDING_TIMINGS.creditFinalHold : ENDING_TIMINGS.creditHold;
      if (!(await waitForEnding(hold, sequenceId))) return false;
      card.classList.remove("is-visible");
      if (!(await waitForEnding(ENDING_TIMINGS.creditFade, sequenceId))) return false;
      card.hidden = true;
      if (index < lastIndex && !(await waitForEnding(ENDING_TIMINGS.creditGap, sequenceId))) return false;
    }
    return true;
  }

  async function fadeOutEndingBgm(ms, sequenceId) {
    if (!bgm) return waitForEnding(ms, sequenceId);
    const audio = bgm;
    const startScale = getAudioVolumeScale(audio);
    const steps = 12;
    for (let step = 1; step <= steps; step += 1) {
      if (!(await waitForEnding(ms / steps, sequenceId))) return false;
      if (bgm !== audio) return false;
      setAudioVolumeScale(audio, startScale * (1 - step / steps));
    }
    stopBgm();
    return true;
  }

  function returnToTitle() {
    cancelAutoAdvance();
    const returningWithinMenu = menuMode && !state.started && !state.ended;
    cancelEndingSequence();
    if (!returningWithinMenu) stopAllAudio();
    preplayedSfxIndexes.clear();
    clearChoice();
    clearMessage();
    state.index = -1;
    state.started = false;
    state.ended = false;
    state.locked = false;
    state.choiceActive = false;
    state.lastInput = 0;
    state.chapterId = "";
    state.scene = "";
    state.subsection = "";
    state.background = "";
    state.currentEndLabel = "";
    state.currentEndTitle = "";
    state.selectedChoices = {};
    elements.game.classList.remove("is-shaking", "is-shaking-strong", "is-time-morning", "is-time-day", "is-time-night");
    elements.effect.classList.remove("is-blackout");
    elements.background.classList.remove("is-loading");
    if (!returningWithinMenu) elements.background.style.backgroundImage = "";
    elements.warning.hidden = true;
    elements.titleCard.inert = false;
    elements.titleText.textContent = CHAPTERS[0].label;
    elements.loadStatus.textContent = "クリック、Enter、Spaceで進みます";
    elements.start.hidden = false;
    elements.charactersButton.hidden = false;
    elements.settingsButton.hidden = false;
    elements.updateHistoryButton.hidden = false;
    elements.start.disabled = false;
    elements.progress.textContent = "開始待ち";
    setChapterUi(CHAPTERS[0].id);
    setVisible(elements.titleCard);
    showMenuAtmosphere();
    updateDevPanel();
  }

  async function runFinalEnding(record) {
    cancelAutoAdvance();
    cancelEndingSequence();
    const sequenceId = endingSequenceId;
    const endingCode = record.direction || "";
    const isTrueEnd = endingCode.includes("TRUE END");
    const isBadEndA = endingCode.includes("BAD END A");
    const endingId = getEndingId(record);
    if (endingId) addPlayerProgress("reachedEndings", endingId);
    state.ended = true;
    clearChoice();
    stopBgm();
    stopEnvironment();
    stopActiveSfx();
    elements.endCard.classList.add("is-final-ending", isTrueEnd ? "is-true-end" : isBadEndA ? "is-bad-a" : "is-bad-b");
    elements.endSeries.textContent = isTrueEnd ? (state.currentEndLabel || "TRUE END") : isBadEndA ? "BAD END A" : "BAD END B";
    elements.endText.textContent = state.currentEndTitle || record.text;
    elements.endNext.textContent = isTrueEnd ? "まもなくエンドロールが始まります" : "余韻の後、タイトルへ戻ります";
    elements.endReturnButton.hidden = false;
    setVisible(elements.endCard);
    const chapterCount = state.records.filter((item) => item.chapter_id === record.chapter_id).length;
    elements.progress.textContent = `${chapterCount} / ${chapterCount}｜完了`;

    if (isTrueEnd) {
      if (!(await waitForEnding(ENDING_TIMINGS.titleHold, sequenceId))) return;
      elements.endSeries.hidden = true;
      elements.endText.hidden = true;
      elements.endNext.hidden = true;
      elements.endCard.classList.add("is-credits");
      await playTrueEndingBgm(sequenceId);
      if (sequenceId !== endingSequenceId) return;
      elements.endCredits.hidden = false;
      if (!(await runTrueEndingCredits(sequenceId))) return;
      elements.endCard.classList.add("is-fading-out");
      if (!(await fadeOutEndingBgm(ENDING_TIMINGS.fadeOut, sequenceId))) return;
    } else {
      const hold = isBadEndA ? ENDING_TIMINGS.badAHold : ENDING_TIMINGS.badBHold;
      if (!(await waitForEnding(hold, sequenceId))) return;
      elements.endCard.classList.add("is-fading-out");
      if (!(await waitForEnding(ENDING_TIMINGS.fadeOut, sequenceId))) return;
    }
    if (sequenceId === endingSequenceId) returnToTitle();
  }

  async function performDirection(value, record) {
    if (!value) return;
    if (value.startsWith("分岐保存：") || value.startsWith("分岐セーブ：") || value.startsWith("分岐復帰：") || value.startsWith("分岐：")) return;
    if (value.startsWith("日記：") || value.startsWith("日記の追記：") || value.startsWith("メッセージ履歴：")) return;
    if (value.startsWith("画面演出：") && !value.includes("暗転") && !value.includes("揺れ")) return;
    if (value.startsWith("エンド表示：")) {
      const label = record.text || value.split("：").slice(1).join("：");
      if (record.chapter_id === "CH03" && label === "TRUE END") {
        stopBgm();
        stopEnvironment();
      }
      showEndCue("label", label);
      return;
    }
    if (value.startsWith("エンドタイトル：")) {
      showEndCue("title", record.text || value.split("：").slice(1).join("："));
      if (record.chapter_id === "CH03" && state.currentEndLabel === "TRUE END") {
        const titleIndex = state.index;
        window.setTimeout(() => {
          const nextRecord = state.records[titleIndex + 1];
          const isTrueEndChapterEnd = nextRecord?.record_type === "chapter_end" && nextRecord.direction.includes("TRUE END");
          if (state.started && !state.ended && state.index === titleIndex && isTrueEndChapterEnd) void advance();
        }, 0);
      }
      return;
    }
    if (value.includes("暗転")) {
      clearMessage();
      setVisible(null);
      elements.effect.classList.add("is-blackout");
      const duration = (value.includes("長い") || value.includes("長め")) ? 1100 : value.includes("ゆっくり") ? 650 : 220;
      await wait(duration);
      elements.effect.classList.remove("is-blackout");
    } else if (value.includes("揺れ")) {
      const strong = value.includes("強まる");
      if (strong) setAmbientVolumeScale(.72);
      elements.game.classList.add(strong ? "is-shaking-strong" : "is-shaking");
      await wait(strong ? 1250 : 520);
      elements.game.classList.remove("is-shaking", "is-shaking-strong");
      if (strong) setAmbientVolumeScale(1);
    } else if (value.includes("短い間")) await wait(260);
    else if (value.includes("周囲の音を一度弱め")) {
      setAmbientVolumeScale(.35);
      await wait(420);
      setAmbientVolumeScale(1);
    }
    else if (value.includes("SNS") || value.includes("メッセージ画面")) elements.message.classList.add("is-message");
    else if (value.startsWith("選択肢：")) return;
    else { diagnostics.warnings.push(`未対応の演出指示: ${value}`); console.warn(`[direction] ${value}`); }
  }

  function wait(ms) { return new Promise((resolve) => window.setTimeout(resolve, ms)); }

  function getChapterConfig(chapterId) {
    return CHAPTERS.find((chapter) => chapter.id === chapterId) || CHAPTERS[0];
  }

  function setChapterUi(chapterId) {
    const chapter = getChapterConfig(chapterId);
    elements.chapter.textContent = chapter.label;
    document.title = `呪いの日記｜${chapter.label}`;
  }

  function updateProgress(record) {
    const location = record.subsection || record.scene_id || "章題";
    const chapterRecords = state.records.filter((item) => item.chapter_id === record.chapter_id);
    const chapterIndex = chapterRecords.indexOf(record) + 1;
    elements.progress.textContent = `${chapterIndex} / ${chapterRecords.length}｜${location}`;
  }

  function getChapterRange(chapterId) {
    const start = state.records.findIndex((record) => record.chapter_id === chapterId);
    if (start < 0) return null;
    let end = start;
    while (end + 1 < state.records.length && state.records[end + 1].chapter_id === chapterId) end += 1;
    return { start, end, count: end - start + 1 };
  }

  function getChapterRecordNumber(index) {
    const record = state.records[index];
    const range = record ? getChapterRange(record.chapter_id) : null;
    return range ? index - range.start + 1 : null;
  }

  function setDevStatus(message, isError = false) {
    if (!isDevMode || !elements.devStatus) return;
    elements.devStatus.textContent = message;
    elements.devStatus.classList.toggle("is-error", isError);
  }

  function getCurrentCheckpoint() {
    const record = state.records[state.index];
    if (!record) return null;
    return {
      schemaVersion: 1,
      chapterId: record.chapter_id,
      scene: record.scene_id,
      sequence: record.sequence,
      globalIndex: state.index,
      chapterRecordNumber: getChapterRecordNumber(state.index),
      savedAt: new Date().toISOString()
    };
  }

  function writeDevCheckpoint(key, announce = true) {
    if (!isDevMode) return false;
    const checkpoint = getCurrentCheckpoint();
    if (!checkpoint) {
      if (announce) setDevStatus("保存できる現在位置がありません。", true);
      return false;
    }
    try {
      localStorage.setItem(key, JSON.stringify(checkpoint));
      if (announce) setDevStatus(`保存しました：${checkpoint.chapterId} ${checkpoint.scene || "章題"} ${checkpoint.sequence || "-"}`);
      return true;
    } catch (error) {
      diagnostics.errors.push(`開発用保存失敗: ${error.message}`);
      if (announce) setDevStatus("保存に失敗しました。", true);
      return false;
    }
  }

  function readDevCheckpoint(key) {
    if (!isDevMode) return null;
    try {
      const value = localStorage.getItem(key);
      if (!value) return null;
      const checkpoint = JSON.parse(value);
      return checkpoint && typeof checkpoint === "object" ? checkpoint : null;
    } catch (error) {
      diagnostics.errors.push(`開発用保存読込失敗: ${error.message}`);
      return null;
    }
  }

  function resolveCheckpoint(checkpoint) {
    if (!checkpoint) return null;
    if (checkpoint.chapterId && checkpoint.scene && String(checkpoint.sequence) !== "") {
      const exact = state.records.reduce((matches, record, index) => {
        if (record.chapter_id === checkpoint.chapterId && record.scene_id === checkpoint.scene && record.sequence === String(checkpoint.sequence)) matches.push(index);
        return matches;
      }, []);
      if (exact.length === 1) return exact[0];
    }
    const fallback = Number(checkpoint.globalIndex);
    return Number.isInteger(fallback) && fallback >= 0 && fallback < state.records.length ? fallback : null;
  }

  function updateDevPanel() {
    if (!isDevMode || !elements.devPanel) return;
    const record = state.records[state.index];
    if (!record) {
      elements.devCurrentLocation.textContent = `開始待ち｜全${state.records.length}件｜内部indexは0始まり`;
      return;
    }
    const range = getChapterRange(record.chapter_id);
    const chapterNumber = getChapterRecordNumber(state.index);
    elements.devCurrentLocation.textContent = [
      getChapterConfig(record.chapter_id).endSeries,
      record.scene_id || "章題",
      `sequence ${record.sequence || "-"}`,
      `章内 ${chapterNumber} / ${range.count}（1始まり）`,
      `全体 ${state.index + 1} / ${state.records.length}`,
      `内部index ${state.index}（0始まり）`
    ].join("｜");
  }

  function populateDevScenes() {
    if (!isDevMode) return;
    const chapterId = elements.devChapterSelect.value;
    const range = getChapterRange(chapterId);
    elements.devSceneSelect.replaceChildren();
    if (!range) return;
    const chapter = getChapterConfig(chapterId);
    const addOption = (label, index, scene = "") => {
      const option = document.createElement("option");
      option.textContent = label;
      option.value = String(index);
      option.dataset.scene = scene;
      elements.devSceneSelect.append(option);
    };
    addOption(chapter.id === "CH02" ? `${chapter.endSeries}章タイトル` : `${chapter.endSeries}開始`, range.start);
    const seen = new Set();
    for (let index = range.start; index <= range.end; index += 1) {
      const scene = state.records[index].scene_id;
      if (!scene || seen.has(scene)) continue;
      seen.add(scene);
      addOption(`${scene}開始`, index, scene);
    }
    const preEnd = Math.max(range.start, range.end - 1);
    addOption(`${chapter.endSeries}章末直前`, preEnd, state.records[preEnd].scene_id);
  }

  function populateDevChapters() {
    if (!isDevMode) return;
    elements.devChapterSelect.replaceChildren();
    CHAPTERS.forEach((chapter) => {
      const option = document.createElement("option");
      option.value = chapter.id;
      option.textContent = chapter.label;
      elements.devChapterSelect.append(option);
    });
    populateDevScenes();
  }

  function parseStrictInteger(input, label) {
    const value = input.value.trim();
    if (!/^\d+$/.test(value)) {
      setDevStatus(`${label}は0以上の整数で入力してください。`, true);
      return null;
    }
    return Number(value);
  }

  function derivePersistentState(targetIndex) {
    const persistent = { chapterId: "", scene: "", subsection: "", background: "", backgroundRecord: null, bgmId: "", bgmRecord: null, environmentIds: [], environmentRecord: null };
    for (let index = 0; index < targetIndex; index += 1) {
      const record = state.records[index];
      if (record.chapter_id && record.chapter_id !== persistent.chapterId) {
        persistent.chapterId = record.chapter_id;
        persistent.scene = "";
        persistent.subsection = "";
        persistent.background = "";
        persistent.backgroundRecord = null;
        persistent.bgmId = "";
        persistent.bgmRecord = null;
        persistent.environmentIds = [];
        persistent.environmentRecord = null;
      }
      if (record.scene_id && record.scene_id !== persistent.scene) {
        persistent.scene = record.scene_id;
        persistent.environmentIds = [];
        persistent.environmentRecord = null;
        if (record.chapter_id === "CH02") {
          persistent.bgmId = "";
          persistent.bgmRecord = null;
        }
      }
      persistent.subsection = record.subsection || persistent.subsection;
      if (record.record_type === "background" && record.background) {
        persistent.background = record.background;
        persistent.backgroundRecord = record;
      }
      if (record.record_type === "bgm" && record.bgm) {
        if (record.bgm === "停止") { persistent.bgmId = ""; persistent.bgmRecord = null; }
        else if (!AUDIO_CONTROL.test(record.bgm)) { persistent.bgmId = splitAssetIds(record.bgm)[0] || ""; persistent.bgmRecord = record; }
      }
      if (record.record_type === "environment" && record.environment) {
        if (record.environment === "停止" || record.environment === "途切れる") {
          persistent.environmentIds = [];
          persistent.environmentRecord = null;
        } else if (!AUDIO_CONTROL.test(record.environment)) {
          persistent.environmentIds = splitAssetIds(record.environment);
          persistent.environmentRecord = record;
        }
      }
      if (record.record_type === "chapter_end") {
        persistent.bgmId = "";
        persistent.bgmRecord = null;
        persistent.environmentIds = [];
        persistent.environmentRecord = null;
      }
    }
    return persistent;
  }

  function resetForDevJump() {
    cancelEndingSequence();
    stopAllAudio();
    menuMode = false;
    menuBgmRetryPending = false;
    preplayedSfxIndexes.clear();
    clearChoice();
    state.currentEndLabel = "";
    state.currentEndTitle = "";
    elements.game.classList.remove("is-menu", "is-shaking", "is-shaking-strong", "is-time-morning", "is-time-day", "is-time-night");
    elements.effect.classList.remove("is-blackout");
    elements.background.classList.remove("is-loading");
    elements.background.style.backgroundImage = "";
    elements.warning.hidden = true;
    elements.titleCard.inert = false;
    clearMessage();
    setVisible(null);
  }

  async function restorePersistentState(persistent, targetRecord) {
    elements.background.style.backgroundImage = "";
    state.background = "";
    if (persistent.background) await setBackground(persistent.background, persistent.backgroundRecord || targetRecord);
    if (persistent.bgmId) playBgm(persistent.bgmId, persistent.bgmRecord || targetRecord);
    if (persistent.environmentIds.length) playEnvironment(persistent.environmentIds.join("+"), persistent.environmentRecord || targetRecord);
  }

  async function jumpToIndex(targetIndex, label = "指定位置") {
    if (!isDevMode) return false;
    if (!Number.isInteger(targetIndex) || targetIndex < 0 || targetIndex >= state.records.length) {
      setDevStatus(`範囲外です。内部indexは0～${Math.max(0, state.records.length - 1)}です。`, true);
      return false;
    }
    if (state.locked) {
      setDevStatus("演出処理中です。完了後に再実行してください。", true);
      return false;
    }
    state.locked = true;
    const targetRecord = state.records[targetIndex];
    const persistent = derivePersistentState(targetIndex);
    if (targetRecord.chapter_id !== persistent.chapterId) {
      persistent.background = "";
      persistent.backgroundRecord = null;
      persistent.bgmId = "";
      persistent.bgmRecord = null;
      persistent.environmentIds = [];
      persistent.environmentRecord = null;
    } else if (targetRecord.scene_id && targetRecord.scene_id !== persistent.scene) {
      persistent.environmentIds = [];
      persistent.environmentRecord = null;
      if (targetRecord.chapter_id === "CH02") {
        persistent.bgmId = "";
        persistent.bgmRecord = null;
      }
    }
    try {
      resetForDevJump();
      state.index = targetIndex;
      state.started = true;
      state.ended = false;
      state.lastInput = performance.now();
      state.chapterId = persistent.chapterId;
      state.scene = persistent.scene;
      state.subsection = persistent.subsection;
      setChapterUi(targetRecord.chapter_id);
      await restorePersistentState(persistent, targetRecord);
      diagnostics.jumpedIndexes.push(targetIndex);
      await processRecord(targetRecord);
      writeDevCheckpoint(DEV_LAST_KEY, false);
      updateDevPanel();
      setDevStatus(`${label}へ移動しました。`);
      return true;
    } catch (error) {
      diagnostics.errors.push(`開発用ジャンプ失敗 ${targetIndex}: ${error.message}`);
      console.error("[dev-jump]", error);
      setDevStatus("ジャンプに失敗しました。", true);
      return false;
    } finally {
      state.locked = false;
    }
  }

  function jumpToSelectedScene() {
    const index = Number(elements.devSceneSelect.value);
    void jumpToIndex(index, elements.devSceneSelect.selectedOptions[0]?.textContent || "選択地点");
  }

  function jumpToSceneSequence() {
    const scene = elements.devSceneSelect.selectedOptions[0]?.dataset.scene;
    if (!scene) { setDevStatus("Scene開始を選択してください。", true); return; }
    const sequence = parseStrictInteger(elements.devSequenceInput, "sequence");
    if (sequence === null) return;
    const chapterId = elements.devChapterSelect.value;
    const matches = state.records.reduce((indexes, record, index) => {
      if (record.chapter_id === chapterId && record.scene_id === scene && record.sequence === String(sequence)) indexes.push(index);
      return indexes;
    }, []);
    if (matches.length !== 1) {
      setDevStatus(matches.length ? "該当位置が複数あります。章内番号を使用してください。" : "該当するScene・sequenceがありません。", true);
      return;
    }
    void jumpToIndex(matches[0], `${chapterId} ${scene} sequence ${sequence}`);
  }

  function jumpToChapterRecord() {
    const number = parseStrictInteger(elements.devChapterRecordInput, "章内表示番号");
    if (number === null) return;
    const chapterId = elements.devChapterSelect.value;
    const range = getChapterRange(chapterId);
    if (!range || number < 1 || number > range.count) {
      setDevStatus(`章内表示番号は1～${range?.count || 0}です。`, true);
      return;
    }
    void jumpToIndex(range.start + number - 1, `${getChapterConfig(chapterId).endSeries} ${number}件目`);
  }

  function jumpToGlobalIndex() {
    const index = parseStrictInteger(elements.devGlobalIndexInput, "全体内部index");
    if (index !== null) void jumpToIndex(index, `内部index ${index}`);
  }

  function restoreDevCheckpoint(key, label) {
    const checkpoint = readDevCheckpoint(key);
    if (!checkpoint) { setDevStatus(`${label}がありません。`, true); return; }
    const index = resolveCheckpoint(checkpoint);
    if (index === null) { setDevStatus(`${label}の位置を特定できません。`, true); return; }
    void jumpToIndex(index, label);
  }

  function toggleDevPanel() {
    const collapsed = elements.devPanel.classList.toggle("is-collapsed");
    elements.devPanelToggle.textContent = collapsed ? "開く" : "閉じる";
    elements.devPanelToggle.setAttribute("aria-expanded", String(!collapsed));
  }

  function handleDevShortcut(event) {
    if (!isDevMode || event.repeat) return;
    if (event.key === "F2") { event.preventDefault(); toggleDevPanel(); }
    else if (event.altKey && event.shiftKey && event.key.toLowerCase() === "s") { event.preventDefault(); writeDevCheckpoint(DEV_MANUAL_KEY); }
    else if (event.altKey && event.shiftKey && event.key.toLowerCase() === "r") { event.preventDefault(); restoreDevCheckpoint(DEV_MANUAL_KEY, "手動保存地点"); }
  }

  function initDevTools() {
    if (!isDevMode || !elements.devPanel) return;
    elements.devPanel.hidden = false;
    populateDevChapters();
    elements.devChapterSelect.addEventListener("change", populateDevScenes);
    elements.devPanelToggle.addEventListener("click", toggleDevPanel);
    elements.devSceneJumpButton.addEventListener("click", jumpToSelectedScene);
    elements.devSequenceJumpButton.addEventListener("click", jumpToSceneSequence);
    elements.devChapterRecordJumpButton.addEventListener("click", jumpToChapterRecord);
    elements.devGlobalIndexJumpButton.addEventListener("click", jumpToGlobalIndex);
    elements.devSaveButton.addEventListener("click", () => writeDevCheckpoint(DEV_MANUAL_KEY));
    elements.devLoadButton.addEventListener("click", () => restoreDevCheckpoint(DEV_MANUAL_KEY, "手動保存地点"));
    elements.devLoadLastButton.addEventListener("click", () => restoreDevCheckpoint(DEV_LAST_KEY, "最終位置"));
    elements.devRestartButton.addEventListener("click", () => { void jumpToIndex(0, "最初から"); });
    window.addEventListener("keydown", handleDevShortcut);
    updateDevPanel();
  }

  async function finishChapter(record) {
    cancelAutoAdvance();
    const chapter = getChapterConfig(record.chapter_id);
    const isFinalChapter = chapter.id === CHAPTERS.at(-1).id;
    if (isFinalChapter) {
      await runFinalEnding(record);
      return;
    }
    if (record.chapter_id === "CH01" || record.chapter_id === "CH02") {
      addPlayerProgress("clearedChapters", record.chapter_id);
    }
    state.ended = isFinalChapter;
    stopAllAudio();
    elements.endSeries.textContent = isFinalChapter ? (state.currentEndLabel || chapter.endSeries) : chapter.endSeries;
    elements.endText.textContent = isFinalChapter ? (state.currentEndTitle || record.text || chapter.endTitle) : (record.text || chapter.endTitle);
    elements.endNext.textContent = chapter.nextLabel;
    setVisible(elements.endCard);
    const chapterCount = state.records.filter((item) => item.chapter_id === record.chapter_id).length;
    elements.progress.textContent = `${chapterCount} / ${chapterCount}｜${isFinalChapter ? "完了" : "章間"}`;
  }

  async function processRecord(record) {
    const previousRecord = state.records[state.index - 1];
    stopTransientSfx(previousRecord, record);
    if (previousRecord?.sfx === "ENV_CLOCK_TICKING" && record.sfx !== "ENV_CLOCK_TICKING") {
      stopActiveSfxById("ENV_CLOCK_TICKING");
    }
    const chapterChanged = Boolean(record.chapter_id && record.chapter_id !== state.chapterId);
    if (chapterChanged) {
      stopAllAudio();
      clearChoice();
      state.currentEndLabel = "";
      state.currentEndTitle = "";
      clearMessage();
      if (state.chapterId) {
        setVisible(null);
        elements.effect.classList.add("is-blackout");
        await wait(220);
        elements.background.style.backgroundImage = "";
      }
      state.chapterId = record.chapter_id;
      state.scene = "";
      state.subsection = "";
      state.background = "";
      setChapterUi(record.chapter_id);
      elements.effect.classList.remove("is-blackout");
    }
    updateProgress(record);
    const sceneChanged = Boolean(record.scene_id && record.scene_id !== state.scene);
    if (sceneChanged) {
      stopEnvironment();
      stopActiveSfx();
      if (record.chapter_id !== "CH01") stopBgm();
      state.scene = record.scene_id;
      clearMessage();
    }
    state.subsection = record.subsection || state.subsection;
    switch (record.record_type) {
      case "chapter_title":
        elements.titleText.textContent = record.text;
        elements.loadStatus.textContent = "クリック、Enter、Spaceで進みます";
        elements.start.hidden = true;
        elements.charactersButton.hidden = true;
        elements.settingsButton.hidden = true;
        elements.updateHistoryButton.hidden = true;
        setVisible(elements.titleCard);
        break;
      case "narration": renderMessage(record); break;
      case "dialogue": renderMessage(record); break;
      case "background":
        if (sceneChanged || record.background !== state.background) { clearMessage(); setVisible(null); }
        await setBackground(record.background, record);
        break;
      case "environment": playEnvironment(record.environment, record); break;
      case "bgm": playBgm(record.bgm, record); break;
      case "sfx":
        if (preplayedSfxIndexes.has(state.index)) preplayedSfxIndexes.delete(state.index);
        else playSfx(record.sfx);
        break;
      case "time_cue":
        clearMessage();
        elements.timeText.textContent = record.time_cue;
        setVisible(elements.timeCard);
        break;
      case "direction": {
        const choice = parseChoiceDirection(record.direction);
        if (choice) {
          showChoices(collectChoices(state.index));
          break;
        }
        const nextRecord = state.records[state.index + 1];
        const earthquakeSfxId = splitAssetIds(nextRecord?.sfx || "").find((id) =>
          id === "SFX_EARTHQUAKE_SHAKE" || id === "SFX_CH1_SC02_EARTHQUAKE_ROOM_SHAKE"
        );
        if (record.direction.includes("揺れが強まる") && nextRecord?.record_type === "sfx" && earthquakeSfxId) {
          playSfx(earthquakeSfxId);
          preplayedSfxIndexes.add(state.index + 1);
        }
        const endDirection = record.direction.startsWith("エンド表示：") || record.direction.startsWith("エンドタイトル：");
        if (record.chapter_id === "CH03" && record.text && !endDirection) {
          renderMessage({ ...record, record_type: "narration", speaker: "" });
        }
        await performDirection(record.direction, record);
        break;
      }
      case "chapter_end":
        await finishChapter(record);
        break;
      default:
        diagnostics.warnings.push(`未対応のrecord_type: ${record.record_type}`);
        console.warn(`[record] 未対応のrecord_type: ${record.record_type}`);
    }
    recordCharacterEncounter(record);
  }

  function cancelAutoAdvance() {
    autoAdvanceGeneration += 1;
    if (autoAdvanceTimer !== null) {
      window.clearTimeout(autoAdvanceTimer);
      autoAdvanceTimer = null;
    }
  }

  function getAutoAdvanceText(record) {
    if (!record) return "";
    if (AUTO_ADVANCE_TEXT_TYPES.has(record.record_type)) return record.text || "";
    if (record.record_type !== "direction" || !record.text) return "";
    if (parseChoiceDirection(record.direction)) return "";
    if (record.direction.startsWith("エンド表示：") || record.direction.startsWith("エンドタイトル：")) return "";
    return record.text;
  }

  function isAutoAdvanceControl(record) {
    if (!record) return false;
    if (AUTO_ADVANCE_CONTROL_TYPES.has(record.record_type)) return true;
    if (record.record_type !== "direction" || record.text || parseChoiceDirection(record.direction)) return false;
    return /^(分岐保存|セーブ|復帰|分岐|日記|日記追記|メッセージ履歴)/.test(record.direction || "");
  }

  function getAutoAdvanceDelay(record = state.records[state.index], mode = textSettings.autoAdvanceMode) {
    const setting = AUTO_ADVANCE_MODES[mode] || AUTO_ADVANCE_MODES.off;
    if (!setting.baseDelay) return null;
    const text = getAutoAdvanceText(record);
    if (text) return setting.baseDelay + Math.min(2800, Math.max(0, text.length - 20) * 35);
    return isAutoAdvanceControl(record) ? 60 : null;
  }

  function scheduleAutoAdvance() {
    cancelAutoAdvance();
    const delay = getAutoAdvanceDelay();
    if (delay === null || !state.started || state.ended || state.locked || state.choiceActive) return false;
    const generation = autoAdvanceGeneration;
    diagnostics.autoAdvanceSchedules += 1;
    autoAdvanceTimer = window.setTimeout(() => {
      if (generation !== autoAdvanceGeneration) return;
      autoAdvanceTimer = null;
      diagnostics.autoAdvanceFires += 1;
      void requestAdvance("auto");
    }, delay);
    diagnostics.maxAutoAdvanceTimers = Math.max(diagnostics.maxAutoAdvanceTimers, autoAdvanceTimer === null ? 0 : 1);
    return true;
  }

  function requestAdvance(source = "manual") {
    if (!state.started || state.ended || state.choiceActive || state.locked || isAdvancing) {
      diagnostics.droppedAdvanceInputs += 1;
      return false;
    }
    cancelAutoAdvance();
    void advance(source);
    return true;
  }

  async function advance(source = "internal") {
    if (!state.started || state.ended || state.locked || isAdvancing || state.choiceActive) return false;
    if (state.index + 1 >= state.records.length) return false;
    cancelAutoAdvance();
    isAdvancing = true;
    state.locked = true;
    state.index += 1;
    diagnostics.processedIndexes.push(state.index);
    try { await processRecord(state.records[state.index]); }
    catch (error) {
      diagnostics.errors.push(`${state.index}: ${error.message}`);
      console.error("[game] レコード処理エラー", error);
    } finally {
      state.locked = false;
      isAdvancing = false;
      if (isDevMode) {
        writeDevCheckpoint(DEV_LAST_KEY, false);
        updateDevPanel();
      }
      scheduleAutoAdvance();
    }
    return true;
  }

  async function startGame(event) {
    event?.stopPropagation();
    if (state.started || !state.records.length) return;
    state.started = true;
    await advance();
  }

  function showWarning(event) {
    event?.stopPropagation();
    if (state.started || !state.records.length) return;
    cancelAutoAdvance();
    showMenuAtmosphere();
    elements.warning.hidden = false;
    elements.titleCard.inert = true;
    elements.warning.focus();
  }

  function closeWarning(event) {
    event?.stopPropagation();
    elements.warning.hidden = true;
    elements.titleCard.inert = false;
    void startMenuBgm();
    elements.start.focus();
  }

  async function confirmWarning(event) {
    event?.stopPropagation();
    if (state.started) return;
    elements.confirmStart.disabled = true;
    elements.warning.hidden = true;
    elements.titleCard.inert = false;
    await stopMenuBgmForGame();
    await startGame(event);
    elements.confirmStart.disabled = false;
  }

  function handleInput(event) {
    if (event.type === "keydown") {
      if (!['Enter', ' '].includes(event.key) || event.repeat) return;
      if (event.target instanceof Element && event.target.closest("button, input, select, textarea")) return;
      event.preventDefault();
    }
    if (!elements.warning.hidden || !state.started || state.ended || state.choiceActive) return;
    const now = performance.now();
    if (now - state.lastInput < 85) return;
    state.lastInput = now;
    requestAdvance("manual");
  }

  function validateRecords(records) {
    const expectedTypes = new Set(["chapter_title", "narration", "dialogue", "background", "environment", "bgm", "sfx", "time_cue", "direction", "chapter_end"]);
    const errors = [];
    records.forEach((record, index) => {
      if (!expectedTypes.has(record.record_type)) errors.push(`${index}: record_type=${record.record_type}`);
      ["background", "bgm", "sfx"].forEach((column) => {
        const value = record[column];
        if (value && !AUDIO_CONTROL.test(value)) splitAssetIds(value).forEach((id) => { if (!ASSETS[id]) errors.push(`${index}: ${column}=${id}`); });
      });
      if (record.environment && !AUDIO_CONTROL.test(record.environment)) splitAssetIds(record.environment).forEach((id) => { if (!ASSETS[id]) errors.push(`${index}: environment=${id}`); });
    });
    return errors;
  }

  function getStats(records = state.records) {
    const count = (type) => records.filter((record) => record.record_type === type).length;
    return {
      records: records.length,
      scenes: [...new Set(records.map((record) => record.scene_id).filter(Boolean))],
      subsections: [...new Set(records.map((record) => record.subsection).filter(Boolean))],
      dialogue: count("dialogue"), narration: count("narration"), textTotal: count("dialogue") + count("narration"),
      background: count("background"), environment: count("environment"), bgm: count("bgm"), sfx: count("sfx"),
      chapterTitle: count("chapter_title"), chapterEnd: count("chapter_end")
    };
  }

  async function load() {
    try {
      const loadedChapters = await Promise.all(CHAPTERS.map(async (chapter) => {
        const response = await fetch(chapter.path, { cache: "no-store" });
        if (!response.ok) throw new Error(`${chapter.id} CSV取得失敗: HTTP ${response.status}`);
        const records = parseCsv(await response.text());
        if (records.some((record) => record.chapter_id !== chapter.id)) {
          throw new Error(`${chapter.id} CSVに異なるchapter_idが含まれています。`);
        }
        return records;
      }));
      state.records = loadedChapters.flat();
      const validationErrors = validateRecords(state.records);
      if (validationErrors.length) throw new Error(`素材またはデータ参照エラー: ${validationErrors.join(" / ")}`);
      setChapterUi(CHAPTERS[0].id);
      elements.loadStatus.textContent = loadedChapters
        .map((records, index) => `${CHAPTERS[index].endSeries}${records.length}件`)
        .join("・") + "を読み込みました";
      elements.start.disabled = false;
      elements.progress.textContent = "開始待ち";
      initDevTools();
    } catch (error) {
      diagnostics.errors.push(error.message);
      elements.errorText.textContent = error.message;
      setVisible(elements.errorCard);
      console.error("[load]", error);
    }
  }

  elements.start.addEventListener("click", showWarning);
  elements.charactersButton.addEventListener("pointerup", (event) => event.stopPropagation());
  elements.charactersButton.addEventListener("click", (event) => {
    event.stopPropagation();
    if (!state.started) showCharacterList();
  });
  elements.settingsButton.addEventListener("pointerup", (event) => event.stopPropagation());
  elements.settingsButton.addEventListener("click", (event) => {
    event.stopPropagation();
    if (!state.started) showSettings();
  });
  elements.updateHistoryButton.addEventListener("pointerup", (event) => event.stopPropagation());
  elements.updateHistoryButton.addEventListener("click", (event) => {
    event.stopPropagation();
    if (!state.started) showUpdateHistory();
  });
  elements.confirmStart.addEventListener("click", confirmWarning);
  elements.closeWarning.addEventListener("click", closeWarning);
  elements.characterListBackButton.addEventListener("pointerup", (event) => event.stopPropagation());
  elements.characterListBackButton.addEventListener("click", (event) => { event.stopPropagation(); returnToTitle(); });
  elements.characterDetailBackButton.addEventListener("pointerup", (event) => event.stopPropagation());
  elements.characterDetailBackButton.addEventListener("click", (event) => {
    event.stopPropagation();
    showCharacterList(elements.characterDetailCard.dataset.characterId || "");
  });
  Object.entries(AUDIO_SETTING_CONTROLS).forEach(([category, control]) => {
    control.input.addEventListener("input", (event) => updateAudioVolume(category, event.currentTarget.value));
    control.mute.addEventListener("click", (event) => { event.stopPropagation(); toggleAudioMute(category); });
  });
  elements.resetAudioSettingsButton.addEventListener("click", (event) => { event.stopPropagation(); resetAudioSettings(); });
  elements.autoAdvanceButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      setAutoAdvanceMode(event.currentTarget.dataset.autoAdvanceMode || "off");
    });
  });
  elements.settingsBackButton.addEventListener("click", (event) => { event.stopPropagation(); returnToTitle(); });
  elements.updateHistoryBackButton.addEventListener("click", (event) => { event.stopPropagation(); returnToTitle(); });
  elements.endReturnButton.addEventListener("pointerup", (event) => event.stopPropagation());
  elements.endReturnButton.addEventListener("click", (event) => { event.stopPropagation(); returnToTitle(); });
  elements.game.addEventListener("pointerup", handleInput);
  window.addEventListener("keydown", handleInput);
  window.addEventListener("pointerup", retryMenuBgmAfterGesture, { capture: true });
  window.addEventListener("keydown", retryMenuBgmAfterGesture, { capture: true });
  window.addEventListener("pagehide", () => {
    if (isDevMode) writeDevCheckpoint(DEV_LAST_KEY, false);
    stopAllAudio();
  });

  window.__cursedDiaryTest = Object.freeze({
    parseCsv, splitAssetIds, isAssetId, validateRecords, getStats, advance, requestAdvance,
    getChapterStats: (chapterId) => getStats(state.records.filter((record) => record.chapter_id === chapterId)),
    getState: () => ({ ...state, records: undefined }),
    getCurrentRecord: () => state.records[state.index] ? { ...state.records[state.index] } : null,
    getDiagnostics: () => JSON.parse(JSON.stringify(diagnostics)),
    getPlayerProgress: getPlayerProgressSnapshot,
    getUnlockedCharacterIds: () => getUnlockedCharacters().map((character) => character.id),
    getCharacterViewModel,
    playerProgressKey: PLAYER_PROGRESS_KEY,
    audioSettingsKey: AUDIO_SETTINGS_KEY,
    getAudioSettings: () => ({ ...audioSettings }),
    textSettingsKey: TEXT_SETTINGS_KEY,
    getTextSettings: () => ({ ...textSettings }),
    setAutoAdvanceMode,
    getAutoAdvanceDelay,
    getAutoAdvanceState: () => ({
      mode: textSettings.autoAdvanceMode,
      timerActive: autoAdvanceTimer !== null,
      generation: autoAdvanceGeneration,
      advancing: isAdvancing
    }),
    gameVersion: GAME_VERSION,
    getUpdateHistory: () => UPDATE_HISTORY.map((entry) => ({ ...entry, changes: [...entry.changes] })),
    getVolumeMultiplier,
    getActiveAudio: () => ({ bgm: bgm?.dataset.assetId || null, environment: [...environment.keys()], sfx: activeSfx.size }),
    getMenuState: () => ({
      active: menuMode,
      background: elements.background.style.backgroundImage,
      retryPending: menuBgmRetryPending,
      bgm: bgm ? { id: bgm.dataset.assetId, paused: bgm.paused, currentTime: bgm.currentTime, volume: bgm.volume, loop: bgm.loop } : null
    }),
    getAudioVolumes: () => ({
      bgm: bgm ? { id: bgm.dataset.assetId, volume: bgm.volume, baseVolume: Number(bgm.dataset.baseVolume), scale: getAudioVolumeScale(bgm), loop: bgm.loop, paused: bgm.paused, currentTime: bgm.currentTime } : null,
      environment: [...environment.values()].map((audio) => ({ id: audio.dataset.assetId, volume: audio.volume, baseVolume: Number(audio.dataset.baseVolume), scale: getAudioVolumeScale(audio), loop: audio.loop, paused: audio.paused, currentTime: audio.currentTime })),
      sfx: [...activeSfx].map((audio) => ({ id: audio.dataset.assetId, volume: audio.volume, baseVolume: Number(audio.dataset.baseVolume), scale: getAudioVolumeScale(audio), loop: audio.loop, paused: audio.paused, currentTime: audio.currentTime }))
    }),
    assets: ASSETS,
    dev: isDevMode ? Object.freeze({
      enabled: true,
      manualKey: DEV_MANUAL_KEY,
      lastKey: DEV_LAST_KEY,
      jumpToIndex,
      derivePersistentState,
      getChapterRange,
      getCurrentCheckpoint,
      readCheckpoint: readDevCheckpoint,
      resolveCheckpoint
    }) : null
  });

  renderAudioSettings();
  renderTextSettings();
  renderUpdateHistory();
  showMenuAtmosphere();
  void load();
})();
