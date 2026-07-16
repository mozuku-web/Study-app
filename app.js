'use strict';

// ============================================================
// [1] UTILITIES & GLOBALS & i18n
// ============================================================
const $ = id => document.getElementById(id);

const esc = s => String(s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')
  .replace(/`/g, '&#x60;');

const escJS = s => String(s)
  .replace(/\\/g, '\\\\')
  .replace(/'/g, "\\'")
  .replace(/"/g, '&quot;')
  .replace(/\n/g, '\\n')
  .replace(/\r/g, '');

const clean = html => {
  if (window.DOMPurify) {
    return DOMPurify.sanitize(html);
  }
  const temp = document.createElement('div');
  temp.textContent = html;
  return temp.innerHTML.replace(/&lt;(\/?)(b|i|u|strong|em|br|p|ul|li|h[1-6]|span|div|table|thead|tbody|tr|th|td|mark)(.*?)&gt;/gi, '<$1$2$3>');
};

const safeSet = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch (e) {
    console.error('Storage set error:', e);
  }
};

const safeGet = (k, fb) => {
  try {
    const s = localStorage.getItem(k);
    return s !== null ? JSON.parse(s) : fb;
  } catch (e) {
    return fb;
  }
};

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

const debounce = (fn, ms) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

const extractJSON = t => {
  try {
    const match = t.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    let cleanStr = match ? match[1] : t;
    const firstBrace = cleanStr.indexOf('{');
    const firstBracket = cleanStr.indexOf('[');
    let startIdx = -1;
    
    if (firstBrace !== -1 && firstBracket !== -1) {
      startIdx = Math.min(firstBrace, firstBracket);
    } else if (firstBrace !== -1) {
      startIdx = firstBrace;
    } else if (firstBracket !== -1) {
      startIdx = firstBracket;
    }
    
    if (startIdx !== -1) {
      cleanStr = cleanStr.substring(startIdx);
      const lastBrace = cleanStr.lastIndexOf('}');
      const lastBracket = cleanStr.lastIndexOf(']');
      let endIdx = Math.max(lastBrace, lastBracket);
      if (endIdx !== -1) {
        cleanStr = cleanStr.substring(0, endIdx + 1);
      }
    }
    cleanStr = cleanStr.replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, "");
    return JSON.parse(cleanStr);
  } catch (err) {
    console.error('JSON Parse Error', err);
    return null;
  }
};

// --- i18n (Internationalization) ---
const i18nDict = {
  en: {
    theme_auto: "Auto", header_settings: "Settings", msg_deleted: "Deleted", btn_undo: "Undo",
    title_dashboard: "Overview", btn_display_settings: "Display Settings", btn_sort: "Sort",
    widget_wotd: "Word of the Day", btn_pronounce: "Pronounce", ph_tags: "Tags (comma separated)",
    btn_add_vocab: "Add to Vocab", btn_next_word: "Next Word", widget_countdown: "Countdown",
    btn_edit: "Edit", msg_target_not_set: "Target date not set", widget_monthly_goal: "Monthly Goal",
    widget_yearly_goal: "Yearly Main Goal:", btn_weekly_report: "Weekly Report", btn_weakness_analysis: "Weakness Analysis",
    label_streak_days: "Streak Days", label_total_days: "Total Days", widget_weekly_chart: "Weekly Study Time",
    label_this_week: "This Week", label_last_week: "Last Week", weeks_ago: "weeks ago",
    widget_radar_chart: "Study Balance (Radar Chart)", widget_srs_chart: "Forgetting Curve",
    widget_srs_scatter: "Retention Distribution (Stability)", widget_stability_chart: "Average Retention Trend (Stability)",
    widget_forecast: "Review Forecast", widget_subj_chart: "Study Time by Subject", widget_heatmap: "Study Heatmap (Past 90 Days)",
    opt_study_time: "Study Time", opt_accuracy: "Accuracy", opt_new_words: "New Words",
    day_mon: "Mon", day_tue: "Tue", day_wed: "Wed", day_thu: "Thu", day_fri: "Fri", day_sat: "Sat", day_sun: "Sun",
    month_1: "Jan", month_2: "Feb", month_3: "Mar", month_4: "Apr", month_5: "May", month_6: "Jun",
    month_7: "Jul", month_8: "Aug", month_9: "Sep", month_10: "Oct", month_11: "Nov", month_12: "Dec",
    widget_quick_notes: "Quick Notes", msg_no_notes: "No notes", widget_today_plan: "Today's Plan & Events",
    btn_auto_generate: "Auto Generate", widget_today_log: "Today's Study Log", btn_add: "+ Add",
    title_timer: "Timer", status_stopped: "Stopped", btn_start: "Start", btn_reset: "Reset",
    label_pomodoro: "Pomodoro Mode (25m study + 5m break)", label_ambient_sounds: "White Noise",
    sound_rain: "Rain", sound_forest: "Forest", sound_ocean: "Ocean", label_set_timer: "Set Timer",
    label_min: "min", label_sec: "sec", btn_set: "Set", label_presets: "Presets", btn_save: "Save",
    title_vocab: "Vocabulary", btn_import_words: "+ Import Words", ph_search_word: "Search or enter a word...",
    btn_search: "Search", btn_auto_listen: "Auto-Listen", btn_contextual_story: "Story Generator",
    btn_retention_forecast: "Retention Forecast", btn_add_word: "+ Add Word", btn_print_test: "Print Test",
    btn_export_pdf: "Export PDF", ph_filter_words: "Filter words...", filter_pos: "POS", pos_all: "All",
    pos_noun: "Noun", pos_verb: "Verb", pos_adj: "Adjective", pos_adv: "Adverb", pos_other: "Other",
    filter_progress: "Progress", prog_all: "All", prog_mastered: "Mastered", prog_learning: "Learning", prog_new: "New",
    filter_tag: "Tag", tag_all: "All", btn_manage_tags: "Manage Tags", filter_root: "Root", ph_root: "e.g. pro, port",
    filter_sort: "Sort", sort_newest: "Newest First", sort_oldest: "Oldest First", sort_az: "A-Z", sort_za: "Z-A",
    sort_low_retention: "Lowest Retention (FSRS)", btn_analyze_meta: "Analyze POS & Etymology",
    btn_bulk_tag: "Bulk Tag", btn_reset_progress: "Reset Progress", btn_bulk_delete: "Bulk Delete", btn_load_more: "Load More",
    title_skillup: "Practice", tab_correction: "Correction", tab_daily_tasks: "Daily Tasks", tab_quiz: "Quiz",
    tab_media: "Media", tab_shadowing: "Shadowing", tab_syntax: "Syntax", tab_history: "History",
    msg_ai_correction: "AI analyzes and corrects the syntax of the entered English text or image.",
    mode_text: "Text", mode_file: "File", mode_photo: "Photo", ph_enter_english: "Enter English text or essay...",
    btn_select_file: "[ Select File ]", ph_file_content: "File content", btn_select_photo: "[ Select Photo ]",
    btn_auto_quiz_image: "Auto Generate Quiz from Image", btn_correct: "Correct", btn_parse_syntax: "Parse Syntax",
    btn_paraphrase: "Paraphrase", btn_essay_analysis: "Essay Analysis", dtab_writing: "Writing", dtab_parsing: "Parsing",
    dtab_reading: "Reading", dtab_listening: "Listening", dtab_drill: "Drill", label_difficulty: "Difficulty:",
    diff_basic: "Basic", diff_standard: "Standard", diff_advanced: "Advanced", listen_mc: "Multiple Choice", listen_dict: "Dictation",
    msg_drill_desc: "Automatically generates personalized grammar and vocabulary drills based on past corrections and mistakes.",
    btn_gen_weakness_drill: "Generate Weakness Drill", msg_trick_desc: "Generates \"trick questions\" that are easy to make mistakes based on past mistake trends.",
    btn_gen_trick_drill: "Advanced Drill", label_ai_word_quiz: "AI Word Quiz", quiz_range_all: "From All Words",
    quiz_range_saved: "From Saved", quiz_range_review: "From Review", quiz_count_5: "5 Qs", quiz_count_10: "10 Qs", quiz_count_15: "15 Qs",
    label_include_fill: "Include fill-in-the-blank questions", btn_gen_quiz: "Generate Quiz", label_yt_lesson: "YouTube to Lesson",
    msg_yt_desc: "Generates summaries, translations, and comprehension quizzes from YouTube URLs.", ph_yt_url: "YouTube URL",
    btn_gen_lesson: "Generate Lesson", label_pdf_reader: "PDF / EPUB Reader", msg_pdf_desc: "Read English documents and tap words to look them up in the dictionary and add them to your vocabulary.",
    btn_open_reader: "Open Reader", msg_shadowing_desc: "Visually compare the AI model's audio waveform with your own pronunciation waveform to improve rhythm and intonation.",
    btn_shadowing_studio: "Shadowing", btn_export_syntax_pdf: "Export Syntax PDF", label_add_syntax: "Add Syntax Manually",
    ph_syntax_phrase: "Syntax / Phrase", ph_syntax_meaning: "Meaning / Translation", ph_note: "Note",
    hist_type_all: "All Types", hist_type_correct: "Correction", hist_type_parse: "Parse Syntax", hist_type_para: "Paraphrase",
    hist_type_essay: "Essay", hist_score_all: "All Scores", hist_score_under80: "Under 80", title_decks: "Decks",
    cc_mode_study: "Study", cc_mode_edit: "Edit", cc_mode_manage: "Manage Decks", msg_empty: "Empty.", msg_no_decks: "No decks.",
    btn_prev: "Prev", btn_shuffle: "Shuffle", btn_next: "Next", msg_create_deck: "Please create a deck.", label_gen_ai: "Generate with AI",
    ph_ai_prompt: "e.g. 10 basic high school English words", ph_additional_inst: "Additional instructions", btn_gen_ai: "Generate with AI",
    label_add_manually: "Add Manually", label_create_new: "Create New", ph_deck_name: "Deck Name", btn_create: "Create",
    title_qa_ai: "AI Tutor", subj_japanese: "Japanese", subj_math: "Math", subj_english: "English", subj_science: "Science",
    subj_social: "Social Studies", subj_other: "Other", btn_clear: "Clear", sview_chat: "Chat", sview_saved: "Saved", sview_quiz: "Quiz",
    ph_enter_question: "Enter your question...", ph_additional_comments: "Additional comments...", label_math_ocr: "Generate high-precision OCR and step-by-step explanation for Math/Science",
    btn_send: "Send", folder_all: "All Folders", folder_uncategorized: "Uncategorized", btn_create_folder: "+ Create Folder",
    msg_gen_quiz_history: "Generates review quizzes from saved Q&A history.", title_plan: "Planner", plan_mode_calendar: "Calendar",
    plan_mode_weekly: "Weekly", plan_mode_yearly: "Yearly", plan_mode_gantt: "Gantt Chart", plan_mode_score: "Scores", plan_mode_ai: "AI Chat",
    ph_add_event: "Add event...", label_plan: "Plan", btn_ai_rebuild: "AI Rebuild", ph_add_plan: "Add plan...", ph_time: "Time",
    routine_once: "Once", routine_daily: "Daily", routine_weekly: "Weekly", routine_monthly: "Monthly", label_textbooks: "Textbooks",
    ph_add_textbook: "Add textbook", label_weekly_plan: "Weekly Plan", label_add_plan_tb: "Add to Plan from Textbook",
    ph_page_range: "Page range", label_yearly_main_goal: "Yearly Main Goal", btn_milestone_gen: "Milestone Generator",
    ph_yearly_goal: "e.g. Pass first choice univ, TOEIC 800", label_backcasting: "Backcasting Planner", btn_delay_slide: "Reschedule",
    msg_backcasting_desc: "Enter the target date and the reference books/tasks to be used, and the AI will calculate backwards the number of days until the exam date and automatically register a daily schedule on the calendar.",
    label_target_name: "Target / Exam Name", ph_target_name: "e.g. Final Exam, TOEIC", label_target_date: "Target Date (Deadline)",
    label_tb_range: "Textbooks & Page Range", ph_tb_range: "e.g. Target 1900 1-800\nBlue Chart p10-p50", btn_gen_backcasting: "Generate Backcasting Schedule",
    msg_gen_complete: "Schedule Generation Complete", btn_check_calendar: "Check Calendar", label_profile: "Profile", btn_collapse: "Collapse",
    prof_target_univ: "Target University", prof_grade: "Grade", prof_courses: "Cram School / Courses", btn_simulator: "Simulator",
    btn_custom_exam: "Custom Exam", ph_enter_concerns: "Enter questions or concerns...", label_add_score: "Add Score",
    btn_smart_scan: "Smart Scan", ph_exam_name: "Exam Name", ph_exam_date: "Date (e.g. 2025/01)",
    label_subj_score_dev: "Subject / Score / Deviation", btn_add_subj: "+ Add Subject", label_univ_judgment: "University Judgment",
    btn_add_judgment: "+ Add Judgment", ph_memo: "Memo", btn_save_score: "Save Score", label_graph: "Graph", chart_mode_dev: "Deviation",
    chart_mode_judge: "Judgment", title_mistakes: "Review", mistake_tab_saved: "Saved", mistake_tab_exam: "Exams / Tests",
    mistake_tab_calc: "Calculation Mistakes", mistake_tab_other: "Other", label_filter_tag: "Filter by Tag:", btn_all: "All",
    msg_saved_here: "Saved items will appear here.", label_add_exam_mistake: "Add Exam/Test Mistake", ph_test_name: "Test Name",
    mistake_q_desc: "① Question Description", ph_q_desc: "What was the question?", mistake_wrong_ans: "② Your Wrong Answer",
    ph_wrong_ans: "How did you make a mistake?", mistake_cause_tags: "③ Cause & Tags", ph_reason: "Detailed cause",
    mistake_action: "④ What to do next (Action)", ph_action: "Specific action to prevent the same mistake", label_mistake_trend: "Mistake Trend Analysis",
    btn_gen_root_cause: "Generate AI Root Cause Report", label_add_calc_mistake: "Add Calculation Mistake Record", label_add_other_mistake: "Add Other Mistake Record",
    title_settings: "Settings", label_language: "Language Settings", opt_lang_mixed: "Mixed (UI: English / AI: Japanese)",
    opt_lang_en: "English", opt_lang_ja: "Japanese", label_api_key: "Gemini API Key", ph_api_key: "Enter API Key",
    msg_api_key_local: "※ Saved locally only.", label_manage_data: "Manage Study Data", btn_view_logs: "View / Edit Study Logs",
    label_weekly_goal_time: "Weekly Goal Time by Subject (min)", label_auto_backup: "Auto Backup & Restore", msg_auto_backup: "Data from the past 7 days is automatically saved.",
    btn_restore: "Restore", btn_create_backup: "Create Backup Now", label_dash_display: "Dashboard Display Settings",
    btn_open_widget_settings: "Open Widget Settings", msg_dash_display: "You can toggle the items displayed on the dashboard.",
    label_layout_settings: "Layout Settings", opt_1col: "1 Column Display", opt_2col: "2 Column Display (PC/Tablet Recommended)",
    label_customize_text: "Customize Display Text", btn_change_text: "Change Text", btn_reset_default: "Reset to Default",
    label_theme_color: "Theme Color", theme_default: "Default", theme_red: "Red", theme_blue: "Blue", theme_green: "Green",
    theme_orange: "Orange", theme_purple: "Purple", theme_teal: "Teal", theme_indigo: "Indigo", theme_gray: "Gray",
    label_custom_color: "Custom Color Settings", msg_custom_color: "Choose your accent color", label_dark_schedule: "Dark Mode Schedule Settings",
    label_toggle_dark_schedule: "Toggle dark mode by time", label_font_size: "Font Size Settings", font_small: "Small",
    font_medium: "Medium (Default)", font_large: "Large", label_fsrs_settings: "FSRS Settings", label_target_retention: "Target Retention Rate",
    msg_fsrs_desc: "Higher value increases review frequency.", label_auto_optimize: "Auto-optimize FSRS Parameters",
    label_gemini_model: "Gemini Model Selection", opt_custom_model: "Custom (Enter manually)", btn_fetch_api: "Fetch API",
    ph_custom_model: "Enter model name (e.g. gemini-4.0-pro)", label_reminder: "Reminder Settings (Push Notifications)",
    btn_set_allow: "Set / Allow", status_not_set: "Not Set", label_cloud_sync: "Cloud Sync (Firebase Auth)", status_checking: "Checking...",
    btn_push: "Push (Save)", btn_pull: "Pull (Load)", btn_auto_sync: "Auto Sync (Real-time): OFF", label_export: "Export",
    btn_export_json: "JSON", btn_export_csv: "CSV (Vocab)", label_data_reset: "Data Reset", btn_reset_all: "Reset All",
    msg_reset_all: "All data will be erased. Please enter \"reset all\".", btn_cancel: "Cancel", btn_execute: "Execute",
    ph_quick_note: "Enter note quickly...", btn_save_inbox: "Save to Inbox", ph_english_word: "English Word (Required)",
    ph_meaning_ai: "Meaning (Leave blank for AI)", pos_select: "Select POS...", ph_example_opt: "Example (Optional)",
    ph_note_opt: "Note / Etymology (Optional)", label_manual_fsrs: "Manual FSRS Data Adjustment", title_log_list: "Study Log List",
    title_edit_log: "Edit Study Log", ph_min: "min", title_import: "Import", msg_import_text: "You can paste text copied from Quizlet's \"Export\" directly.",
    msg_import_url: "Enter a YouTube URL to extract summary and key expressions from subtitles.", label_extract_context: "Extract context (example sentences) from original text",
    ph_url: "URL or YouTube Link", btn_ai_extract: "AI Extract", msg_import_url_fallback: "※ If subtitles cannot be retrieved, please paste the text manually.",
    ph_paste_transcript: "Paste transcript text here...", btn_extract_text: "Extract from Text", msg_import_photo: "Take a photo of a textbook or long text, and AI will extract words.",
    label_unknown_only: "Extract only unknown (unregistered) words", label_bulk_tags: "Bulk Add Tags", ph_bulk_tags: "e.g. TOEIC, Chapter1",
    label_duplicate_handling: "Duplicate Handling", opt_skip: "Skip existing words (Add new only)", opt_overwrite: "Overwrite existing words",
    opt_merge: "Merge meanings and tags", label_ai_fill: "Auto-fill meaning, example, POS with AI", btn_execute_add: "Execute Add",
    btn_replace_all: "Replace All Data", title_study_log: "Study Log", label_events: "Events", label_add_study_log: "Add Study Log",
    msg_forecast_desc: "Predicts memory decay if you don't review today based on current learning data.", msg_forecast_note: "※ Predicted values based on FSRS algorithm.",
    title_countdown_settings: "Countdown Settings", msg_auto_listen_desc: "Automatically loops pronunciation, meaning, and example sentences without looking at the screen.",
    btn_start_playback: "Start Playback", label_only_review: "Play only words that need review", msg_story_desc: "Generates a short story incorporating words you are learning or weak at, helping you remember them in context.",
    btn_gen_story: "Generate Story", title_manage_tags: "Bulk Manage Tags", title_shuffle_settings: "Question Algorithm Settings",
    opt_random: "Completely Random", opt_weighted: "Prioritize Weak Words (Weighted)", opt_spaced: "Space out same POS",
    btn_highlight_off: "Highlight: OFF", btn_add_note: "Add Note", msg_no_file: "No file selected", btn_play_model: "Play Model",
    btn_start_recording: "Start Recording", label_model_waveform: "Model Waveform", label_your_waveform: "Your Waveform",
    title_image_crop: "Image Cropping", btn_crop: "Crop", nav_dashboard: "Overview", nav_timer: "Timer", nav_vocab: "Vocabulary",
    nav_skillup: "Practice", nav_decks: "Decks", nav_qa_ai: "AI Tutor", nav_plan: "Planner", nav_mistakes: "Review", nav_settings: "Settings",
    label_goal: "Goal", label_plan: "Plan", label_total: "Total", label_mastered: "Mastered", label_learning: "Learning",
    label_events_suffix: "Events", label_score: "Score", label_dev: "Dev", label_univ: "Univ", label_rank: "Rank",
    btn_create_question: "Create Question", opt_select: "-- Select --", btn_delete: "Delete"
  },
  ja: {
    theme_auto: "自動", header_settings: "設定", msg_deleted: "削除しました", btn_undo: "元に戻す",
    title_dashboard: "ダッシュボード", btn_display_settings: "表示設定", btn_sort: "並び替え",
    widget_wotd: "今日の単語", btn_pronounce: "発音", ph_tags: "タグ (カンマ区切り)",
    btn_add_vocab: "単語帳に追加", btn_next_word: "次の単語", widget_countdown: "カウントダウン",
    btn_edit: "編集", msg_target_not_set: "目標日が設定されていません", widget_monthly_goal: "今月の目標",
    widget_yearly_goal: "年間目標:", btn_weekly_report: "週次レポート", btn_weakness_analysis: "弱点分析",
    label_streak_days: "連続学習日数", label_total_days: "累計学習日数", widget_weekly_chart: "週間学習時間",
    label_this_week: "今週", label_last_week: "先週", weeks_ago: "週間前",
    widget_radar_chart: "学習バランス (レーダーチャート)", widget_srs_chart: "忘却曲線",
    widget_srs_scatter: "定着度分布 (安定度)", widget_stability_chart: "平均定着度推移 (安定度)",
    widget_forecast: "復習予測", widget_subj_chart: "科目別学習時間", widget_heatmap: "学習ヒートマップ (過去90日)",
    opt_study_time: "学習時間", opt_accuracy: "正答率", opt_new_words: "新規単語数",
    day_mon: "月", day_tue: "火", day_wed: "水", day_thu: "木", day_fri: "金", day_sat: "土", day_sun: "日",
    month_1: "1月", month_2: "2月", month_3: "3月", month_4: "4月", month_5: "5月", month_6: "6月",
    month_7: "7月", month_8: "8月", month_9: "9月", month_10: "10月", month_11: "11月", month_12: "12月",
    widget_quick_notes: "クイックメモ", msg_no_notes: "メモがありません", widget_today_plan: "今日の予定と計画",
    btn_auto_generate: "自動生成", widget_today_log: "今日の学習記録", btn_add: "+ 追加",
    title_timer: "タイマー", status_stopped: "停止中", btn_start: "スタート", btn_reset: "リセット",
    label_pomodoro: "ポモドーロモード (25分学習 + 5分休憩)", label_ambient_sounds: "環境音",
    sound_rain: "雨", sound_forest: "森", sound_ocean: "波", label_set_timer: "タイマー設定",
    label_min: "分", label_sec: "秒", btn_set: "設定", label_presets: "プリセット", btn_save: "保存",
    title_vocab: "単語帳", btn_import_words: "+ 単語をインポート", ph_search_word: "単語を検索または入力...",
    btn_search: "検索", btn_auto_listen: "自動再生", btn_contextual_story: "文脈ストーリー",
    btn_retention_forecast: "定着度予測", btn_add_word: "+ 単語を追加", btn_print_test: "テスト印刷",
    btn_export_pdf: "PDF出力", ph_filter_words: "単語を絞り込み...", filter_pos: "品詞", pos_all: "すべて",
    pos_noun: "名詞", pos_verb: "動詞", pos_adj: "形容詞", pos_adv: "副詞", pos_other: "その他",
    filter_progress: "進捗", prog_all: "すべて", prog_mastered: "習得済", prog_learning: "学習中", prog_new: "新規",
    filter_tag: "タグ", tag_all: "すべて", btn_manage_tags: "タグ管理", filter_root: "語根", ph_root: "例: pro, port",
    filter_sort: "並び替え", sort_newest: "新しい順", sort_oldest: "古い順", sort_az: "A-Z", sort_za: "Z-A",
    sort_low_retention: "定着度が低い順 (FSRS)", btn_analyze_meta: "品詞・語源を解析",
    btn_bulk_tag: "一括タグ付け", btn_reset_progress: "進捗リセット", btn_bulk_delete: "一括削除", btn_load_more: "さらに読み込む",
    title_skillup: "演習", tab_correction: "添削", tab_daily_tasks: "デイリー課題", tab_quiz: "クイズ",
    tab_media: "メディア", tab_shadowing: "シャドーイング", tab_syntax: "構文", tab_history: "履歴",
    msg_ai_correction: "AIが入力された英文や画像の構文を解析・添削します。",
    mode_text: "テキスト", mode_file: "ファイル", mode_photo: "写真", ph_enter_english: "英文やエッセイを入力...",
    btn_select_file: "[ ファイルを選択 ]", ph_file_content: "ファイル内容", btn_select_photo: "[ 写真を選択 ]",
    btn_auto_quiz_image: "画像からクイズを自動生成", btn_correct: "添削", btn_parse_syntax: "構文解析",
    btn_paraphrase: "言い換え", btn_essay_analysis: "エッセイ評価", dtab_writing: "ライティング", dtab_parsing: "和訳",
    dtab_reading: "長文読解", dtab_listening: "リスニング", dtab_drill: "ドリル", label_difficulty: "難易度:",
    diff_basic: "基礎", diff_standard: "標準", diff_advanced: "応用", listen_mc: "4択問題", listen_dict: "ディクテーション",
    msg_drill_desc: "過去の添削やミスに基づき、パーソナライズされた文法・語彙ドリルを自動生成します。",
    btn_gen_weakness_drill: "弱点克服ドリル生成", msg_trick_desc: "過去のミス傾向から、あえて間違えやすい「ひっかけ問題」を生成します。",
    btn_gen_trick_drill: "ハードコアドリル", label_ai_word_quiz: "AI単語クイズ", quiz_range_all: "すべての単語から",
    quiz_range_saved: "保存した単語から", quiz_range_review: "復習対象から", quiz_count_5: "5問", quiz_count_10: "10問", quiz_count_15: "15問",
    label_include_fill: "穴埋め問題を含める", btn_gen_quiz: "クイズ生成", label_yt_lesson: "YouTubeからレッスン生成",
    msg_yt_desc: "YouTubeのURLから要約、翻訳、理解度クイズを生成します。", ph_yt_url: "YouTube URL",
    btn_gen_lesson: "レッスン生成", label_pdf_reader: "PDF / EPUB リーダー", msg_pdf_desc: "英語のドキュメントを読みながら、単語をタップして辞書引き・単語帳に追加できます。",
    btn_open_reader: "リーダーを開く", msg_shadowing_desc: "AIモデルの音声波形と自分の発音波形を視覚的に比較し、リズムやイントネーションを改善します。",
    btn_shadowing_studio: "シャドーイング", btn_export_syntax_pdf: "構文PDF出力", label_add_syntax: "構文を手動追加",
    ph_syntax_phrase: "構文 / フレーズ", ph_syntax_meaning: "意味 / 和訳", ph_note: "メモ",
    hist_type_all: "すべての種類", hist_type_correct: "添削", hist_type_parse: "構文解析", hist_type_para: "言い換え",
    hist_type_essay: "エッセイ", hist_score_all: "すべてのスコア", hist_score_under80: "80点未満", title_decks: "デッキ",
    cc_mode_study: "学習", cc_mode_edit: "編集", cc_mode_manage: "デッキ管理", msg_empty: "空です。", msg_no_decks: "デッキがありません。",
    btn_prev: "前へ", btn_shuffle: "シャッフル", btn_next: "次へ", msg_create_deck: "デッキを作成してください。", label_gen_ai: "AIで生成",
    ph_ai_prompt: "例: 高校基礎レベルの英単語10個", ph_additional_inst: "追加の指示", btn_gen_ai: "AIで生成",
    label_add_manually: "手動で追加", label_create_new: "新規作成", ph_deck_name: "デッキ名", btn_create: "作成",
    title_qa_ai: "AIチューター", subj_japanese: "国語", subj_math: "数学", subj_english: "英語", subj_science: "理科",
    subj_social: "社会", subj_other: "その他", btn_clear: "クリア", sview_chat: "チャット", sview_saved: "保存済", sview_quiz: "クイズ",
    ph_enter_question: "質問を入力...", ph_additional_comments: "追加のコメント...", label_math_ocr: "数式・理科の高精度OCRとステップバイステップ解説を生成",
    btn_send: "送信", folder_all: "すべてのフォルダ", folder_uncategorized: "未分類", btn_create_folder: "+ フォルダ作成",
    msg_gen_quiz_history: "保存したQ&A履歴から復習クイズを生成します。", title_plan: "学習計画", plan_mode_calendar: "カレンダー",
    plan_mode_weekly: "週間", plan_mode_yearly: "年間", plan_mode_gantt: "ガントチャート", plan_mode_score: "成績", plan_mode_ai: "AI相談",
    ph_add_event: "予定を追加...", label_plan: "計画", btn_ai_rebuild: "AI再構築", ph_add_plan: "計画を追加...", ph_time: "時間",
    routine_once: "1回のみ", routine_daily: "毎日", routine_weekly: "毎週", routine_monthly: "毎月", label_textbooks: "参考書",
    ph_add_textbook: "参考書を追加", label_weekly_plan: "週間計画", label_add_plan_tb: "参考書から計画に追加",
    ph_page_range: "ページ範囲", label_yearly_main_goal: "年間目標", btn_milestone_gen: "マイルストーン生成",
    ph_yearly_goal: "例: 第一志望合格、TOEIC 800点", label_backcasting: "バックキャスティングプランナー", btn_delay_slide: "遅れスライド",
    msg_backcasting_desc: "目標日と使用する参考書・タスクを入力すると、AIが試験日までの日数を逆算し、カレンダーに毎日のスケジュールを自動登録します。",
    label_target_name: "目標 / 試験名", ph_target_name: "例: 期末テスト、TOEIC", label_target_date: "目標日 (期限)",
    label_tb_range: "参考書とページ範囲", ph_tb_range: "例: ターゲット1900 1〜800語\n青チャート p10-p50", btn_gen_backcasting: "逆算スケジュール生成",
    msg_gen_complete: "スケジュール生成完了", btn_check_calendar: "カレンダーを確認", label_profile: "プロフィール", btn_collapse: "折りたたむ",
    prof_target_univ: "志望校", prof_grade: "学年", prof_courses: "塾 / 受講コース", btn_simulator: "シミュレーター",
    btn_custom_exam: "カスタム模試", ph_enter_concerns: "質問や相談を入力...", label_add_score: "成績追加",
    btn_smart_scan: "スマートスキャン (成績表)", ph_exam_name: "模試名", ph_exam_date: "日付 (例: 2025/01)",
    label_subj_score_dev: "科目 / 点数 / 偏差値", btn_add_subj: "+ 科目追加", label_univ_judgment: "志望校判定",
    btn_add_judgment: "+ 判定追加", ph_memo: "メモ", btn_save_score: "成績を保存", label_graph: "グラフ", chart_mode_dev: "偏差値",
    chart_mode_judge: "判定", title_mistakes: "復習", mistake_tab_saved: "保存済", mistake_tab_exam: "模試 / テスト",
    mistake_tab_calc: "計算ミス", mistake_tab_other: "その他", label_filter_tag: "タグで絞り込み:", btn_all: "すべて",
    msg_saved_here: "保存された項目がここに表示されます。", label_add_exam_mistake: "テストのミスを追加", ph_test_name: "テスト名",
    mistake_q_desc: "① どのような問題でしたか？", ph_q_desc: "問題の概要", mistake_wrong_ans: "② どのように間違えましたか？",
    ph_wrong_ans: "誤答の内容", mistake_cause_tags: "③ 原因とタグ", ph_reason: "具体的な原因を深掘り",
    mistake_action: "④ 次にどうするか (アクション)", ph_action: "同じミスを防ぐための具体的なアクション", label_mistake_trend: "ミス傾向分析",
    btn_gen_root_cause: "AI根本原因レポート生成", label_add_calc_mistake: "計算ミスの記録を追加", label_add_other_mistake: "その他のミスの記録を追加",
    title_settings: "設定", label_language: "言語設定", opt_lang_mixed: "ミックス (UI: 英語 / AI: 日本語)",
    opt_lang_en: "英語", opt_lang_ja: "日本語", label_api_key: "Gemini API Key", ph_api_key: "API Keyを入力",
    msg_api_key_local: "※ ローカルにのみ保存されます。", label_manage_data: "学習データ管理", btn_view_logs: "学習記録の確認 / 編集",
    label_weekly_goal_time: "科目別 週間目標時間 (分)", label_auto_backup: "自動バックアップと復元", msg_auto_backup: "過去7日間のデータが自動的に保存されます。",
    btn_restore: "復元", btn_create_backup: "今すぐバックアップ作成", label_dash_display: "ダッシュボード表示設定",
    btn_open_widget_settings: "ウィジェット設定を開く", msg_dash_display: "ダッシュボードに表示する項目を切り替えられます。",
    label_layout_settings: "レイアウト設定", opt_1col: "1カラム表示", opt_2col: "2カラム表示 (PC/タブレット推奨)",
    label_customize_text: "表示テキストのカスタマイズ", btn_change_text: "テキスト変更", btn_reset_default: "デフォルトに戻す",
    label_theme_color: "テーマカラー", theme_default: "デフォルト", theme_red: "レッド", theme_blue: "ブルー", theme_green: "グリーン",
    theme_orange: "オレンジ", theme_purple: "パープル", theme_teal: "ティール", theme_indigo: "インディゴ", theme_gray: "グレー",
    label_custom_color: "カスタムカラー設定", msg_custom_color: "アクセントカラーを自由に選択", label_dark_schedule: "ダークモード スケジュール設定",
    label_toggle_dark_schedule: "時間帯でダークモードを切り替える", label_font_size: "フォントサイズ設定", font_small: "小",
    font_medium: "中 (デフォルト)", font_large: "大", label_fsrs_settings: "FSRS設定", label_target_retention: "目標定着率",
    msg_fsrs_desc: "高くすると復習頻度が増え、低くすると減ります。", label_auto_optimize: "FSRSパラメータを自動最適化する",
    label_gemini_model: "Geminiモデル選択", opt_custom_model: "カスタム (手動入力)", btn_fetch_api: "APIから取得",
    ph_custom_model: "モデル名を入力 (例: gemini-4.0-pro)", label_reminder: "リマインダー設定 (プッシュ通知)",
    btn_set_allow: "設定 / 許可", status_not_set: "未設定", label_cloud_sync: "クラウド同期 (Firebase Auth)", status_checking: "確認中...",
    btn_push: "プッシュ (保存)", btn_pull: "プル (読込)", btn_auto_sync: "自動同期 (リアルタイム): OFF", label_export: "エクスポート",
    btn_export_json: "JSON", btn_export_csv: "CSV (単語帳)", label_data_reset: "データリセット", btn_reset_all: "すべてリセット",
    msg_reset_all: "全てのデータを消去します。「reset all」と入力してください。", btn_cancel: "キャンセル", btn_execute: "実行",
    ph_quick_note: "素早くメモを入力...", btn_save_inbox: "インボックスに保存", ph_english_word: "英単語 (必須)",
    ph_meaning_ai: "意味 (空欄でAIが自動補完)", pos_select: "品詞を選択...", ph_example_opt: "例文 (任意)",
    ph_note_opt: "メモ / 語源 (任意)", label_manual_fsrs: "FSRSデータの手動調整", title_log_list: "学習記録リスト",
    title_edit_log: "学習記録の編集", ph_min: "分", title_import: "インポート", msg_import_text: "Quizletの「エクスポート」でコピーしたテキストをそのまま貼り付けてインポートできます。",
    msg_import_url: "YouTubeのURLを入力すると、字幕から要約と重要表現を抽出します。", label_extract_context: "元の文章から文脈（例文）を抽出する",
    ph_url: "URL または YouTubeリンク", btn_ai_extract: "AI抽出", msg_import_url_fallback: "※ 字幕が取得できない場合は、手動でテキストを貼り付けてください。",
    ph_paste_transcript: "ここにスクリプトを貼り付け...", btn_extract_text: "テキストから抽出", msg_import_photo: "教科書や長文の写真を撮ると、AIが単語を抽出します。",
    label_unknown_only: "知らない単語（未登録）のみを抽出する", label_bulk_tags: "一括タグ追加", ph_bulk_tags: "例: TOEIC, Chapter1",
    label_duplicate_handling: "重複時の処理", opt_skip: "既存の単語をスキップ (新規のみ追加)", opt_overwrite: "既存の単語を上書き",
    opt_merge: "意味とタグをマージ", label_ai_fill: "AIで意味・例文・品詞を自動補完する", btn_execute_add: "追加を実行",
    btn_replace_all: "すべてのデータを置き換え", title_study_log: "学習記録", label_events: "予定", label_add_study_log: "学習記録を追加",
    msg_forecast_desc: "現在の学習データに基づき、今日復習しなかった場合の記憶の減衰を予測します。", msg_forecast_note: "※ FSRSアルゴリズムに基づく予測値です。",
    title_countdown_settings: "カウントダウン設定", msg_auto_listen_desc: "画面を見ずに、発音・意味・例文を自動でループ再生します。",
    btn_start_playback: "再生開始", label_only_review: "復習が必要な単語のみ再生する", msg_story_desc: "学習中や苦手な単語を組み込んだ短いストーリーを生成し、文脈の中で記憶に定着させます。",
    btn_gen_story: "ストーリー生成", title_manage_tags: "タグの一括管理", title_shuffle_settings: "出題アルゴリズム設定",
    opt_random: "完全ランダム", opt_weighted: "苦手な単語を優先 (重み付け)", opt_spaced: "同じ品詞が連続しないようにする",
    btn_highlight_off: "ハイライト: OFF", btn_add_note: "メモ追加", msg_no_file: "ファイルが選択されていません", btn_play_model: "お手本を再生",
    btn_start_recording: "録音開始", label_model_waveform: "お手本の波形", label_your_waveform: "あなたの波形",
    title_image_crop: "画像の切り抜き", btn_crop: "切り抜き", nav_dashboard: "概要", nav_timer: "タイマー", nav_vocab: "単語帳",
    nav_skillup: "演習", nav_decks: "デッキ", nav_qa_ai: "AIチューター", nav_plan: "計画", nav_mistakes: "復習", nav_settings: "設定",
    label_goal: "目標", label_plan: "計画", label_total: "合計", label_mastered: "習得済", label_learning: "学習中",
    label_events_suffix: "の予定", label_score: "点数", label_dev: "偏差値", label_univ: "志望校", label_rank: "判定",
    btn_create_question: "問題を作成", opt_select: "-- 選択 --", btn_delete: "削除"
  }
};

let currentLang = safeGet('study_language', 'mixed');
let customTexts = safeGet('study_custom_texts', {});

const getUiLang = () => (currentLang === 'ja') ? 'ja' : 'en';
const getPromptLang = () => (currentLang === 'en') ? 'en' : 'ja';

const t = (key) => {
  if (customTexts[key]) return customTexts[key];
  return i18nDict[getUiLang()][key] || key;
};

window.changeLanguage = () => {
  const sel = $('language-select');
  if (sel) {
    currentLang = sel.value;
    safeSet('study_language', currentLang);
    applyLanguage();
    if (typeof renderDashboard === 'function') renderDashboard();
    if (typeof renderWeeklyPlan === 'function') renderWeeklyPlan();
    if (typeof renderPlanCalendar === 'function') renderPlanCalendar();
  }
};

const applyLanguage = () => {
  const dict = i18nDict[getUiLang()];
  
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (customTexts[key]) {
      el.textContent = customTexts[key];
    } else if (dict[key]) {
      el.textContent = dict[key];
    }
  });
  
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (dict[key]) el.placeholder = dict[key];
  });
};

let toastQueue = [];
let isToastShowing = false;

const showToast = msg => {
  toastQueue.push(msg);
  if (!isToastShowing) {
    processToastQueue();
  }
};

const processToastQueue = () => {
  if (toastQueue.length === 0) {
    isToastShowing = false;
    return;
  }
  isToastShowing = true;
  const msg = toastQueue.shift();
  const tEl = $('toast');
  if (!tEl) return;
  
  tEl.textContent = msg;
  tEl.classList.add('show');
  
  setTimeout(() => {
    tEl.classList.remove('show');
    setTimeout(processToastQueue, 300);
  }, 2200);
};

let undoTimeout = null;
let pendingUndoAction = null;

const showUndoSnackbar = (msg, undoFn, commitFn) => {
  if (pendingUndoAction && pendingUndoAction.commit) {
    pendingUndoAction.commit();
  }
  pendingUndoAction = { undo: undoFn, commit: commitFn };
  const sb = $('undo-snackbar');
  if (!sb) return;
  
  $('undo-message').textContent = msg;
  sb.classList.add('show');
  clearTimeout(undoTimeout);
  
  undoTimeout = setTimeout(() => {
    if (pendingUndoAction && pendingUndoAction.commit) {
      pendingUndoAction.commit();
    }
    pendingUndoAction = null;
    sb.classList.remove('show');
  }, 5000);
};

window.addEventListener('DOMContentLoaded', () => {
  const undoBtn = $('undo-btn');
  if (undoBtn) {
    undoBtn.onclick = () => {
      if (pendingUndoAction && pendingUndoAction.undo) {
        pendingUndoAction.undo();
        pendingUndoAction = null;
      }
      clearTimeout(undoTimeout);
      $('undo-snackbar').classList.remove('show');
    };
  }
});

const autoResize = el => {
  if (!el) return;
  const scrollY = window.scrollY;
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  window.scrollTo(0, scrollY);
};

const printHtml = (html) => {
  let iframe = $('print-iframe');
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = 'print-iframe';
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
  }
  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();
  iframe.onload = () => {
    iframe.contentWindow.focus();
    setTimeout(() => iframe.contentWindow.print(), 500);
  };
};

const getTodayWeekIdx = () => (new Date().getDay() + 6) % 7;

const todayDateStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const copyText = (txt, btn) => {
  navigator.clipboard.writeText(txt).then(() => {
    if (btn) {
      btn.classList.add('copied');
      const old = btn.textContent;
      btn.textContent = 'Copied';
      setTimeout(() => btn.textContent = old, 1800);
    }
    showToast('Copied');
  }).catch(() => {
    showToast('Failed');
  });
};

const getTotalStudySeconds = () => studyLogs.reduce((a, l) => a + l.seconds, 0);

const openModal = id => {
  $(id).classList.add('open');
  document.body.classList.add('modal-open-locked');
  history.pushState({ modal: id }, '');
};

const closeModal = id => {
  $(id).classList.remove('open');
  if (!document.querySelector('.modal-overlay.open')) {
    document.body.classList.remove('modal-open-locked');
  }
  if (id === 'image-crop-modal' && cropperInstance) {
    cropperInstance.destroy();
    cropperInstance = null;
    cropTargetCallback = null;
  }
  if (history.state && history.state.modal === id) {
    history.back();
  }
};

window.addEventListener('popstate', () => {
  document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
  document.body.classList.remove('modal-open-locked');
});

const resizeImage = (file, maxWidth = 1024, maxHeight = 1024, skipResize = false) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (skipResize) {
        resolve(e.target.result);
        return;
      }
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        if (w > maxWidth) {
          h = Math.round((h * maxWidth) / w);
          w = maxWidth;
        }
        if (h > maxHeight) {
          w = Math.round((w * maxHeight) / h);
          h = maxHeight;
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

let cropperInstance = null;
let cropTargetCallback = null;

window.openImageCropper = (file, callback) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const imgEl = $('image-crop-target');
    if (!imgEl) return;
    imgEl.src = e.target.result;
    openModal('image-crop-modal');
    if (cropperInstance) {
      cropperInstance.destroy();
    }
    cropperInstance = new Cropper(imgEl, {
      viewMode: 1,
      autoCropArea: 1,
      background: false
    });
    cropTargetCallback = callback;
  };
  reader.readAsDataURL(file);
};

window.applyImageCrop = () => {
  if (!cropperInstance || !cropTargetCallback) return;
  const canvas = cropperInstance.getCroppedCanvas({ maxWidth: 1024, maxHeight: 1024 });
  const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
  cropTargetCallback(dataUrl);
  closeModal('image-crop-modal');
  cropperInstance.destroy();
  cropperInstance = null;
  cropTargetCallback = null;
};

const renderMath = (el) => {
  if (window.renderMathInElement && el) {
    renderMathInElement(el, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false },
        { left: '\\(', right: '\\)', display: false },
        { left: '\\[', right: '\\]', display: true }
      ],
      throwOnError: false
    });
  }
};

const handleApiError = (e, containerId) => {
  const c = $(containerId);
  if (!c) return;
  let msg = '通信エラーが発生しました。';
  if (!navigator.onLine) {
    msg = 'オフラインです。ネットワーク接続を確認してください。';
  } else if (e.message.includes('API Key') || e.message.includes('401')) {
    msg = 'API Keyが未設定か無効です。Settingsタブで設定してください。';
  } else if (e.message.includes('429')) {
    msg = 'APIの利用制限に達しました。しばらく待ってから再試行してください。';
  } else if (e.message.includes('400')) {
    msg = 'リクエストが不正です。画像サイズが大きすぎるか、テキストが長すぎる可能性があります。';
  }
  c.innerHTML = `<div class="card text-danger font-bold">${esc(msg)}</div>`;
};

// ============================================================
// [2] CONSTANTS & STATE
// ============================================================
const BASE_SYSTEM_PROMPT = `あなたはプロの予備校講師だ。客観的かつ簡潔な参考書スタイルで出力せよ。
【絶対ルール】
1. 語尾は必ず「〜だ」「〜である」に統一すること。「〜です」「〜ます」は使用禁止。
2. 挨拶、語りかけ、前置き、後書き、解説以外の余分なテキストは一切出力しないこと。
3. 絵文字や顔文字は使用禁止。
4. 括弧は「」を使用し、『』は使用しないこと。
5. HTMLを出力する場合は、必ず <h4>, <p>, <ul>, <li>, <b>, <strong>, <mark> のみを使用し、独自のクラス名やインラインスタイルは付与しないこと。
6. JSONを出力する場合は、Markdownのコードブロック(\`\`\`json)で囲まず、純粋なJSON文字列のみを出力すること。`;

const TABS = ['Dashboard', 'Timer', 'Vocab', 'SkillUp', 'CustomCards', 'Subject', 'Plan', 'Mistakes', 'Manage'];
const ACCENTS = ['en_US', 'en_GB', 'en_AU'];
const ACCENT_LABELS = { en_US: 'US English', en_GB: 'UK English', en_AU: 'AU English' };

const SCORE_SUBJECTS = {
  japanese: { get label() { return t('subj_japanese'); }, details: ['Modern', 'Classical', 'Chinese', 'Comprehensive'] },
  math: { get label() { return t('subj_math'); }, details: ['Math I・A', 'Math II・B', 'Math III・C', 'Comprehensive'] },
  english: { get label() { return t('subj_english'); }, details: ['Reading', 'Listening', 'Writing', 'Comprehensive'] },
  science: { get label() { return t('subj_science'); }, details: ['Physics', 'Chemistry', 'Biology', 'Earth Science', 'Basic', 'Comprehensive'] },
  social: { get label() { return t('subj_social'); }, details: ['History', 'Geography', 'Public', 'Ethics', 'Politics', 'Comprehensive'] },
  other: { get label() { return t('subj_other'); }, details: ['Info', 'Comprehensive'] },
  total: { get label() { return t('label_total'); }, details: ['Humanities', 'Science', 'Overall'] }
};

const ACADEMIC_YEAR_MONTHS = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];
const VOCAB_PER_PAGE = 50;

const THEMES = {
  default: { accent: '#0F172A', streak: '#F97316' },
  red: { accent: '#EF4444', streak: '#B91C1C' },
  blue: { accent: '#3B82F6', streak: '#1D4ED8' },
  green: { accent: '#10B981', streak: '#047857' },
  orange: { accent: '#F97316', streak: '#C2410C' },
  purple: { accent: '#8B5CF6', streak: '#6D28D9' },
  teal: { accent: '#14B8A6', streak: '#0F766E' },
  indigo: { accent: '#6366F1', streak: '#4338CA' },
  gray: { accent: '#64748B', streak: '#475569' }
};

let ALL_WORDS = [];
let savedWords = [];
let plans = {};
let events = {};
let writingHistory = [];
let subjectSaved = [];
let subjectQuizzes = [];
let examScores = [];
let textbooks = [];
let srsData = {};
let userProfile = {
  targetUniv: '',
  grade: '',
  courses: '',
  autoSync: false,
  reminderTime: '',
  fsrsAutoOptimize: true,
  freezeItems: 0,
  themeColor: 'default',
  customThemeColor: ''
};
let customDecks = [];
let wordProgress = {};
let vocabMeta = {};
let dailyChallenges = [];
let syntaxList = [];
let listenHistory = [];
let studyLogs = [];
let freezeLogs = [];
let examMistakes = [];
let calcMistakes = [];
let otherMistakes = [];
let subjectFolders = [];

let goalTimes = safeGet('study_goal_times', { english: 0, math: 0, japanese: 0, science: 0, social: 0, other: 0 });
let yearlyPlan = { year: new Date().getFullYear(), goal: '', months: {} };
let countdownData = safeGet('study_countdown', { name: '', date: '' });
let quickCaptures = safeGet('study_quick_captures', []);
let currentTabIndex = 0;
let timerPresets = safeGet('study_timer_presets', [1500, 3000]);
let darkThemeMode = safeGet('study_dark_mode', 'auto');
let fsrsRetention = safeGet('study_fsrs_retention', 90);
let cachedWotd = safeGet('study_wotd_cache', { date: '', word: null, exampleHtml: '', meaning: '' });
let activeWidgets = safeGet('study_active_widgets', ['wotd', 'countdown', 'yearly', 'actions', 'streak', 'weekly-chart', 'radar-chart', 'srs-chart', 'srs-scatter', 'stability-chart', 'subj-chart', 'heatmap', 'calendar', 'quick-capture-inbox', 'today-plan', 'today-log']);
let widgetColumnMode = safeGet('study_widget_column_mode', '1');
let shuffleSettings = safeGet('study_shuffle_settings', { mode: 'random' });

let reminderCheckInt = null;
let swipeStartX = 0;
let swipeStartY = 0;
let _audioUnlocked = false;
let mBtn = null;
let rec = null;
let aInp = null;

let dashSubjChart = null;
let dashSrsChart = null;
let dashSrsScatter = null;
let wordRetentionChart = null;
let dashWeeklyChart = null;
let simulationChart = null;
let dashRadarChart = null;
let dashStabilityChart = null;
let mistakeRadarChart = null;

let weaknessWords = [];
let vocabPosFilter = 'all';
let vocabProgFilter = 'all';
let vocabTagFilter = 'all';
let vocabPrefixFilter = '';
let vocabPage = 1;

let timerInt = null;
let timerTime = 25 * 60;
let timerInitial = 25 * 60;
let timerRunning = false;
let timerEndTime = 0;
let isPomodoroMode = false;
let isPomodoroBreak = false;

let audioCtx = null;
let masterCompressor = null;
let activeNoises = { rain: false, forest: false, ocean: false };
let noiseNodes = { rain: null, forest: null, ocean: null };
let noiseVolumes = { rain: 0.5, forest: 0.5, ocean: 0.5 };

let planMode = 'calendar';
let currentPlanMonth = new Date().getMonth() + 1;
let currentWeekDay = 0;
let pCalYear = new Date().getFullYear();
let pCalMonth = new Date().getMonth();
let selectedPlanDate = todayDateStr();
let dashCalYear = new Date().getFullYear();
let dashCalMonth = new Date().getMonth();
let dashWeeklyOffset = 0;
let planWeeklyOffset = 0;
let planAiHistory = [];
let scoreLineChart = null;
let scoreChartMode = 'dev';

let wInputMode = 'text';
let wPhotoData = null;
let currentDailyTab = 'comp';
let currentListenMode = 'mc';
let activeQuizList = [];
let activeQuizIndex = 0;
let quizScore = 0;

let ccDeckId = null;
let ccMode = 'study';
let ccList = [];
let ccIdx = 0;
let ccAiMode = 'text';
let ccAiFileData = '';
let ccAiPhotoData = null;

let curSubj = 'japanese';
let subjHist = {};
let sqMode = 'text';
let sqFileData = '';
let sqPhotoData = null;

let curImpTab = 'file';
let impWords = [];
let currentLogDate = null;
let cardList = [];
let currentCardIdx = 0;
let cardsMode = 'all';
let cardVoiceRec = null;
let cardVoiceActive = false;
let autoPlayInt = null;
let apState = 0;
let availableVoices = [];
let searchMicRec = null;

let autoListenInt = null;
let autoListenWords = [];
let autoListenIdx = 0;
let autoListenState = 0;

let shadowingAudioCtx = null;
let shadowingAnalyser = null;
let shadowingDataArray = null;
let shadowingReqAnimFrame = null;

let mistakeTab = 'saved';
let sortableTextbooks = null;

// ============================================================
// [3] STORAGE & SYNC
// ============================================================
let _saveQueue = Promise.resolve();
const safeSave = (key, data) => {
  _saveQueue = _saveQueue.then(() => localforage.setItem(key, data)).catch(e => console.error(e));
  return _saveQueue;
};

const imageStore = localforage.createInstance({ name: 'StudyApp', storeName: 'images' });

const saveImageToDB = async (base64Data) => {
  if (!base64Data) return null;
  const id = 'img_' + generateId();
  await imageStore.setItem(id, base64Data);
  return id;
};

const getImageFromDB = async (id) => {
  if (!id || !id.startsWith('img_')) return id;
  return await imageStore.getItem(id);
};

const save = {
  words: () => safeSave('study_words', ALL_WORDS),
  saved: () => safeSave('study_saved', savedWords),
  plans: () => safeSave('study_plans', plans),
  events: () => safeSave('study_events', events),
  writing: () => safeSave('study_writing', writingHistory.slice(0, 100)),
  subSaved: () => safeSave('study_subject_saved', subjectSaved),
  subQuiz: () => safeSave('study_subject_quizzes', subjectQuizzes),
  exams: () => safeSave('study_exam_scores', examScores),
  books: () => safeSave('study_textbooks', textbooks),
  srs: () => safeSave('study_srs', srsData),
  profile: () => safeSave('study_profile', userProfile),
  decks: () => safeSave('study_custom_decks', customDecks),
  prog: () => safeSave('study_word_progress', wordProgress),
  meta: () => safeSave('study_vocab_meta', vocabMeta),
  daily: () => safeSave('study_daily', dailyChallenges.slice(0, 100)),
  syntax: () => safeSave('study_syntax', syntaxList),
  listen: () => safeSave('study_listen', listenHistory.slice(0, 100)),
  logs: () => safeSave('study_logs', studyLogs),
  yearly: () => safeSave('study_yearly_plan', yearlyPlan),
  freezeLogs: () => safeSave('study_freeze_logs', freezeLogs),
  examMistakes: () => safeSave('study_exam_mistakes', examMistakes),
  calcMistakes: () => safeSave('study_calc_mistakes', calcMistakes),
  otherMistakes: () => safeSave('study_other_mistakes', otherMistakes),
  subjectFolders: () => safeSave('study_subject_folders', subjectFolders)
};

const createAutoBackup = async () => {
  const today = todayDateStr();
  const lastBackup = localStorage.getItem('study_last_backup_date');
  if (lastBackup !== today) {
    const data = {
      ALL_WORDS, savedWords, plans, events, writingHistory, subjectSaved, subjectQuizzes,
      examScores, textbooks, srsData, userProfile, customDecks, wordProgress, vocabMeta,
      dailyChallenges, syntaxList, listenHistory, studyLogs, yearlyPlan, examMistakes,
      calcMistakes, otherMistakes, subjectFolders
    };
    await localforage.setItem('backup_' + today, data);
    localStorage.setItem('study_last_backup_date', today);
    
    const keys = await localforage.keys();
    const backupKeys = keys.filter(k => k.startsWith('backup_')).sort((a, b) => {
      return a.localeCompare(b);
    });
    
    if (backupKeys.length > 7) {
      for (let i = 0; i < backupKeys.length - 7; i++) {
        await localforage.removeItem(backupKeys[i]);
      }
    }
  }
};

window.createManualBackup = async () => {
  await createAutoBackup();
  showToast('Backup created');
  renderBackupList();
};

window.renderBackupList = async () => {
  const sel = $('backup-restore-select');
  if (!sel) return;
  const keys = await localforage.keys();
  const backupKeys = keys.filter(k => k.startsWith('backup_')).sort((a, b) => b.localeCompare(a));
  sel.innerHTML = '<option value="">Select restore point...</option>' + backupKeys.map(k => `<option value="${k}">${k.replace('backup_', '')}</option>`).join('');
};

window.restoreBackup = async () => {
  const sel = $('backup-restore-select');
  if (!sel || !sel.value) return showToast('Please select a restore point');
  if (!confirm(getUiLang() === 'ja' ? '現在のデータは上書きされます。復元しますか？' : 'Current data will be overwritten. Restore?')) return;
  
  const data = await localforage.getItem(sel.value);
  if (data) {
    ALL_WORDS = data.ALL_WORDS || [];
    savedWords = data.savedWords || [];
    plans = data.plans || {};
    events = data.events || {};
    writingHistory = data.writingHistory || [];
    subjectSaved = data.subjectSaved || [];
    subjectQuizzes = data.subjectQuizzes || [];
    examScores = data.examScores || [];
    textbooks = data.textbooks || [];
    srsData = data.srsData || {};
    userProfile = data.userProfile || userProfile;
    customDecks = data.customDecks || [];
    wordProgress = data.wordProgress || {};
    vocabMeta = data.vocabMeta || {};
    dailyChallenges = data.dailyChallenges || [];
    syntaxList = data.syntaxList || [];
    listenHistory = data.listenHistory || [];
    studyLogs = data.studyLogs || [];
    yearlyPlan = data.yearlyPlan || yearlyPlan;
    examMistakes = data.examMistakes || [];
    calcMistakes = data.calcMistakes || [];
    otherMistakes = data.otherMistakes || [];
    subjectFolders = data.subjectFolders || [];
    
    Object.values(save).forEach(f => f());
    showToast('Restored. Reloading...');
    setTimeout(() => location.reload(), 1500);
  } else {
    showToast('Failed to load backup data');
  }
};

const initFirebaseSafe = () => {
  try {
    const firebaseConfig = {
      apiKey: "AIzaSyBbIaem_gtmb9Qjt95loeAAa-ymBwP6rSM",
      authDomain: "study-app-faf25.firebaseapp.com",
      projectId: "study-app-faf25",
      storageBucket: "study-app-faf25.firebasestorage.app",
      messagingSenderId: "282913543801",
      appId: "1:282913543801:web:8e5f73aa46bcce613ca6a8"
    };
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    window._db = firebase.firestore();
    window._auth = firebase.auth();
    
    const login = () => window._auth.signInWithPopup(new firebase.auth.GoogleAuthProvider())
      .then(() => showToast('Login complete'))
      .catch((e) => { console.error(e); showToast('Login error: ' + e.message); });
      
    const logout = () => window._auth.signOut().then(() => showToast('Logout complete'));
    
    window._auth.onAuthStateChanged(u => {
      const st = $('firebase-login-status');
      const btn = $('firebase-auth-btn');
      if (st && btn) {
        if (u) {
          st.textContent = 'Logged in: ' + u.email;
          btn.textContent = 'Logout';
          btn.onclick = logout;
          btn.className = 'action-btn mb-0 btn-auto-width btn-sm-pad btn-outline';
          
          if (userProfile.autoSync) {
            window._db.collection('users').doc(u.uid).collection('data').doc('misc').onSnapshot(doc => {
              if (doc.exists && doc.data().updatedAt) {
                const localTime = localStorage.getItem('study_last_sync_time');
                const remoteTime = doc.data().updatedAt.toMillis();
                if (!localTime || remoteTime > parseInt(localTime)) {
                  cloudSync('pull', true);
                }
              }
            });
          }
        } else {
          st.textContent = 'Not logged in';
          btn.textContent = 'Google Login';
          btn.onclick = login;
          btn.className = 'action-btn mb-0 btn-auto-width btn-sm-pad bg-accent';
        }
      }
    });
  } catch (e) {
    const st = $('firebase-login-status');
    if (st) st.textContent = 'Disabled';
  }
};
initFirebaseSafe();

const chunkArray = (arr, size) => Array.from({ length: Math.ceil(arr.length / size) }, (v, i) => arr.slice(i * size, i * size + size));

const mergeWords = (local, remote) => {
  const map = new Map();
  local.forEach(w => map.set(w.id || w.word.toLowerCase(), w));
  remote.forEach(w => {
    const key = w.id || w.word.toLowerCase();
    if (!map.has(key)) {
      map.set(key, w);
    } else {
      const existing = map.get(key);
      existing.meaning = w.meaning || existing.meaning;
      existing.example = w.example || existing.example;
      existing.tags = [...new Set([...(existing.tags || []), ...(w.tags || [])])];
      if (w.detailHtml) existing.detailHtml = w.detailHtml;
    }
  });
  return Array.from(map.values());
};

const mergeHistory = (local, remote) => {
  const map = new Map();
  local.forEach(h => map.set(h.id, h));
  remote.forEach(h => map.set(h.id, h));
  return Array.from(map.values()).sort((a, b) => new Date(b.date) - new Date(a.date));
};

const cloudSync = async (m, isAuto = false) => {
  if (!window._auth) return !isAuto && showToast('Disabled');
  const u = window._auth.currentUser;
  if (!u) return !isAuto && showToast('Login required');
  
  const c = window._db.collection('users').doc(u.uid).collection('data');
  try {
    if (m === 'push') {
      if (!isAuto) showToast('Pushing...');
      const batch = window._db.batch();
      
      const wordChunks = chunkArray(ALL_WORDS, 300);
      batch.set(c.doc('words_meta'), {
        chunks: wordChunks.length,
        savedWords: JSON.stringify(savedWords),
        srsData: JSON.stringify(srsData),
        wordProgress: JSON.stringify(wordProgress),
        vocabMeta: JSON.stringify(vocabMeta)
      });
      
      const oldMetaSn = await c.doc('words_meta').get();
      if (oldMetaSn.exists) {
        const oldChunksCount = oldMetaSn.data().chunks || 0;
        for (let i = wordChunks.length; i < oldChunksCount; i++) {
          batch.delete(c.doc(`words_chunk_${i}`));
        }
      }

      wordChunks.forEach((chunk, i) => {
        batch.set(c.doc(`words_chunk_${i}`), { data: JSON.stringify(chunk) });
      });
      
      batch.set(c.doc('history'), {
        writingHistory: JSON.stringify(writingHistory.slice(0, 50)),
        listenHistory: JSON.stringify(listenHistory.slice(0, 50)),
        dailyChallenges: JSON.stringify(dailyChallenges.slice(0, 50))
      });
      
      batch.set(c.doc('qa'), {
        subjectSaved: JSON.stringify(subjectSaved.slice(0, 50)),
        subjectQuizzes: JSON.stringify(subjectQuizzes.slice(0, 50)),
        subjectFolders: JSON.stringify(subjectFolders)
      });
      
      batch.set(c.doc('plans'), {
        plans: JSON.stringify(plans),
        events: JSON.stringify(events),
        studyLogs: JSON.stringify(studyLogs),
        textbooks: JSON.stringify(textbooks),
        yearlyPlan: JSON.stringify(yearlyPlan)
      });
      
      batch.set(c.doc('misc'), {
        examScores: JSON.stringify(examScores),
        customDecks: JSON.stringify(customDecks),
        syntaxList: JSON.stringify(syntaxList),
        userProfile: JSON.stringify(userProfile),
        freezeLogs: JSON.stringify(freezeLogs),
        examMistakes: JSON.stringify(examMistakes),
        calcMistakes: JSON.stringify(calcMistakes),
        otherMistakes: JSON.stringify(otherMistakes),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      await batch.commit();
      localStorage.setItem('study_last_sync_time', Date.now().toString());
      if (!isAuto) showToast('Push complete');
      
    } else {
      if (!isAuto) showToast('Pulling...');
      let found = false;
      
      const metaSn = await c.doc('words_meta').get();
      if (metaSn.exists) {
        found = true;
        const r = metaSn.data();
        const ps = (data, fb) => {
          if (typeof data === 'string') {
            try { return JSON.parse(data); } catch (e) { return fb; }
          }
          return data || fb;
        };
        
        if (r.savedWords) savedWords = [...new Set([...savedWords, ...ps(r.savedWords, [])])];
        if (r.srsData) srsData = { ...srsData, ...ps(r.srsData, {}) };
        if (r.wordProgress) wordProgress = { ...wordProgress, ...ps(r.wordProgress, {}) };
        if (r.vocabMeta) vocabMeta = { ...vocabMeta, ...ps(r.vocabMeta, {}) };
        
        let pulledWords = [];
        for (let i = 0; i < (r.chunks || 0); i++) {
          const chunkSn = await c.doc(`words_chunk_${i}`).get();
          if (chunkSn.exists) {
            pulledWords = pulledWords.concat(ps(chunkSn.data().data, []));
          }
        }
        if (pulledWords.length > 0) {
          ALL_WORDS = mergeWords(ALL_WORDS, pulledWords);
        }
      }

      for (const d of ['history', 'qa', 'plans', 'misc']) {
        const sn = await c.doc(d).get();
        if (sn.exists) {
          found = true;
          const r = sn.data();
          const ps = (data, fb) => {
            if (typeof data === 'string') {
              try { return JSON.parse(data); } catch (e) { return fb; }
            }
            return data || fb;
          };
          
          if (r.writingHistory) writingHistory = mergeHistory(writingHistory, ps(r.writingHistory, []));
          if (r.listenHistory) listenHistory = mergeHistory(listenHistory, ps(r.listenHistory, []));
          if (r.dailyChallenges) dailyChallenges = mergeHistory(dailyChallenges, ps(r.dailyChallenges, []));
          if (r.subjectSaved) subjectSaved = mergeHistory(subjectSaved, ps(r.subjectSaved, []));
          if (r.subjectQuizzes) subjectQuizzes = mergeHistory(subjectQuizzes, ps(r.subjectQuizzes, []));
          if (r.subjectFolders) subjectFolders = ps(r.subjectFolders, []);
          
          if (r.plans) plans = { ...plans, ...ps(r.plans, {}) };
          if (r.events) events = { ...events, ...ps(r.events, {}) };
          if (r.studyLogs) {
            const remLogs = ps(r.studyLogs, []);
            const map = new Map();
            studyLogs.forEach(l => map.set(l.ts, l));
            remLogs.forEach(l => map.set(l.ts, l));
            studyLogs = Array.from(map.values());
          }
          if (r.textbooks) textbooks = [...new Set([...textbooks, ...ps(r.textbooks, [])])];
          if (r.yearlyPlan) yearlyPlan = ps(r.yearlyPlan, yearlyPlan);
          if (r.examScores) examScores = mergeHistory(examScores, ps(r.examScores, []));
          if (r.customDecks) customDecks = mergeHistory(customDecks, ps(r.customDecks, []));
          if (r.syntaxList) syntaxList = mergeHistory(syntaxList, ps(r.syntaxList, []));
          if (r.userProfile) userProfile = { ...userProfile, ...ps(r.userProfile, {}) };
          if (r.freezeLogs) freezeLogs = [...new Set([...freezeLogs, ...ps(r.freezeLogs, [])])];
          if (r.examMistakes) examMistakes = mergeHistory(examMistakes, ps(r.examMistakes, []));
          if (r.calcMistakes) calcMistakes = mergeHistory(calcMistakes, ps(r.calcMistakes, []));
          if (r.otherMistakes) otherMistakes = mergeHistory(otherMistakes, ps(r.otherMistakes, []));
        }
      }
      
      if (found) {
        Object.values(save).forEach(f => f());
        localStorage.setItem('study_last_sync_time', Date.now().toString());
        if (!isAuto) {
          showToast('Pull complete');
          setTimeout(() => location.reload(), 1000);
        } else {
          showToast('Data synced');
          triggerTabEffects(TABS[currentTabIndex]);
        }
      } else if (!isAuto) {
        showToast('No data');
      }
    }
  } catch (e) {
    if (!isAuto) showToast('Communication error');
    console.error(e);
  }
};

const toggleAutoSync = () => {
  userProfile.autoSync = !userProfile.autoSync;
  save.profile();
  updateAutoSyncBtn();
};

const updateAutoSyncBtn = () => {
  const b = $('auto-sync-btn');
  if (b) {
    b.textContent = `Auto Sync (Real-time): ${userProfile.autoSync ? 'ON' : 'OFF'}`;
  }
};

window.addEventListener('online', async () => {
  if (userProfile.autoSync && window._auth && window._auth.currentUser) {
    await cloudSync('pull', true);
    cloudSync('push', true);
  }
});

// ============================================================
// [4] THEME & SETTINGS
// ============================================================
const applyTheme = () => {
  let isD = false;
  if (darkThemeMode === 'auto') {
    isD = window.matchMedia('(prefers-color-scheme: dark)').matches;
  } else {
    isD = darkThemeMode === 'dark';
  }
  
  const scheduleEnabled = safeGet('study_dark_schedule_enabled', false);
  if (scheduleEnabled && darkThemeMode === 'auto') {
    const start = safeGet('study_dark_schedule_start', '20:00');
    const end = safeGet('study_dark_schedule_end', '06:00');
    const now = new Date();
    const currentHM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    if (start < end) {
      isD = currentHM >= start && currentHM <= end;
    } else {
      isD = currentHM >= start || currentHM <= end;
    }
  }

  document.documentElement.setAttribute('data-theme', isD ? 'dark' : '');
  const b = $('dark-toggle-btn');
  if (b) {
    b.textContent = darkThemeMode === 'auto' ? (getUiLang() === 'ja' ? '自動' : 'Auto') : isD ? (getUiLang() === 'ja' ? 'ライト' : 'Light') : (getUiLang() === 'ja' ? 'ダーク' : 'Dark');
  }
  
  Chart.defaults.color = isD ? '#94A3B8' : '#4A5568';
  Chart.defaults.borderColor = isD ? '#333A45' : '#E2E5E9';
  
  if (currentTabIndex === 0) renderDashboard();
  if (currentTabIndex === 6 && planMode === 'score') renderScoreChart();
  if (currentTabIndex === 7 && mistakeTab === 'exam') renderMistakeRadarChart();
};

setInterval(applyTheme, 60000);

const toggleDark = () => {
  darkThemeMode = darkThemeMode === 'auto' ? 'dark' : darkThemeMode === 'dark' ? 'light' : 'auto';
  safeSet('study_dark_mode', darkThemeMode);
  applyTheme();
};

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (darkThemeMode === 'auto') applyTheme();
});

window.setThemeColor = (colorKey) => {
  userProfile.themeColor = colorKey;
  save.profile();
  applyThemeColor();
};

window.applyCustomThemeColor = () => {
  const color = $('custom-theme-bg').value;
  userProfile.customThemeColor = color;
  userProfile.themeColor = 'custom';
  save.profile();
  applyThemeColor();
};

const applyThemeColor = () => {
  if (userProfile.themeColor === 'custom' && userProfile.customThemeColor) {
    document.documentElement.style.setProperty('--accent', userProfile.customThemeColor);
    document.documentElement.style.setProperty('--streak', userProfile.customThemeColor);
  } else {
    const th = THEMES[userProfile.themeColor || 'default'];
    if (th) {
      document.documentElement.style.setProperty('--accent', th.accent);
      document.documentElement.style.setProperty('--streak', th.streak);
    }
  }
};

window.changeUiFontSize = () => {
  const s = $('ui-font-size-select').value;
  document.documentElement.setAttribute('data-font-size', s);
  localStorage.setItem('study_ui_font_size', s);
};

window.toggleDarkModeSchedule = () => {
  const toggle = $('dark-mode-schedule-toggle');
  const times = $('dark-mode-schedule-times');
  if (!toggle || !times) return;
  
  const enabled = toggle.checked;
  safeSet('study_dark_schedule_enabled', enabled);
  if (enabled) {
    times.classList.remove('hidden');
  } else {
    times.classList.add('hidden');
  }
  applyTheme();
};

window.saveDarkModeSchedule = () => {
  const start = $('dark-mode-start').value;
  const end = $('dark-mode-end').value;
  safeSet('study_dark_schedule_start', start);
  safeSet('study_dark_schedule_end', end);
  applyTheme();
};

const updateFsrsRetention = (val) => {
  fsrsRetention = Math.min(99, parseInt(val));
  const lbl = $('fsrs-retention-label');
  if (lbl) lbl.textContent = fsrsRetention + '%';
  safeSet('study_fsrs_retention', fsrsRetention);
};

window.saveGeminiModel = () => {
  const select = $('gemini-model-select');
  const customContainer = $('custom-model-input-container');
  
  if (select.value === 'custom') {
    customContainer.classList.remove('hidden');
    localStorage.setItem('study_gemini_model_type', 'custom');
  } else {
    customContainer.classList.add('hidden');
    localStorage.setItem('study_gemini_model_type', 'preset');
    localStorage.setItem('study_gemini_model', select.value);
    showToast('Saved');
  }
};

window.saveCustomGeminiModel = () => {
  const customInput = $('custom-gemini-model');
  if (customInput.value.trim()) {
    localStorage.setItem('study_gemini_model', customInput.value.trim());
    showToast('Custom model saved');
  }
};

const initModelSelect = () => {
  const s = $('gemini-model-select');
  const customContainer = $('custom-model-input-container');
  const customInput = $('custom-gemini-model');
  
  const savedModel = localStorage.getItem('study_gemini_model') || 'gemini-2.5-flash';
  const modelType = localStorage.getItem('study_gemini_model_type') || 'preset';
  
  if (s) {
    let optionExists = Array.from(s.options).some(opt => opt.value === savedModel);
    
    if (modelType === 'custom' || (!optionExists && savedModel)) {
      s.value = 'custom';
      if (customContainer) customContainer.classList.remove('hidden');
      if (customInput) customInput.value = savedModel;
    } else {
      s.value = savedModel;
      if (customContainer) customContainer.classList.add('hidden');
    }
  }
};

window.fetchAvailableModels = async () => {
  const apiKey = localStorage.getItem('study_gemini_api_key');
  if (!apiKey) return showToast('Please set API Key first');
  
  showToast('Fetching models...');
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (!res.ok) throw new Error('Failed to fetch');
    const data = await res.json();
    
    const models = data.models.filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'));
    const select = $('gemini-model-select');
    if (!select) return;
    
    const customOpt = select.querySelector('option[value="custom"]');
    select.innerHTML = '';
    
    models.forEach(m => {
      const modelId = m.name.replace('models/', '');
      if (modelId.includes('1.5') || modelId.includes('2.0')) return;
      
      const option = document.createElement('option');
      option.value = modelId;
      option.textContent = m.displayName || modelId;
      select.appendChild(option);
    });
    
    if (customOpt) select.appendChild(customOpt);
    
    initModelSelect();
    showToast('Model list updated');
  } catch (e) {
    showToast('Error fetching models');
    console.error(e);
  }
};

window.saveApiKey = () => {
  const input = $('gemini-api-key-input');
  if (!input) return;
  const val = input.value.trim();
  if (val) {
    localStorage.setItem('study_gemini_api_key', val);
    showToast('API Key saved');
  } else {
    localStorage.removeItem('study_gemini_api_key');
    showToast('API Key removed');
  }
};

window.openTextCustomizerPanel = () => {
  const list = $('text-customizer-list');
  if (!list) return;
  const inputs = list.querySelectorAll('input[data-key]');
  inputs.forEach(inp => {
    const key = inp.getAttribute('data-key');
    inp.value = customTexts[key] || '';
  });
};

window.saveCustomTexts = () => {
  const list = $('text-customizer-list');
  if (!list) return;
  const inputs = list.querySelectorAll('input[data-key]');
  inputs.forEach(inp => {
    const key = inp.getAttribute('data-key');
    const val = inp.value.trim();
    if (val) {
      customTexts[key] = val;
    } else {
      delete customTexts[key];
    }
  });
  safeSet('study_custom_texts', customTexts);
  applyLanguage();
  showToast(getUiLang() === 'ja' ? 'テキストを保存しました' : 'Custom texts saved');
};

window.resetCustomTexts = () => {
  customTexts = {};
  safeSet('study_custom_texts', customTexts);
  const list = $('text-customizer-list');
  if (list) {
    list.querySelectorAll('input[data-key]').forEach(inp => inp.value = '');
  }
  applyLanguage();
  showToast(getUiLang() === 'ja' ? 'デフォルトにリセットしました' : 'Reset to default');
};

// ============================================================
// [5] FSRS ALGORITHM
// ============================================================
const srsNextDate = r => {
  if (!r || !r.lastReview) return null;
  const d = new Date(r.lastReview);
  d.setDate(d.getDate() + (r.interval || 1));
  return d;
};

const srsDaysDiff = d => {
  if (!d) return 0;
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  const n = new Date(d);
  n.setHours(0, 0, 0, 0);
  return Math.round((n.getTime() - t.getTime()) / 86400000);
};

const srsReview = (w, rt) => {
  const k = w.toLowerCase();
  const r = srsData[k] || { difficulty: 5, stability: 1, lastReview: null, reviews: 0, repetition: 0, history: [] };
  r.reviews++;
  const now = new Date();
  let g = rt === 0 ? 1 : rt === 1 ? 2 : rt === 2 ? 3 : 4;

  if (!r.history) r.history = [];
  r.history.push(rt);
  if (r.history.length > 10) r.history.shift();

  const autoOpt = $('fsrs-auto-optimize');
  if (autoOpt && autoOpt.checked && r.history.length >= 5) {
    const recentCorrect = r.history.filter(x => x >= 2).length / r.history.length;
    if (recentCorrect > 0.9 && fsrsRetention > 70) {
      fsrsRetention = Math.max(70, fsrsRetention - 1);
    } else if (recentCorrect < 0.6 && fsrsRetention < 99) {
      fsrsRetention = Math.min(99, fsrsRetention + 1);
    }
    safeSet('study_fsrs_retention', fsrsRetention);
    const lbl = $('fsrs-retention-label');
    const sld = $('fsrs-retention-slider');
    if (lbl) lbl.textContent = fsrsRetention + '%';
    if (sld) sld.value = fsrsRetention;
  }

  if (!r.lastReview) {
    r.difficulty = g === 1 ? 7 : g === 2 ? 6 : g === 3 ? 5 : 4;
    r.stability = g === 1 ? 1 : g === 2 ? 2 : g === 3 ? 3 : 4;
    r.repetition = g > 1 ? 1 : 0;
  } else {
    const d = (now - new Date(r.lastReview)) / 86400000;
    const safeStability = Math.max(0.1, r.stability);
    const ret = Math.exp(Math.log(0.9) * d / safeStability);
    r.difficulty = Math.max(1, Math.min(10, r.difficulty + (8 - r.difficulty) * 0.2 * (3 - g)));
    
    if (g === 1) {
      r.stability = Math.max(0.1, safeStability * 0.3);
      r.repetition = 0;
    } else {
      const f = 1 + Math.exp(1) * (11 - r.difficulty) * Math.pow(safeStability, -0.2) * (Math.exp(1 - ret) - 1);
      r.stability = safeStability * (g === 2 ? f * 0.8 : g === 3 ? f : f * 1.2);
      r.repetition++;
    }
  }
  
  const retentionFactor = Math.max(0.01, Math.log(fsrsRetention / 100) / Math.log(0.9));
  r.interval = Math.max(1, Math.round(r.stability * 9 * (1 / retentionFactor)));
  
  srsData[k] = {
    lastReview: now.toISOString(),
    interval: r.interval,
    stability: r.stability,
    difficulty: r.difficulty,
    reviews: r.reviews,
    repetition: r.repetition,
    rating: rt,
    history: r.history
  };
  save.srs();
};

const srsRateCurrentCard = r => {
  if (!cardList.length) return;
  const w = cardList[currentCardIdx].word;
  srsReview(w, r);
  
  if (r >= 2) {
    setWordProgress(w, 'mastered');
    if (navigator.vibrate) navigator.vibrate(30);
    if (window.confetti) confetti({ particleCount: 30, spread: 40, origin: { y: 0.7 } });
  } else if (r === 1) {
    setWordProgress(w, 'learning');
  } else {
    setWordProgress(w, 'learning');
    if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
  }
  
  showToast(w + ' Recorded');
  changeCard(1);
};

const srsReviewItem = (key, rt) => {
  srsReview(key, rt);
  showToast('Record complete');
};

const srsGetDueItems = () => {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  const dueWords = [];
  const dueSyntax = [];
  const dueDaily = [];
  
  Object.keys(srsData).forEach(k => {
    const r = srsData[k];
    const n = srsNextDate(r);
    if (n && n <= t) {
      if (k.startsWith('syntax_')) {
        dueSyntax.push(k.replace('syntax_', ''));
      } else if (k.startsWith('daily_')) {
        dueDaily.push(k.replace('daily_', ''));
      } else {
        dueWords.push(k);
      }
    }
  });
  return { dueWords, dueSyntax, dueDaily };
};

const srsGetDueWords = () => {
  return srsGetDueItems().dueWords.map(w => ALL_WORDS.find(x => x.word.toLowerCase() === w)).filter(Boolean);
};

const srsGetNewWords = () => {
  return ALL_WORDS.filter(w => !srsData[w.word.toLowerCase()]).slice(0, 15);
};

// ============================================================
// [6] GEMINI API
// ============================================================
window.callGemini = async (msgs, maxT = 8192, sys = '', expectJson = false, retries = 3, backoff = 1000) => {
  if (!navigator.onLine) throw new Error('Offline');
  const apiKey = localStorage.getItem('study_gemini_api_key');
  if (!apiKey) throw new Error('API Key not set');
  const mod = localStorage.getItem('study_gemini_model') || 'gemini-2.5-flash';
  const contents = [];
  
  const sanitizePrompt = (text) => {
    if (typeof text !== 'string') return text;
    return text.replace(/ignore previous instructions/gi, '')
               .replace(/system prompt/gi, '')
               .replace(/you are a/gi, '');
  };

  const finalSys = BASE_SYSTEM_PROMPT + (sys ? '\n追加指示:\n' + sys : '');
  if (finalSys) {
    contents.push(
      { role: 'user', parts: [{ text: finalSys }] },
      { role: 'model', parts: [{ text: '了解した。' }] }
    );
  }
  
  msgs.slice(-15).forEach(m => {
    const parts = [];
    if (typeof m.content === 'string') {
      parts.push({ text: sanitizePrompt(m.content) });
    } else {
      m.content.forEach(p => {
        if (p.type === 'text') {
          parts.push({ text: sanitizePrompt(p.text) });
        } else if (p.type === 'image' || p.type === 'inline_data') {
          parts.push({ inlineData: { mimeType: p.source.media_type, data: p.source.data } });
        }
      });
    }
    contents.push({ role: m.role === 'assistant' ? 'model' : 'user', parts });
  });
  
  const body = { contents, generationConfig: { maxOutputTokens: maxT } };
  if (expectJson) {
    body.generationConfig.responseMimeType = "application/json";
  }

  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${mod}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (!res.ok) {
        if (res.status === 429) {
          if (i < retries - 1) {
            await sleep(backoff * Math.pow(2, i));
            continue;
          }
          throw new Error('429');
        }
        if (res.status === 400) throw new Error('400');
        if (res.status === 401) throw new Error('401');
        throw new Error(`API Error ${res.status}`);
      }
      
      const d = await res.json();
      return d.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (e) {
      if (i === retries - 1) throw e;
      await sleep(backoff * Math.pow(2, i));
    }
  }
};

// ============================================================
// [7] SPEECH & AUDIO MIXER
// ============================================================
document.addEventListener('touchstart', () => {
  if (!_audioUnlocked && window.speechSynthesis) {
    const u = new SpeechSynthesisUtterance('');
    u.volume = 0;
    speechSynthesis.speak(u);
    _audioUnlocked = true;
  }
}, { once: true, passive: true });

if (window.speechSynthesis) {
  speechSynthesis.onvoiceschanged = () => {
    availableVoices = speechSynthesis.getVoices();
  };
}

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SR) {
  rec = new SR();
  rec.lang = 'en-US';
  rec.continuous = false;
  rec.interimResults = false;
  
  rec.onstart = () => {
    if (mBtn) mBtn.classList.add('listening');
    showToast('Voice input...');
  };
  
  rec.onresult = e => {
    const tStr = e.results[0][0].transcript;
    if (aInp) {
      const s = aInp.selectionStart;
      const v = aInp.value;
      aInp.value = v.slice(0, s) + tStr + v.slice(aInp.selectionEnd);
      aInp.dispatchEvent(new Event('input'));
    }
  };
  
  rec.onerror = (e) => {
    console.warn('Speech recognition error', e);
    showToast('Voice recognition error');
    if (mBtn) mBtn.classList.remove('listening');
  };
  
  rec.onend = () => {
    if (mBtn) mBtn.classList.remove('listening');
  };
  
  window.addEventListener('DOMContentLoaded', () => {
    mBtn = document.createElement('button');
    mBtn.className = 'global-mic-btn';
    mBtn.innerHTML = '<span class="material-symbols-rounded">mic</span>';
    document.body.appendChild(mBtn);
    
    mBtn.onmousedown = e => {
      e.preventDefault();
      if (rec && aInp) {
        mBtn.classList.contains('listening') ? rec.stop() : rec.start();
      }
    };
    
    document.addEventListener('focusin', e => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName) && e.target.type !== 'checkbox') {
        aInp = e.target;
        mBtn.style.display = 'flex';
      }
    });
    
    document.addEventListener('focusout', () => {
      setTimeout(() => {
        if (!['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
          mBtn.style.display = 'none';
          aInp = null;
        }
      }, 100);
    });
  });
} else {
  window.addEventListener('DOMContentLoaded', () => {
    const searchMicBtn = $('search-mic-btn');
    if (searchMicBtn) searchMicBtn.style.display = 'none';
  });
}

window.toggleSearchMic = () => {
  const btn = $('search-mic-btn');
  const input = $('word-input');
  if (!btn || !input) return;
  
  if (btn.classList.contains('listening')) {
    if (searchMicRec) searchMicRec.stop();
    btn.classList.remove('listening');
  } else {
    if (!SR) return showToast('Browser not supported');
    searchMicRec = new SR();
    searchMicRec.lang = 'en-US';
    searchMicRec.continuous = false;
    searchMicRec.interimResults = false;
    
    searchMicRec.onstart = () => {
      btn.classList.add('listening');
      showToast('Voice input...');
    };
    
    searchMicRec.onresult = (e) => {
      const transcript = e.results[0][0].transcript.trim();
      input.value = transcript;
      searchWord();
    };
    
    searchMicRec.onerror = () => {
      showToast('Voice recognition error');
      btn.classList.remove('listening');
    };
    
    searchMicRec.onend = () => {
      btn.classList.remove('listening');
    };
    
    searchMicRec.start();
  }
};

const speakWord = (w, e) => {
  if (e) e.stopPropagation();
  if (!window.speechSynthesis) return;
  speechSynthesis.cancel();
  if (availableVoices.length === 0) {
    availableVoices = speechSynthesis.getVoices();
  }
  
  const sentences = w.match(/[^.!?]+[.!?]+/g) || [w];
  sentences.forEach(sentence => {
    const u = new SpeechSynthesisUtterance(sentence.trim());
    u.lang = 'en-US';
    speechSynthesis.speak(u);
  });
};

const speakCurrentCard = () => {
  if (cardList.length) {
    speakWord(cardList[currentCardIdx].word, null);
  }
};

const initAudioCtx = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterCompressor = audioCtx.createDynamicsCompressor();
    masterCompressor.threshold.value = -24;
    masterCompressor.knee.value = 30;
    masterCompressor.ratio.value = 12;
    masterCompressor.attack.value = 0.003;
    masterCompressor.release.value = 0.25;
    masterCompressor.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

const createNoiseNode = (type) => {
  const bufferSize = audioCtx.sampleRate * 2;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const output = buffer.getChannelData(0);
  
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < bufferSize; i++) {
    let white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    output[i] *= 0.11;
    b6 = white * 0.115926;
  }
  
  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;
  
  const filter = audioCtx.createBiquadFilter();
  const gain = audioCtx.createGain();
  
  if (type === 'rain') {
    filter.type = 'lowpass';
    filter.frequency.value = 1000;
  } else if (type === 'forest') {
    filter.type = 'lowpass';
    filter.frequency.value = 400;
  } else if (type === 'ocean') {
    filter.type = 'lowpass';
    filter.frequency.value = 200;
  }
  
  gain.gain.value = noiseVolumes[type];
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(masterCompressor);
  
  return { source: noise, gainNode: gain };
};

window.toggleNoise = (type) => {
  initAudioCtx();
  const btn = $(`audio-btn-${type}`);
  
  if (activeNoises[type]) {
    if (noiseNodes[type]) {
      noiseNodes[type].source.stop();
      noiseNodes[type].source.disconnect();
      noiseNodes[type] = null;
    }
    activeNoises[type] = false;
    if (btn) btn.classList.remove('active');
  } else {
    noiseNodes[type] = createNoiseNode(type);
    noiseNodes[type].source.start();
    activeNoises[type] = true;
    if (btn) btn.classList.add('active');
  }
};

window.updateNoiseVolume = (type, val) => {
  const vol = parseInt(val) / 100;
  noiseVolumes[type] = vol;
  if (noiseNodes[type] && noiseNodes[type].gainNode) {
    noiseNodes[type].gainNode.gain.value = vol;
  }
};

// ============================================================
// [8] TIMER
// ============================================================
const timerStartStop = () => {
  const pm = $('timer-pomodoro-mode');
  
  if (timerRunning) {
    clearInterval(timerInt);
    timerRunning = false;
    timerTime = Math.max(0, Math.ceil((timerEndTime - Date.now()) / 1000));
    const s = $('timer-status');
    if (s) s.textContent = isPomodoroBreak ? (getUiLang() === 'ja' ? '休憩停止中' : 'Break Stopped') : (getUiLang() === 'ja' ? '停止中' : 'Stopped');
    const b = $('timer-start-btn');
    if (b) b.textContent = getUiLang() === 'ja' ? 'スタート' : 'Start';
  } else {
    timerRunning = true;
    timerEndTime = Date.now() + (timerTime * 1000);
    localStorage.setItem('study_timer_end', timerEndTime.toString());
    const s = $('timer-status');
    if (s) s.textContent = isPomodoroBreak ? (getUiLang() === 'ja' ? '休憩中' : 'Break') : (getUiLang() === 'ja' ? '実行中' : 'Running');
    const b = $('timer-start-btn');
    if (b) b.textContent = getUiLang() === 'ja' ? 'ストップ' : 'Stop';
    
    timerInt = setInterval(() => {
      const remain = Math.max(0, Math.ceil((timerEndTime - Date.now()) / 1000));
      timerTime = remain;
      updateTimerDisplay();
      
      if (remain <= 0) {
        clearInterval(timerInt);
        timerRunning = false;
        if (navigator.vibrate) navigator.vibrate(1000);
        if (Notification.permission === 'granted') {
          new Notification('Study App', { body: isPomodoroBreak ? 'Break is over! Let\'s resume studying.' : 'Study session finished! Good job.' });
        }
        
        if (pm && pm.checked) {
          if (!isPomodoroBreak) {
            showToast('Study finished! 5 min break');
            studyLogs.push({ date: todayDateStr(), subj: 'other', seconds: 25 * 60, ts: Date.now() });
            save.logs();
            isPomodoroBreak = true;
            timerInitial = 5 * 60;
            timerTime = timerInitial;
            updateTimerDisplay();
            const s = $('timer-status');
            if (s) s.textContent = getUiLang() === 'ja' ? '休憩停止中' : 'Break Stopped';
            const b = $('timer-start-btn');
            if (b) b.textContent = getUiLang() === 'ja' ? 'スタート' : 'Start';
          } else {
            showToast('Break finished! Resume study');
            isPomodoroBreak = false;
            timerInitial = 25 * 60;
            timerTime = timerInitial;
            updateTimerDisplay();
            const s = $('timer-status');
            if (s) s.textContent = getUiLang() === 'ja' ? '停止中' : 'Stopped';
            const b = $('timer-start-btn');
            if (b) b.textContent = getUiLang() === 'ja' ? 'スタート' : 'Start';
          }
        } else {
          showToast('Finished');
          studyLogs.push({ date: todayDateStr(), subj: 'other', seconds: timerInitial, ts: Date.now() });
          save.logs();
          const s = $('timer-status');
          if (s) s.textContent = getUiLang() === 'ja' ? '停止中' : 'Stopped';
          const b = $('timer-start-btn');
          if (b) b.textContent = getUiLang() === 'ja' ? 'スタート' : 'Start';
        }
      }
    }, 1000);
  }
};

window.addEventListener('storage', (e) => {
  if (e.key === 'study_timer_end') {
    const newEnd = parseInt(e.newValue);
    if (newEnd && newEnd > Date.now()) {
      timerEndTime = newEnd;
      if (!timerRunning) {
        timerTime = Math.max(0, Math.ceil((timerEndTime - Date.now()) / 1000));
        updateTimerDisplay();
      }
    }
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && timerRunning) {
    const remain = Math.max(0, Math.ceil((timerEndTime - Date.now()) / 1000));
    timerTime = remain;
    updateTimerDisplay();
  }
});

const timerReset = () => {
  if (timerRunning) timerStartStop();
  if (isPomodoroMode) {
    isPomodoroBreak = false;
    timerInitial = 25 * 60;
  }
  timerTime = timerInitial;
  updateTimerDisplay();
};

const timerSetCustom = () => {
  const m = parseInt($('timer-input-min').value) || 0;
  const s = parseInt($('timer-input-sec').value) || 0;
  timerInitial = m * 60 + s;
  timerTime = timerInitial;
  updateTimerDisplay();
};

const timerSavePreset = () => {
  if (!timerPresets.includes(timerInitial)) {
    timerPresets.push(timerInitial);
    safeSet('study_timer_presets', timerPresets);
    renderTimerPresets();
  }
};

const renderTimerPresets = () => {
  const p = $('timer-presets');
  if (!p) return;
  p.innerHTML = timerPresets.map(tStr => {
    const min = Math.floor(tStr / 60);
    const sec = tStr % 60;
    return `
      <div style="display:inline-flex;align-items:center;border:1px solid var(--border);border-radius:50px;background:var(--surface);box-shadow:var(--shadow-xs);">
        <button onclick="timerInitial=${tStr};timerTime=${tStr};updateTimerDisplay()" style="padding:8px 16px;border:none;background:transparent;color:var(--text);cursor:pointer;font-size:calc(13px * var(--text-scale));font-weight:600">
          ${min}:${String(sec).padStart(2, '0')}
        </button>
        <button onclick="timerDeletePreset(${tStr})" style="padding:8px 12px;border:none;border-left:1px solid var(--border);background:transparent;color:var(--danger);cursor:pointer;font-weight:bold;font-size:calc(12px * var(--text-scale));">
          ✕
        </button>
      </div>
    `;
  }).join('');
};

const timerDeletePreset = tStr => {
  timerPresets = timerPresets.filter(x => x !== tStr);
  safeSet('study_timer_presets', timerPresets);
  renderTimerPresets();
};

const updateTimerDisplay = () => {
  const min = Math.floor(timerTime / 60);
  const sec = timerTime % 60;
  const d = $('timer-display');
  if (d) {
    d.textContent = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }
};

// ============================================================
// [9] DASHBOARD & WIDGETS
// ============================================================
window.toggleWidgetSortMode = () => {
  const container = $('dashboard-widgets');
  const btn = $('toggle-widget-sort-btn');
  if (!container || !btn) return;
  
  if (container.classList.contains('widget-sort-mode')) {
    container.classList.remove('widget-sort-mode');
    btn.textContent = getUiLang() === 'ja' ? '並び替え' : 'Sort';
    btn.classList.remove('bg-accent', 'text-bg');
    if (window.sortableWidgets) {
      window.sortableWidgets.option("disabled", true);
    }
    saveWidgetOrder();
  } else {
    container.classList.add('widget-sort-mode');
    btn.textContent = getUiLang() === 'ja' ? '完了' : 'Done';
    btn.classList.add('bg-accent', 'text-bg');
    
    if (!window.sortableWidgets) {
      window.sortableWidgets = Sortable.create(container, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        dragClass: 'sortable-drag',
        disabled: false
      });
    } else {
      window.sortableWidgets.option("disabled", false);
    }
  }
};

const saveWidgetOrder = () => {
  const container = $('dashboard-widgets');
  if (!container) return;
  const order = Array.from(container.children).map(el => el.getAttribute('data-widget-id')).filter(Boolean);
  safeSet('study_widget_order', order);
  showToast('Layout saved');
};

const loadWidgetOrder = () => {
  const order = safeGet('study_widget_order', null);
  const container = $('dashboard-widgets');
  if (!order || !container) return;
  
  const elements = Array.from(container.children);
  order.forEach(id => {
    const el = elements.find(e => e.getAttribute('data-widget-id') === id);
    if (el) {
      container.appendChild(el);
    }
  });
};

window.renderWidgetSettingsPanel = () => {
  const list = $('widget-settings-list');
  if (!list) return;
  
  const allWidgets = [
    { id: 'wotd', name: 'Word of the Day' },
    { id: 'countdown', name: 'Goal Countdown' },
    { id: 'yearly', name: 'Monthly Goal' },
    { id: 'actions', name: 'Action Buttons (Weekly/Analysis)' },
    { id: 'streak', name: 'Streak Days' },
    { id: 'weekly-chart', name: 'Weekly Study Time Chart' },
    { id: 'radar-chart', name: 'Study Balance Radar Chart' },
    { id: 'srs-chart', name: 'Forgetting Curve Chart' },
    { id: 'srs-scatter', name: 'Retention Distribution' },
    { id: 'stability-chart', name: 'Average Retention Trend' },
    { id: 'subj-chart', name: 'Study Time by Subject' },
    { id: 'heatmap', name: 'Study Heatmap' },
    { id: 'calendar', name: 'Calendar' },
    { id: 'quick-capture-inbox', name: 'Quick Notes' },
    { id: 'today-plan', name: 'Today\'s Plan' },
    { id: 'today-log', name: 'Today\'s Study Log' }
  ];
  
  list.innerHTML = allWidgets.map(w => `
    <label class="flex align-center gap-2 text-sm font-bold cursor-pointer p-12 border radius-sm bg-surface">
      <input type="checkbox" class="widget-toggle-cb" value="${w.id}" ${activeWidgets.includes(w.id) ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--accent);">
      <span>${w.name}</span>
    </label>
  `).join('');
  
  const colSelect = $('widget-column-select');
  if (colSelect) colSelect.value = widgetColumnMode;
};

window.saveWidgetSettings = () => {
  const cbs = document.querySelectorAll('.widget-toggle-cb');
  activeWidgets = Array.from(cbs).filter(cb => cb.checked).map(cb => cb.value);
  safeSet('study_active_widgets', activeWidgets);
  
  const colSelect = $('widget-column-select');
  if (colSelect) {
    widgetColumnMode = colSelect.value;
    safeSet('study_widget_column_mode', widgetColumnMode);
  }
  
  $('widget-settings-panel').classList.add('hidden');
  renderDashboard();
  showToast('Display settings saved');
};

const applyWidgetVisibility = () => {
  const container = $('dashboard-widgets');
  if (!container) return;
  
  if (widgetColumnMode === '2') {
    container.classList.add('widget-grid-2col');
  } else {
    container.classList.remove('widget-grid-2col');
  }
  
  Array.from(container.children).forEach(el => {
    const id = el.getAttribute('data-widget-id');
    if (id) {
      if (activeWidgets.includes(id)) {
        el.style.display = '';
      } else {
        el.style.display = 'none';
      }
    }
  });
};

const renderCountdown = () => {
  const display = $('dash-countdown-display');
  if (!display) return;
  
  if (!countdownData.name || !countdownData.date) {
    display.innerHTML = `<p class="text-sm text-muted">${t('msg_target_not_set')}</p>`;
    return;
  }
  
  const targetDate = new Date(countdownData.date);
  targetDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const diffTime = targetDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays > 0) {
    display.innerHTML = `
      <div class="countdown-label mb-2">Days until ${esc(countdownData.name)}</div>
      <div class="countdown-number">${diffDays}<span style="font-size:16px; color:var(--text-sub); margin-left:4px;">Days</span></div>
    `;
  } else if (diffDays === 0) {
    display.innerHTML = `
      <div class="countdown-label mb-2">${esc(countdownData.name)}</div>
      <div class="countdown-number text-danger" style="font-size:32px;">Today is the day!</div>
    `;
  } else {
    display.innerHTML = `
      <div class="countdown-label mb-2">Days passed since ${esc(countdownData.name)}</div>
      <div class="countdown-number text-muted">${Math.abs(diffDays)}<span style="font-size:16px; margin-left:4px;">Days</span></div>
    `;
  }
};

window.openCountdownSettings = () => {
  $('countdown-name').value = countdownData.name || '';
  $('countdown-date').value = countdownData.date || '';
  openModal('countdown-modal');
};

window.saveCountdown = () => {
  const name = $('countdown-name').value.trim();
  const date = $('countdown-date').value;
  if (!name || !date) return showToast('Please enter values');
  countdownData = { name, date };
  safeSet('study_countdown', countdownData);
  renderCountdown();
  closeModal('countdown-modal');
  showToast('Saved');
};

const dashWeeklyPrev = () => {
  dashWeeklyOffset++;
  renderDashboard();
};

const dashWeeklyNext = () => {
  if (dashWeeklyOffset > 0) {
    dashWeeklyOffset--;
    renderDashboard();
  }
};

window.openQuickCaptureModal = () => {
  const input = $('qc-text-input');
  if (input) input.value = '';
  openModal('quick-capture-modal');
};

window.saveQuickCapture = () => {
  const input = $('qc-text-input');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;
  quickCaptures.unshift({ id: generateId(), text, date: new Date().toLocaleString('en-US') });
  safeSet('study_quick_captures', quickCaptures);
  closeModal('quick-capture-modal');
  showToast('Note saved');
  renderQuickCaptures();
};

const renderQuickCaptures = () => {
  const list = $('quick-capture-list');
  if (!list) return;
  if (!quickCaptures.length) {
    list.innerHTML = `<p class="text-xs text-muted text-center">${t('msg_no_notes')}</p>`;
    return;
  }
  list.innerHTML = quickCaptures.map(qc => `
    <div class="card mb-2 p-16">
      <div class="text-xs text-muted mb-2">${qc.date}</div>
      <div class="text-sm line-height-16">${esc(qc.text).replace(/\n/g, '<br>')}</div>
      <div class="flex justify-end mt-3">
        <button class="btn-clear text-danger text-xs" onclick="deleteQuickCapture('${qc.id}')">Delete</button>
      </div>
    </div>
  `).join('');
};

window.deleteQuickCapture = (id) => {
  const qc = quickCaptures.find(q => q.id === id);
  if (!qc) return;
  quickCaptures = quickCaptures.filter(q => q.id !== id);
  safeSet('study_quick_captures', quickCaptures);
  renderQuickCaptures();
  showUndoSnackbar('Note deleted', () => {
    quickCaptures.unshift(qc);
    safeSet('study_quick_captures', quickCaptures);
    renderQuickCaptures();
  }, () => {});
};

const renderChartSafe = (canvasId, renderFn) => {
  const cv = $(canvasId);
  if (!cv) return;
  if (cv.offsetParent !== null) {
    renderFn();
  } else {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        renderFn();
        observer.disconnect();
      }
    });
    observer.observe(cv);
  }
};

const renderWordOfTheDay = async () => {
  const card = $('word-of-the-day-card');
  if (!card || !activeWidgets.includes('wotd')) return;
  card.classList.remove('hidden');
  const today = todayDateStr();
  
  const exBox = $('wotd-example');
  const wEl = $('wotd-word');
  const mEl = $('wotd-meaning');
  const sBtn = $('wotd-save-btn');
  
  if (cachedWotd.date === today && cachedWotd.word) {
    wEl.textContent = cachedWotd.word.word;
    mEl.textContent = cachedWotd.meaning || 'Analyzing meaning...';
    exBox.innerHTML = cachedWotd.exampleHtml || '';
  } else {
    wEl.textContent = 'Loading...';
    mEl.textContent = '';
    exBox.innerHTML = '<span class="loading-dots"></span>';
    
    try {
      const knownWords = ALL_WORDS.map(w => w.word).join(', ');
      const seed = Date.now();
      const prompt = `高校〜大学受験、またはTOEICレベルの英単語をランダムに1つ選び、JSONで出力せよ。(seed: ${seed})
条件:
- 以下の単語リストに含まれない、新しい単語を選ぶこと。
除外リスト: ${knownWords.substring(0, 3000)}
形式: {"word":"英単語", "meaning":"主な意味（体言止め）", "exampleHtml":"例文<br>和訳"}`;
      
      const rep = await callGemini([{ role: 'user', content: prompt }], 8192, 'JSON形式で出力せよ。', true);
      const json = extractJSON(rep);
      if (json && json.word) {
        cachedWotd = { 
          date: today, 
          word: { word: json.word, meaning: json.meaning }, 
          exampleHtml: clean(json.exampleHtml), 
          meaning: json.meaning 
        };
        safeSet('study_wotd_cache', cachedWotd);
        
        wEl.textContent = cachedWotd.word.word;
        mEl.textContent = cachedWotd.meaning;
        exBox.innerHTML = cachedWotd.exampleHtml;
      } else {
        throw new Error('Invalid JSON');
      }
    } catch (e) {
      wEl.textContent = 'Error';
      exBox.innerHTML = '<p class="text-xs text-muted">Failed to fetch word.</p>';
    }
  }
  
  $('wotd-speak').onclick = () => {
    if (cachedWotd.word) speakWord(cachedWotd.word.word);
  };
  
  if (cachedWotd.word) {
    const isSaved = ALL_WORDS.some(x => x.word.toLowerCase() === cachedWotd.word.word.toLowerCase());
    sBtn.textContent = isSaved ? (getUiLang() === 'ja' ? '保存済' : 'Saved') : (getUiLang() === 'ja' ? '単語帳に追加' : 'Add to Vocab'); 
    sBtn.className = `action-btn mb-0 flex-1 min-w-100 whitespace-nowrap ${isSaved ? 'btn-secondary' : ''}`;
    sBtn.onclick = () => { 
      if (!isSaved) {
        const tagInput = $('wotd-tag-input');
        const tags = tagInput && tagInput.value.trim() ? tagInput.value.split(',').map(tStr => tStr.trim()).filter(Boolean) : [];
        const exText = cachedWotd.exampleHtml ? cachedWotd.exampleHtml.replace(/<br>/gi, '\n').replace(/<[^>]+>/g, '') : '';
        
        ALL_WORDS.unshift({ 
          id: generateId(),
          word: cachedWotd.word.word, 
          meaning: cachedWotd.meaning, 
          example: exText, 
          tags: tags 
        });
        savedWords.push(cachedWotd.word.word);
        save.words();
        save.saved();
        showToast('Added');
        renderWordOfTheDay();
        if (typeof updateTagFilters === 'function') updateTagFilters();
      }
    };
  }
};

window.nextWordOfTheDay = () => { 
  cachedWotd = { date: '', word: null, exampleHtml: '', meaning: '' }; 
  renderWordOfTheDay(); 
};

window.renderDashboard = () => {
  applyWidgetVisibility();
  
  renderWordOfTheDay();
  renderCountdown();
  renderQuickCaptures();

  const studiedDays = new Set(studyLogs.map(l => l.date));
  const tD = $('dash-total-days');
  if (tD) tD.textContent = studiedDays.size;
  
  let streak = 0;
  let currentD = new Date();
  let todayStr = todayDateStr();
  let lookback = 0;
  
  while (lookback < 365) {
    const dStr = `${currentD.getFullYear()}-${String(currentD.getMonth() + 1).padStart(2, '0')}-${String(currentD.getDate()).padStart(2, '0')}`;
    if (studiedDays.has(dStr) || freezeLogs.includes(dStr)) {
      streak++;
      currentD.setDate(currentD.getDate() - 1);
    } else if (dStr === todayStr) {
      currentD.setDate(currentD.getDate() - 1);
    } else {
      break;
    }
    lookback++;
  }
  
  const sN = $('dash-streak');
  if (sN) sN.textContent = streak;
  
  renderDashboardCalendar();
  
  const ys = $('dash-yearly-summary');
  if (ys && activeWidgets.includes('yearly')) {
    const curMonth = new Date().getMonth() + 1;
    if (yearlyPlan.goal || (yearlyPlan.months && yearlyPlan.months[curMonth])) {
      ys.classList.remove('hidden');
      $('dash-yearly-month').textContent = curMonth;
      $('dash-yearly-month-goal').textContent = yearlyPlan.months[curMonth] || 'Not set';
      $('dash-yearly-main-goal').textContent = yearlyPlan.goal || 'Not set';
    } else {
      ys.classList.add('hidden');
    }
  }

  if (activeWidgets.includes('weekly-chart')) {
    renderChartSafe('dash-weekly-chart', () => {
      const wCv = $('dash-weekly-chart');
      const now = new Date();
      now.setDate(now.getDate() - (dashWeeklyOffset * 7));
      const currentDay = now.getDay();
      const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diffToMonday);
      
      const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const data = [0, 0, 0, 0, 0, 0, 0];
      
      for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const logsForDay = studyLogs.filter(l => l.date === dStr);
        const totalSec = logsForDay.reduce((sum, l) => sum + l.seconds, 0);
        data[i] = Math.floor(totalSec / 60);
      }
      
      const lbl = $('dash-weekly-label');
      if (lbl) {
        if (dashWeeklyOffset === 0) lbl.textContent = t('label_this_week');
        else if (dashWeeklyOffset === 1) lbl.textContent = t('label_last_week');
        else lbl.textContent = `${dashWeeklyOffset} ${t('weeks_ago')}`;
      }

      if (dashWeeklyChart) dashWeeklyChart.destroy();
      dashWeeklyChart = new Chart(wCv, {
        type: 'bar',
        data: { labels, datasets: [{ label: 'Study Time (min)', data, backgroundColor: '#3B82F6', borderRadius: 6 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
      });
    });
  }

  const subjTotals = {};
  studyLogs.forEach(l => {
    subjTotals[l.subj] = (subjTotals[l.subj] || 0) + l.seconds;
  });
  
  if (activeWidgets.includes('subj-chart')) {
    renderChartSafe('dash-subj-chart', () => {
      const cv = $('dash-subj-chart');
      if (Object.keys(subjTotals).length === 0) {
        $('dash-subj-chart-card').classList.add('hidden'); 
      } else {
        $('dash-subj-chart-card').classList.remove('hidden');
        const labels = Object.keys(subjTotals).map(k => SCORE_SUBJECTS[k]?.label || k);
        const data = Object.values(subjTotals).map(v => Math.floor(v / 60));
        const goals = Object.keys(subjTotals).map(k => goalTimes[k] || 0);
        
        if (dashSubjChart) dashSubjChart.destroy();
        dashSubjChart = new Chart(cv, { 
          type: 'bar', 
          data: { 
            labels, 
            datasets: [
              { label: 'Study Time (min)', data, backgroundColor: '#3B82F6', borderRadius: 6 },
              { label: 'Target Time (min)', data: goals, type: 'line', borderColor: '#F97316', backgroundColor: 'transparent', borderDash: [5, 5], pointRadius: 0 }
            ] 
          }, 
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } } 
        });
      }
    });
  }

  if (activeWidgets.includes('radar-chart')) {
    renderChartSafe('dash-radar-chart', () => {
      const rCv = $('dash-radar-chart');
      if (Object.keys(subjTotals).length === 0) {
        $('dash-radar-chart-card').classList.add('hidden');
      } else {
        $('dash-radar-chart-card').classList.remove('hidden');
        const labels = ['English', 'Math', 'Japanese', 'Science', 'Social', 'Other'].map(k => SCORE_SUBJECTS[k.toLowerCase()]?.label || k);
        const keys = ['english', 'math', 'japanese', 'science', 'social', 'other'];
        const data = keys.map(k => Math.floor((subjTotals[k] || 0) / 60));
        if (dashRadarChart) dashRadarChart.destroy();
        dashRadarChart = new Chart(rCv, {
          type: 'radar',
          data: {
            labels,
            datasets: [{
              label: 'Study Time (min)',
              data,
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              borderColor: '#3B82F6',
              pointBackgroundColor: '#3B82F6',
              pointBorderColor: '#fff',
              pointHoverBackgroundColor: '#fff',
              pointHoverBorderColor: '#3B82F6'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { r: { angleLines: { display: true }, suggestedMin: 0 } }
          }
        });
      }
    });
  }

  if (Object.keys(srsData).length > 0) {
    if (activeWidgets.includes('srs-chart')) $('dash-srs-chart-card').classList.remove('hidden'); 
    if (activeWidgets.includes('srs-scatter')) $('dash-srs-scatter-card').classList.remove('hidden');
    if (activeWidgets.includes('stability-chart') && $('dash-stability-chart-card')) $('dash-stability-chart-card').classList.remove('hidden');
    
    const buckets = { today: 0, d1: 0, d3: 0, d7: 0, d14: 0 };
    const scatterData = [];
    let totalStability = 0;
    
    Object.values(srsData).forEach(r => {
      const diff = srsDaysDiff(srsNextDate(r));
      if (diff <= 0) buckets.today++;
      else if (diff === 1) buckets.d1++;
      else if (diff <= 3) buckets.d3++;
      else if (diff <= 7) buckets.d7++;
      else buckets.d14++;
      
      scatterData.push({ x: r.stability, y: r.difficulty });
      totalStability += r.stability;
    });
    
    if (activeWidgets.includes('srs-chart')) {
      renderChartSafe('dash-srs-chart', () => {
        const srsCv = $('dash-srs-chart');
        if (dashSrsChart) dashSrsChart.destroy();
        dashSrsChart = new Chart(srsCv, {
          type: 'bar',
          data: {
            labels: ['Today', '1 Day', 'Within 3 Days', 'Within 7 Days', '14+ Days'],
            datasets: [{
              label: 'Words',
              data: [buckets.today, buckets.d1, buckets.d3, buckets.d7, buckets.d14],
              backgroundColor: ['#EF4444', '#F97316', '#F59E0B', '#10B981', '#3B82F6'],
              borderRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 5 } } }
          }
        });
      });
    }
    
    if (activeWidgets.includes('srs-scatter')) {
      renderChartSafe('dash-srs-scatter', () => {
        const srsScatterCv = $('dash-srs-scatter');
        if (dashSrsScatter) dashSrsScatter.destroy();
        dashSrsScatter = new Chart(srsScatterCv, {
          type: 'scatter',
          data: {
            datasets: [{
              label: 'Word',
              data: scatterData,
              backgroundColor: 'rgba(59, 130, 246, 0.6)',
              pointRadius: 5
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { title: { display: true, text: 'Stability' }, min: 0 },
              y: { title: { display: true, text: 'Difficulty' }, min: 1, max: 10 }
            }
          }
        });
      });
    }
    
    if (activeWidgets.includes('stability-chart')) {
      renderChartSafe('dash-stability-chart', () => {
        const stabCv = $('dash-stability-chart');
        const avgStability = totalStability / Object.keys(srsData).length;
        if (dashStabilityChart) dashStabilityChart.destroy();
        dashStabilityChart = new Chart(stabCv, {
          type: 'bar',
          data: {
            labels: ['Current Average Retention'],
            datasets: [{
              label: 'Stability',
              data: [avgStability],
              backgroundColor: '#10B981',
              borderRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
          }
        });
      });
    }
  } else {
    if ($('dash-srs-chart-card')) $('dash-srs-chart-card').classList.add('hidden');
    if ($('dash-srs-scatter-card')) $('dash-srs-scatter-card').classList.add('hidden');
    if ($('dash-stability-chart-card')) $('dash-stability-chart-card').classList.add('hidden');
  }

  const hm = $('dash-heatmap');
  if (hm && activeWidgets.includes('heatmap')) {
    const mode = $('heatmap-mode-select') ? $('heatmap-mode-select').value : 'time';
    let html = '';
    const td = new Date();
    td.setHours(0, 0, 0, 0);
    const stD = new Date(td);
    stD.setDate(stD.getDate() - 89);
    
    for (let i = 0; i < stD.getDay(); i++) {
      html += `<div style="width:14px;height:14px;border-radius:3px;background:transparent;"></div>`;
    }
    
    const sMap = {}; 
    if (mode === 'time') {
      studyLogs.forEach(l => {
        sMap[l.date] = (sMap[l.date] || 0) + l.seconds;
      });
    } else if (mode === 'accuracy') {
      const accMap = {};
      dailyChallenges.forEach(d => {
        if (d.score !== null) {
          if (!accMap[d.date]) accMap[d.date] = [];
          accMap[d.date].push(d.score);
        }
      });
      Object.keys(accMap).forEach(k => {
        sMap[k] = accMap[k].reduce((a, b) => a + b, 0) / accMap[k].length;
      });
    } else if (mode === 'new_words') {
      Object.values(srsData).forEach(r => {
        if (r.lastReview && r.repetition === 0) {
          const d = new Date(r.lastReview);
          const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          sMap[ds] = (sMap[ds] || 0) + 1;
        }
      });
    }

    for (let i = 0; i < 90; i++) {
      const d = new Date(stD);
      d.setDate(d.getDate() + i);
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const val = sMap[ds] || 0;
      let bg = 'var(--bg2)'; 
      let title = `${ds}: 0`;
      
      if (val > 0) {
        if (mode === 'time') {
          bg = val < 1800 ? '#a8e6cf' : val < 3600 ? '#3d8361' : '#1c4b27';
          title = `${ds}: ${Math.floor(val / 60)} min`;
        } else if (mode === 'accuracy') {
          bg = val < 50 ? '#fde8e6' : val < 80 ? '#f1c40f' : '#27ae60';
          title = `${ds}: Accuracy ${Math.round(val)}%`;
        } else if (mode === 'new_words') {
          bg = val < 5 ? '#d4e6f1' : val < 15 ? '#2980b9' : '#154360';
          title = `${ds}: New ${val} words`;
        }
      }
      html += `<div style="width:14px;height:14px;border-radius:3px;background:${bg};cursor:pointer;" title="${title}" onclick="openStudyLogModal('${ds}')"></div>`;
    }
    hm.innerHTML = html;
    hm.scrollLeft = hm.scrollWidth;
  }

  const today = todayDateStr();
  const evL = $('dash-today-event-list');
  const plL = $('dash-today-plan-list');
  
  if (evL && activeWidgets.includes('today-plan')) {
    const evs = events[today] || [];
    if (evs.length) {
      evL.innerHTML = evs.map(e => `
        <div class="plan-item-row" style="margin-bottom:8px;border-left:4px solid #3B82F6;">
          <div class="pi-text" style="font-size:14px;">${esc(e.text)}</div>
        </div>
      `).join('');
    } else {
      evL.innerHTML = `<div style="font-size:13px;color:var(--text-muted);margin-bottom:12px">${getUiLang() === 'ja' ? '予定はありません' : 'No events'}</div>`;
    }
  }
  
  if (plL && activeWidgets.includes('today-plan')) {
    const pls = plans[today] || [];
    if (pls.length) {
      plL.innerHTML = pls.map((p, i) => `
        <div class="plan-item-row" style="margin-bottom:8px;">
          <input type="checkbox" ${p.done ? 'checked' : ''} onchange="toggleDashPlan(${i})">
          <div style="flex:1">
            <div class="pi-text ${p.done ? 'done' : ''}" style="font-size:14px;">${esc(p.text)}</div>
          </div>
        </div>
      `).join('');
    } else {
      plL.innerHTML = `<div style="font-size:13px;color:var(--text-muted);">${getUiLang() === 'ja' ? '計画はありません' : 'No plans'}</div>`;
    }
  }
  
  const tdL = $('dash-today-list');
  if (tdL && activeWidgets.includes('today-log')) {
    const logs = studyLogs.filter(l => l.date === today);
    if (logs.length) {
      tdL.innerHTML = logs.map(l => `
        <div class="study-log-item">
          <span class="sli-subj">${esc(SCORE_SUBJECTS[l.subj]?.label || l.subj)}</span>
          <span class="sli-dur">${Math.floor(l.seconds / 60)} min</span>
        </div>
      `).join('');
    } else {
      tdL.innerHTML = `<div style="font-size:13px;color:var(--text-muted);text-align:center;padding:12px">${getUiLang() === 'ja' ? '記録はありません' : 'No logs'}</div>`;
    }
  }
};

window.toggleDashPlan = i => {
  const today = todayDateStr();
  if (plans[today] && plans[today][i]) {
    plans[today][i].done = !plans[today][i].done;
    save.plans();
    renderDashboard();
    if (planMode === 'calendar') {
      renderPlanCalendar();
    }
  }
};

window.dashCalPrev = () => {
  dashCalMonth--;
  if (dashCalMonth < 0) {
    dashCalMonth = 11;
    dashCalYear--;
  }
  renderDashboardCalendar();
};

window.dashCalNext = () => {
  dashCalMonth++;
  if (dashCalMonth > 11) {
    dashCalMonth = 0;
    dashCalYear++;
  }
  renderDashboardCalendar();
};

const renderDashboardCalendar = () => {
  if (!activeWidgets.includes('calendar')) return;
  const cl = $('cal-month-label');
  if (cl) cl.textContent = `${dashCalYear} ${t('month_' + (dashCalMonth + 1))}`;
  
  const firstDay = new Date(dashCalYear, dashCalMonth, 1);
  const lastDay = new Date(dashCalYear, dashCalMonth + 1, 0);
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;
  
  let html = '';
  for (let i = 0; i < startDow; i++) {
    html += `<div class="cal-day other-month"></div>`;
  }
  
  const studiedDays = studyLogs.map(l => l.date);
  const todayStr = todayDateStr();
  
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const ds = `${dashCalYear}-${String(dashCalMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    let cls = 'cal-day';
    if (ds === todayStr) cls += ' today';
    if (studiedDays.includes(ds) || freezeLogs.includes(ds)) cls += ' studied';
    html += `<div class="${cls}">${d}</div>`;
  }
  
  const cd = $('cal-days');
  if (cd) cd.innerHTML = html;
};

// ============================================================
// [10] VOCAB
// ============================================================
const skeletonHtml = `
  <div class="skeleton-box mb-2" style="height: 28px; width: 50%; margin: 0 auto;"></div>
  <div class="skeleton-box mb-2" style="height: 16px; width: 80%; margin: 0 auto;"></div>
  <div class="skeleton-box" style="height: 16px; width: 60%; margin: 0 auto;"></div>
`;

const fetchFreeDictFallback = async (word) => {
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data[0]?.meanings[0]?.definitions[0]?.definition || null;
  } catch (e) {
    return null;
  }
};

window.toggleWordSave = w => {
  const idx = savedWords.indexOf(w);
  const add = idx === -1;
  
  if (add) {
    savedWords.push(w);
  } else {
    savedWords.splice(idx, 1);
  }
  
  save.saved();
  showToast(add ? (getUiLang() === 'ja' ? '保存しました' : 'Saved') : (getUiLang() === 'ja' ? '解除しました' : 'Removed'));
  
  document.querySelectorAll(`[data-word="${w.replace(/"/g, '\\"')}"]`).forEach(b => {
    b.className = add ? 'save-btn saved' : 'save-btn unsaved';
    b.textContent = add ? (getUiLang() === 'ja' ? '保存済' : 'Saved') : (getUiLang() === 'ja' ? '保存' : 'Save');
  });
};

const getWordProgress = w => wordProgress[w.toLowerCase()] || 'new';

const setWordProgress = (w, p) => {
  wordProgress[w.toLowerCase()] = p;
  save.prog();
};

window.cycleWordProgress = (w, e) => {
  if (e) e.stopPropagation();
  const o = ['new', 'learning', 'mastered'];
  setWordProgress(w, o[(o.indexOf(getWordProgress(w)) + 1) % o.length]);
  renderVocab(true);
  renderVocabStats();
};

window.deleteWord = w => {
  const idx = ALL_WORDS.findIndex(x => x.word.toLowerCase() === w.toLowerCase());
  if (idx === -1) return;
  const wordObj = ALL_WORDS[idx];
  
  ALL_WORDS.splice(idx, 1);
  savedWords = savedWords.filter(x => x.toLowerCase() !== w.toLowerCase());
  delete srsData[w.toLowerCase()];
  delete wordProgress[w.toLowerCase()];
  delete vocabMeta[w.toLowerCase()];
  
  customDecks.forEach(deck => {
    deck.cards = deck.cards.filter(c => c.front.toLowerCase() !== w.toLowerCase());
  });
  
  save.words();
  save.saved();
  save.srs();
  save.prog();
  save.meta();
  save.decks();
  
  const sr = $('search-result');
  if (sr) sr.innerHTML = '';
  
  closeModal('detail-modal');
  renderVocab(true);
  renderVocabStats();
  updateTagFilters();

  showUndoSnackbar(getUiLang() === 'ja' ? `"${w}" を削除しました` : `Deleted "${w}"`, () => {
    ALL_WORDS.unshift(wordObj);
    save.words();
    renderVocab(true);
    renderVocabStats();
    updateTagFilters();
  }, () => {});
};

window.openAddWordModal = (editWord = null) => {
  const tEl = $('add-word-modal-title');
  const w = $('manual-word-input');
  const m = $('manual-meaning-input');
  const p = $('manual-pos-input');
  const ex = $('manual-example-input');
  const nt = $('manual-note-input');
  const tg = $('manual-tags-input');
  const old = $('manual-word-old');
  
  if (editWord) {
    const fd = ALL_WORDS.find(x => x.word === editWord);
    if (fd) {
      tEl.textContent = getUiLang() === 'ja' ? '単語を編集' : 'Edit Word';
      w.value = fd.word;
      m.value = fd.meaning || '';
      old.value = fd.word;
      const meta = vocabMeta[fd.word.toLowerCase()];
      p.value = meta ? meta.pos : 'other';
      ex.value = fd.example || '';
      nt.value = fd.note || '';
      tg.value = (fd.tags || []).join(', ');
    }
  } else {
    tEl.textContent = getUiLang() === 'ja' ? '単語を手動追加' : 'Add Word Manually';
    w.value = '';
    m.value = '';
    old.value = '';
    p.value = 'other';
    ex.value = '';
    nt.value = '';
    tg.value = '';
  }
  
  const tags = new Set();
  ALL_WORDS.forEach(word => {
    if (word.tags) {
      word.tags.forEach(tag => tags.add(tag));
    }
  });
  
  const suggestArea = $('tag-suggest-area');
  if (suggestArea) {
    suggestArea.innerHTML = Array.from(tags).map(tag => `
      <button class="filter-chip" onclick="addTagToInput('${escJS(tag)}')">+ ${esc(tag)}</button>
    `).join('');
  }
  
  openModal('add-word-modal');
};

window.addTagToInput = (tag) => {
  const input = $('manual-tags-input');
  if (!input) return;
  let current = input.value.split(',').map(tStr => tStr.trim()).filter(Boolean);
  if (!current.includes(tag)) {
    current.push(tag);
    input.value = current.join(', ');
  }
};

window.addWordManual = () => {
  const w = $('manual-word-input').value.trim();
  const m = $('manual-meaning-input').value.trim();
  const p = $('manual-pos-input').value;
  const ex = $('manual-example-input').value.trim();
  const nt = $('manual-note-input').value.trim();
  const tg = $('manual-tags-input').value.split(',').map(x => x.trim()).filter(Boolean);
  const old = $('manual-word-old').value;
  
  if (!w) return showToast(getUiLang() === 'ja' ? '単語を入力してください' : 'Please enter a word');
  
  const newObj = { id: generateId(), word: w, meaning: m, example: ex, note: nt, tags: tg };
  let existingIdx = old ? ALL_WORDS.findIndex(x => x.word === old) : ALL_WORDS.findIndex(x => x.word.toLowerCase() === w.toLowerCase());
  
  if (old && old !== w) {
    if (ALL_WORDS.some(x => x.word.toLowerCase() === w.toLowerCase())) {
      return showToast(getUiLang() === 'ja' ? '既に登録されています' : 'Already registered');
    }
    if (savedWords.includes(old)) {
      savedWords = savedWords.filter(x => x !== old);
      savedWords.push(w);
    }
    if (srsData[old.toLowerCase()]) {
      srsData[w.toLowerCase()] = srsData[old.toLowerCase()];
      delete srsData[old.toLowerCase()];
    }
    if (wordProgress[old.toLowerCase()]) {
      wordProgress[w.toLowerCase()] = wordProgress[old.toLowerCase()];
      delete wordProgress[old.toLowerCase()];
    }
    if (vocabMeta[old.toLowerCase()]) {
      vocabMeta[w.toLowerCase()] = vocabMeta[old.toLowerCase()];
      delete vocabMeta[old.toLowerCase()];
    }
  } else if (!old && existingIdx >= 0) {
    return showToast(getUiLang() === 'ja' ? '既に登録されています' : 'Already registered');
  }
  
  if (existingIdx >= 0) {
    ALL_WORDS[existingIdx] = { ...ALL_WORDS[existingIdx], ...newObj, id: ALL_WORDS[existingIdx].id || newObj.id };
  } else {
    ALL_WORDS.unshift(newObj);
  }
  
  if (!vocabMeta[w.toLowerCase()]) {
    vocabMeta[w.toLowerCase()] = { pos: p, etym: '', affixes: '' };
  } else {
    vocabMeta[w.toLowerCase()].pos = p;
  }
  
  save.words();
  save.meta();
  save.saved();
  save.srs();
  save.prog();
  
  showToast(old ? (getUiLang() === 'ja' ? `更新しました: ${w}` : `Updated: ${w}`) : (getUiLang() === 'ja' ? `追加しました: ${w}` : `Added: ${w}`));
  closeModal('add-word-modal');
  renderVocab(true);
  renderVocabStats();
  updateTagFilters();
  
  if (old) {
    closeModal('detail-modal');
    setTimeout(() => showWordModal(w, m), 300);
  }
};

window.addDerivedWord = (word, meaning) => {
  if (ALL_WORDS.some(w => w.word.toLowerCase() === word.toLowerCase())) {
    showToast(getUiLang() === 'ja' ? '既に登録されています' : 'Already registered');
    return;
  }
  ALL_WORDS.unshift({ id: generateId(), word, meaning, example: '', tags: [] });
  save.words();
  showToast(getUiLang() === 'ja' ? `追加しました: ${word}` : `Added: ${word}`);
  updateTagFilters();
  renderVocab(true);
  renderVocabStats();
};

window.regenerateSearchWord = async (w) => {
  const i = $('word-input');
  if (i) i.value = w;
  searchWord();
};

window.searchWord = async (isSuggest = false) => {
  const i = $('word-input');
  if (!i) return;
  const w = i.value.trim();
  const s = $('word-suggest');
  const ld = $('loading');
  const sr = $('search-result');
  
  if (isSuggest) {
    if (!w) {
      if (s) s.innerHTML = '';
      return;
    }
    const hits = ALL_WORDS.filter(x => x.word.toLowerCase().startsWith(w.toLowerCase()) || (x.meaning || '').toLowerCase().includes(w.toLowerCase())).slice(0, 8);
    if (s) {
      s.innerHTML = hits.map(x => `
        <div class="word-chip" onclick="selectWord('${escJS(x.word)}')">
          <span class="wc-word">${esc(x.word)}</span>
          <div class="wc-right">
            <span class="wc-mean">${esc(x.meaning || '')}</span>
            <button class="vocab-speak audio-btn" onclick="speakWord('${escJS(x.word)}',event)">Audio</button>
          </div>
        </div>
      `).join('');
    }
    return;
  }

  if (!w) return;
  if (s) s.innerHTML = '';
  if (ld) {
    ld.innerHTML = skeletonHtml;
    ld.classList.remove('hidden');
  }
  if (sr) sr.innerHTML = '';
  
  const fd = ALL_WORDS.find(x => x.word.toLowerCase() === w.toLowerCase());
  const hint = fd && fd.meaning ? `（基本意味: ${fd.meaning}）` : '';
  
  try {
    const prompt = `入力された英単語「${w}」${hint}について、以下の【厳格な生成ルール】と【出力フォーマット】に完全に従って解説をHTMLで出力せよ。

【厳格な生成ルール】
1. 網羅性の絶対保証: 各項目の箇条書きの数はフォーマット例（2行）に一切縛られないこと。大学受験に必須とされる派生語、類義語、対義語、コロケーション、熟語、意味は、数を制限せず「漏れなく全て」列挙すること。
2. 出力の完全固定（ブレ防止）: AIの独自の解釈、出力ごとの表記ゆれ、フォーマットの逸脱を完全排除する。必ず指定された記号と形式に100%従うこと。
3. 出力制限: 挨拶、前置き、結論、その他の一切の会話文を禁止する。指定されたHTMLフォーマット部分のみを出力すること。
4. 文体固定: すべて「体言止め」または「極めて短い名詞句」で記述すること。動詞や形容詞での文末終了、「です・ます」「だ・である」の混入を完全禁止する。
5. 記号制限: 句読点（。、）およびカギ括弧（「」『』）の使用を完全禁止する。補足には半角の () のみを使用し、要素の区切りには半角の | を使用すること。
6. 余白統一: 記号 => + | の前後には、必ず半角スペースを1つ挿入すること。
7. 除外項目: 「品詞名（名詞・他動詞など）」および「活用形（-s・-ed・-ingなど）」の記述を一切禁止する。
8. 構文の統合: 特定の文型や構文（It ~ thatなど）はすべて「PHRASES & IDIOMS」の項目に統合すること。
9. 語源の柔軟性: 語源の構成要素は数に制限を設けず、単語の成り立ちに合わせて必要な数だけ + で繋ぐこと。

【出力フォーマット（HTML）】
<div class="vocab-detail-section">
  <h4>CORE CONCEPT</h4>
  <ul>
    <li>[コアイメージを端的に表す名詞句]</li>
    <li>[イメージからの派生論理を「→」で結んだ名詞句]</li>
  </ul>
  <h4>MEANINGS</h4>
  <ul>
    <li>[意味] ([ニュアンスを示す短い名詞句])</li>
    <li>[意味] ([ニュアンスを示す短い名詞句])</li>
  </ul>
  <h4>ETYMOLOGY</h4>
  <ul>
    <li>[要素] ([意味]) + [要素] ([意味]) + [要素] ([意味])</li>
    <li>[語源から現在の意味への繋がりを示す名詞句]</li>
  </ul>
  <h4>COLLOCATIONS</h4>
  <ul>
    <li><b>[単語 + 目的語/前置詞]</b> => [意味] ([直訳できないニュアンスを示す名詞句])</li>
  </ul>
  <h4>PHRASES & IDIOMS</h4>
  <ul>
    <li><b>[フレーズ・重要構文]</b> => [意味]</li>
  </ul>
  <h4>DERIVATIVES</h4>
  <ul>
    <li><b>[派生語]</b> => [意味] | 語源: [要素] ([意味]) + [要素] ([意味])</li>
  </ul>
  <h4>SYNONYMS</h4>
  <ul>
    <li><b>[類義語]</b> => [意味] ([ニュアンスを示す名詞句]) | 語源: [要素] ([意味]) + [要素] ([意味])</li>
  </ul>
  <h4>ANTONYMS</h4>
  <ul>
    <li><b>[対義語]</b> => [意味] ([ニュアンスを示す名詞句]) | 語源: [要素] ([意味]) + [要素] ([意味])</li>
  </ul>
</div>`;
    
    const rep = await callGemini([{ role: 'user', content: prompt }], 8192, 'HTML形式で出力せよ。', false);
    const html = clean(rep.replace(/```html?/g, '').replace(/```/g, '').trim());
    if (!html) throw new Error('Empty response');
    
    if (ld) ld.classList.add('hidden');
    
    let meaningText = 'Analysis Complete';
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const meaningsHeader = Array.from(tempDiv.querySelectorAll('h4')).find(h => h.textContent.includes('MEANINGS'));
    if (meaningsHeader && meaningsHeader.nextElementSibling && meaningsHeader.nextElementSibling.tagName === 'UL') {
      const firstLi = meaningsHeader.nextElementSibling.querySelector('li');
      if (firstLi) {
        meaningText = firstLi.textContent.split('(')[0].trim();
      }
    }
    if (fd && fd.meaning) meaningText = fd.meaning;

    if (!fd) {
      ALL_WORDS.push({ id: generateId(), word: w, meaning: meaningText, detailHtml: html });
      save.words();
      showToast(getUiLang() === 'ja' ? `追加しました: ${w}` : `Added: ${w}`);
      updateTagFilters();
    } else {
      fd.detailHtml = html;
      if (!fd.meaning) fd.meaning = meaningText;
      save.words();
    }
    
    const isSaved = savedWords.includes(w);
    const pt = `${w}\n${meaningText}\n${html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}`;
    
    if (sr) {
      sr.innerHTML = `
        <div class="card result-box">
          <div class="flex-between align-center mb-3 flex-wrap gap-2">
            <div class="result-word-header mb-0">
              <div class="result-word-title">${esc(w)}</div>
              <button class="speak-btn-large btn-pill btn-outline whitespace-nowrap" onclick="speakWord('${escJS(w)}',event)">${getUiLang() === 'ja' ? '発音' : 'Pronounce'}</button>
            </div>
            <div class="flex-gap-8 flex-wrap">
              <button data-word="${esc(w)}" class="save-btn whitespace-nowrap ${isSaved ? 'saved' : 'unsaved'}" onclick="toggleWordSave('${escJS(w)}')">${isSaved ? (getUiLang() === 'ja' ? '保存済' : 'Saved') : (getUiLang() === 'ja' ? '保存' : 'Save')}</button>
              <button class="copy-btn whitespace-nowrap" onclick="copyText(\`${pt.replace(/`/g, '\\`')}\`,this)">${getUiLang() === 'ja' ? 'コピー' : 'Copy'}</button>
              <button class="copy-btn text-danger whitespace-nowrap" style="border-color:#f0d4d0;" onclick="deleteWord('${escJS(w)}')">${getUiLang() === 'ja' ? '削除' : 'Delete'}</button>
            </div>
          </div>
          <div class="result-meaning-badge">${esc(meaningText)}</div>
          ${html}
          <div class="text-center mt-4">
            <button class="btn-pill btn-outline whitespace-nowrap" onclick="regenerateSearchWord('${escJS(w)}')">${getUiLang() === 'ja' ? '再生成' : 'Regenerate'}</button>
          </div>
        </div>
      `;
    }
  } catch (e) {
    const fallbackMeaning = await fetchFreeDictFallback(w);
    if (ld) ld.classList.add('hidden');
    if (fallbackMeaning) {
      if (!fd) {
        ALL_WORDS.push({ id: generateId(), word: w, meaning: fallbackMeaning, detailHtml: `<p>${esc(fallbackMeaning)}</p>` });
        save.words();
        showToast(getUiLang() === 'ja' ? `追加しました: ${w}` : `Added: ${w}`);
        updateTagFilters();
      }
      if (sr) {
        sr.innerHTML = `
          <div class="card result-box">
            <div class="result-word-title">${esc(w)}</div>
            <div class="result-meaning-badge">${esc(fallbackMeaning)}</div>
            <p class="text-sm text-muted">* Displaying free dictionary API results due to AI analysis failure.</p>
          </div>
        `;
      }
    } else {
      handleApiError(e, 'search-result');
    }
  }
};

window.selectWord = w => {
  const i = $('word-input');
  if (i) {
    i.value = w;
    const s = $('word-suggest');
    if (s) s.innerHTML = '';
    searchWord();
  }
};

window.regenerateWordDetail = async (w) => {
  const mc = $('modal-detail-content');
  if (!mc) return;
  mc.innerHTML = `<div class="p-20">${skeletonHtml}</div>`;
  try {
    const prompt = `入力された英単語「${w}」について、以下の【厳格な生成ルール】と【出力フォーマット】に完全に従って解説をHTMLで出力せよ。

【厳格な生成ルール】
1. 網羅性の絶対保証: 各項目の箇条書きの数はフォーマット例（2行）に一切縛られないこと。大学受験に必須とされる派生語、類義語、対義語、コロケーション、熟語、意味は、数を制限せず「漏れなく全て」列挙すること。
2. 出力の完全固定（ブレ防止）: AIの独自の解釈、出力ごとの表記ゆれ、フォーマットの逸脱を完全排除する。必ず指定された記号と形式に100%従うこと。
3. 出力制限: 挨拶、前置き、結論、その他の一切の会話文を禁止する。指定されたHTMLフォーマット部分のみを出力すること。
4. 文体固定: すべて「体言止め」または「極めて短い名詞句」で記述すること。動詞や形容詞での文末終了、「です・ます」「だ・である」の混入を完全禁止する。
5. 記号制限: 句読点（。、）およびカギ括弧（「」『』）の使用を完全禁止する。補足には半角の () のみを使用し、要素の区切りには半角の | を使用すること。
6. 余白統一: 記号 => + | の前後には、必ず半角スペースを1つ挿入すること。
7. 除外項目: 「品詞名（名詞・他動詞など）」および「活用形（-s・-ed・-ingなど）」の記述を一切禁止する。
8. 構文の統合: 特定の文型や構文（It ~ thatなど）はすべて「PHRASES & IDIOMS」の項目に統合すること。
9. 語源の柔軟性: 語源の構成要素は数に制限を設けず、単語の成り立ちに合わせて必要な数だけ + で繋ぐこと。

【出力フォーマット（HTML）】
<div class="vocab-detail-section">
  <h4>CORE CONCEPT</h4>
  <ul>
    <li>[コアイメージを端的に表す名詞句]</li>
    <li>[イメージからの派生論理を「→」で結んだ名詞句]</li>
  </ul>
  <h4>MEANINGS</h4>
  <ul>
    <li>[意味] ([ニュアンスを示す短い名詞句])</li>
    <li>[意味] ([ニュアンスを示す短い名詞句])</li>
  </ul>
  <h4>ETYMOLOGY</h4>
  <ul>
    <li>[要素] ([意味]) + [要素] ([意味]) + [要素] ([意味])</li>
    <li>[語源から現在の意味への繋がりを示す名詞句]</li>
  </ul>
  <h4>COLLOCATIONS</h4>
  <ul>
    <li><b>[単語 + 目的語/前置詞]</b> => [意味] ([直訳できないニュアンスを示す名詞句])</li>
  </ul>
  <h4>PHRASES & IDIOMS</h4>
  <ul>
    <li><b>[フレーズ・重要構文]</b> => [意味]</li>
  </ul>
  <h4>DERIVATIVES</h4>
  <ul>
    <li><b>[派生語]</b> => [意味] | 語源: [要素] ([意味]) + [要素] ([意味])</li>
  </ul>
  <h4>SYNONYMS</h4>
  <ul>
    <li><b>[類義語]</b> => [意味] ([ニュアンスを示す名詞句]) | 語源: [要素] ([意味]) + [要素] ([意味])</li>
  </ul>
  <h4>ANTONYMS</h4>
  <ul>
    <li><b>[対義語]</b> => [意味] ([ニュアンスを示す名詞句]) | 語源: [要素] ([意味]) + [要素] ([意味])</li>
  </ul>
</div>`;
    const rep = await callGemini([{ role: 'user', content: prompt }], 8192, 'HTML形式で出力せよ。', false);
    const parsedHtml = clean(rep.replace(/```html?/g, '').replace(/```/g, '').trim());
    if (!parsedHtml) throw new Error('Empty response');
    
    const fd = ALL_WORDS.find(x => x.word === w);
    if (fd) {
      fd.detailHtml = parsedHtml;
      save.words();
    }
    mc.innerHTML = `
      <div class="mt-4">${parsedHtml}</div>
      <div class="text-center mt-4">
        <button class="btn-pill btn-outline whitespace-nowrap" onclick="regenerateWordDetail('${escJS(w)}')">${getUiLang() === 'ja' ? '再生成' : 'Regenerate'}</button>
      </div>
    `;
  } catch (e) {
    handleApiError(e, 'modal-detail-content');
  }
};

window.showWordModal = async (w, m) => {
  const isS = savedWords.includes(w);
  const p = getWordProgress(w);
  const mb = $('modal-body');
  if (!mb) return;
  
  const fd = ALL_WORDS.find(x => x.word === w);
  
  let tagsHtml = '';
  if (fd && fd.tags && fd.tags.length) {
    tagsHtml = `
      <div class="flex gap-2 mb-3 flex-wrap">
        ${fd.tags.map(tStr => `<span class="filter-chip" style="font-size:calc(10px * var(--text-scale));padding:4px 8px;">${esc(tStr)}</span>`).join('')}
      </div>
    `;
  }
  
  mb.innerHTML = `
    <div class="word-detail-header">
      <div class="word-detail-title-row">
        <div class="result-word-title">${esc(w)}</div>
        <button class="speak-btn-large btn-pill btn-outline whitespace-nowrap" onclick="speakWord('${escJS(w)}',event)">${getUiLang() === 'ja' ? '発音' : 'Pronounce'}</button>
      </div>
      <div class="word-detail-actions">
        <span class="prog-badge ${p}" onclick="cycleWordProgress('${escJS(w)}',event)" style="cursor:pointer;">${t('prog_' + p)}</span>
        <button data-word="${esc(w)}" class="save-btn whitespace-nowrap ${isS ? 'saved' : 'unsaved'}" onclick="toggleWordSave('${escJS(w)}')">${isS ? (getUiLang() === 'ja' ? '保存済' : 'Saved') : (getUiLang() === 'ja' ? '保存' : 'Save')}</button>
        <button class="copy-btn whitespace-nowrap" onclick="openAddWordModal('${escJS(w)}')">${getUiLang() === 'ja' ? '編集' : 'Edit'}</button>
        <button class="copy-btn text-danger whitespace-nowrap" style="border-color:#f0d4d0;" onclick="deleteWord('${escJS(w)}')">${getUiLang() === 'ja' ? '削除' : 'Delete'}</button>
      </div>
    </div>
    ${tagsHtml}
    <div class="result-meaning-badge">${esc(m || '')}</div>
    <div id="modal-detail-content" class="result-box"><div class="p-20">${skeletonHtml}</div></div>
  `;
  
  openModal('detail-modal');
  
  const chartContainer = $('word-retention-chart-container');
  const r = srsData[w.toLowerCase()];
  if (r && chartContainer) {
    chartContainer.classList.remove('hidden');
    const ctx = $('word-retention-chart');
    const labels = [];
    const data = [];
    for (let i = 0; i <= 14; i++) {
      labels.push(i === 0 ? 'Today' : `${i} Days`);
      const safeStability = Math.max(0.1, r.stability);
      const ret = Math.exp(Math.log(0.9) * i / safeStability) * 100;
      data.push(ret);
    }
    if (wordRetentionChart) wordRetentionChart.destroy();
    wordRetentionChart = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets: [{ label: 'Retention Rate (%)', data, borderColor: '#3B82F6', backgroundColor: 'rgba(59, 130, 246, 0.2)', fill: true, tension: 0.4 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { min: 0, max: 100 } } }
    });
    
    $('fsrs-edit-stability').value = r.stability.toFixed(2);
    $('fsrs-edit-difficulty').value = r.difficulty.toFixed(2);
    if (r.lastReview) {
      const nextD = new Date(new Date(r.lastReview).getTime() + (r.interval || 1) * 86400000);
      $('fsrs-edit-next').value = nextD.toISOString().split('T')[0];
    }
  } else if (chartContainer) {
    chartContainer.classList.add('hidden');
    $('fsrs-edit-stability').value = '';
    $('fsrs-edit-difficulty').value = '';
    $('fsrs-edit-next').value = '';
  }
  
  const mc = $('modal-detail-content');
  if (!localStorage.getItem('study_gemini_api_key')) {
    if (mc) mc.innerHTML = 'API Key not set';
    return;
  }
  
  let customHtml = '';
  if (fd && (fd.example || fd.note)) {
    customHtml = `<div class="mb-4 p-16 bg-main radius-sm border">`;
    if (fd.example) {
      customHtml += `
        <p class="text-xs font-bold text-muted mb-2">Example</p>
        <p class="text-sm mb-3 line-height-16">${esc(fd.example)} <button class="btn-clear text-accent" onclick="speakWord('${escJS(fd.example)}',event)">Pronounce</button></p>
      `;
    }
    if (fd.note) {
      customHtml += `
        <p class="text-xs font-bold text-muted mb-2">Note</p>
        <p class="text-sm line-height-16">${esc(fd.note)}</p>
      `;
    }
    customHtml += `</div>`;
  }
  
  if (fd && fd.detailHtml) {
    mc.innerHTML = customHtml + `
      <div class="mt-4">${clean(fd.detailHtml)}</div>
      <div class="text-center mt-4">
        <button class="btn-pill btn-outline whitespace-nowrap" onclick="regenerateWordDetail('${escJS(w)}')">${getUiLang() === 'ja' ? '再生成' : 'Regenerate'}</button>
      </div>
    `;
  } else {
    regenerateWordDetail(w);
  }
  
  const imgContainer = $('modal-image-container');
  if (imgContainer) imgContainer.innerHTML = '';
};

window.saveFsrsEdit = () => {
  const titleEl = document.querySelector('#modal-body .result-word-title');
  if (!titleEl) return;
  const w = titleEl.textContent;
  const s = parseFloat($('fsrs-edit-stability').value);
  const d = parseFloat($('fsrs-edit-difficulty').value);
  const n = $('fsrs-edit-next').value;
  
  if (!w || isNaN(s) || isNaN(d) || !n) return showToast('Invalid input');
  
  const r = srsData[w.toLowerCase()] || { interval: 1 };
  const nextTime = new Date(n).getTime();
  const lastTime = nextTime - (r.interval * 86400000);
  
  srsData[w.toLowerCase()] = {
    ...r,
    stability: s,
    difficulty: d,
    lastReview: new Date(lastTime).toISOString()
  };
  
  save.srs();
  showToast('FSRS data updated');
  renderVocab(true);
};

window.resetFsrsData = () => {
  const titleEl = document.querySelector('#modal-body .result-word-title');
  if (!titleEl) return;
  const w = titleEl.textContent;
  if (!confirm(getUiLang() === 'ja' ? 'この単語の学習履歴をリセットしますか？' : 'Reset study history for this word?')) return;
  
  delete srsData[w.toLowerCase()];
  setWordProgress(w, 'new');
  save.srs();
  save.prog();
  showToast('Reset complete');
  closeModal('detail-modal');
  renderVocab(true);
};

const highlightText = (text, query) => {
  if (!query) return esc(text);
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return esc(text).replace(regex, '<mark style="background:rgba(249,115,22,0.3);color:inherit;padding:0 2px;border-radius:2px;">$1</mark>');
};

window.setPosFilter = p => {
  vocabPosFilter = p;
  document.querySelectorAll('#pos-filters .filter-chip').forEach(b => {
    b.classList.toggle('active', b.dataset.pos === p);
  });
  renderVocab(true);
};

window.setProgFilter = p => {
  vocabProgFilter = p;
  document.querySelectorAll('#prog-filters .filter-chip').forEach(b => {
    b.classList.toggle('active', b.dataset.prog === p);
  });
  renderVocab(true);
};

window.setTagFilter = tStr => {
  vocabTagFilter = tStr;
  document.querySelectorAll('#tag-filters .filter-chip').forEach(b => {
    b.classList.toggle('active', b.dataset.tag === tStr);
  });
  renderVocab(true);
};

window.setPrefixFilter = v => {
  vocabPrefixFilter = v.trim().toLowerCase();
  const b = $('prefix-clear-btn');
  if (b) {
    if (vocabPrefixFilter) b.classList.remove('hidden');
    else b.classList.add('hidden');
  }
  renderVocab(true);
};

window.clearPrefixFilter = () => {
  vocabPrefixFilter = '';
  const i = $('prefix-search-input');
  const b = $('prefix-clear-btn');
  if (i) i.value = '';
  if (b) b.classList.add('hidden');
  renderVocab(true);
};

const updateTagFilters = () => {
  const tags = new Set();
  ALL_WORDS.forEach(w => {
    if (w.tags) w.tags.forEach(tStr => tags.add(tStr));
  });
  
  const c = $('tag-filters');
  const cs = $('cards-tag-select');
  
  if (c) {
    c.innerHTML = `
      <button class="filter-chip ${vocabTagFilter === 'all' ? 'active' : ''}" data-tag="all" onclick="setTagFilter('all')">${t('tag_all')}</button>
    ` + Array.from(tags).map(tStr => `
      <button class="filter-chip ${vocabTagFilter === tStr ? 'active' : ''}" data-tag="${esc(tStr)}" onclick="setTagFilter('${escJS(tStr)}')">${esc(tStr)}</button>
    `).join('');
  }
  
  if (cs) {
    cs.innerHTML = `
      <option value="all">${t('tag_all')}</option>
    ` + Array.from(tags).map(tStr => `
      <option value="${esc(tStr)}">${esc(tStr)}</option>
    `).join('');
  }
};

window.openTagManagerModal = () => {
  openModal('tag-manager-modal');
  const tags = new Set();
  ALL_WORDS.forEach(w => {
    if (w.tags) w.tags.forEach(tStr => tags.add(tStr));
  });
  $('tag-manager-list').innerHTML = Array.from(tags).map(tStr => `
    <div class="flex-between align-center card p-16 mb-2">
      <span class="font-bold">${esc(tStr)}</span>
      <button class="btn-clear text-danger whitespace-nowrap" onclick="deleteTagGlobally('${escJS(tStr)}')">${getUiLang() === 'ja' ? '削除' : 'Delete'}</button>
    </div>
  `).join('');
};

window.deleteTagGlobally = (tag) => {
  if (!confirm(getUiLang() === 'ja' ? `タグ "${tag}" をすべての単語から削除しますか？` : `Delete tag "${tag}" from all words?`)) return;
  ALL_WORDS.forEach(w => {
    if (w.tags) w.tags = w.tags.filter(tStr => tStr !== tag);
  });
  save.words();
  updateTagFilters();
  window.openTagManagerModal();
  showToast('Deleted');
};

window.analyzeVocabMeta = async () => {
  const b = $('analyze-meta-btn');
  const s = $('meta-status');
  if (!localStorage.getItem('study_gemini_api_key')) return showToast('API Key not set');
  
  const u = ALL_WORDS.filter(w => !vocabMeta[w.word.toLowerCase()]);
  if (!u.length) return showToast('Already complete');
  
  if (b) {
    b.disabled = true;
    b.textContent = 'Analyzing...';
  }
  
  let done = 0;
  try {
    for (let i = 0; i < u.length; i += 40) {
      const bt = u.slice(i, i + 40);
      if (s) s.textContent = `${done}/${u.length} Analyzed`;
      
      const raw = await callGemini([{ role: 'user', content: `JSON array:[{"word":"...","pos":"...","etym":"...","affixes":"..."}]. Words: ${bt.map(x => x.word).join(',')}` }], 8192, 'JSON形式で出力せよ。', true);
      const parsed = extractJSON(raw);
      
      if (parsed && Array.isArray(parsed)) {
        parsed.forEach(x => {
          if (x.word) {
            vocabMeta[x.word.toLowerCase()] = {
              pos: x.pos || 'other',
              etym: x.etym || 'Other',
              affixes: x.affixes || ''
            };
          }
        });
      }
      save.meta();
      done += bt.length;
      if (i + 40 < u.length) await sleep(4000);
    }
  } catch (e) {
    showToast('Communication error');
  } finally {
    if (b) {
      b.disabled = false;
      b.textContent = getUiLang() === 'ja' ? '品詞・語源を解析' : 'Analyze POS & Etymology';
    }
    if (s) s.textContent = 'Complete';
    renderVocab(true);
  }
};

const renderVocabStats = () => {
  const m = ALL_WORDS.filter(w => getWordProgress(w.word) === 'mastered').length;
  const l = ALL_WORDS.filter(w => getWordProgress(w.word) === 'learning').length;
  const b = $('vocab-stats-bar');
  if (b) {
    b.innerHTML = `
      <div class="vsb-item">
        <div class="vsb-num">${ALL_WORDS.length}</div>
        <div class="vsb-label">${t('label_total')}</div>
      </div>
      <div class="vsb-item">
        <div class="vsb-num text-green">${m}</div>
        <div class="vsb-label">${t('label_mastered')}</div>
      </div>
      <div class="vsb-item">
        <div class="vsb-num text-streak">${l}</div>
        <div class="vsb-label">${t('label_learning')}</div>
      </div>
    `;
  }
};

let currentFilteredWords = [];

window.renderVocab = (reset = false) => {
  const vi = $('vocab-search');
  const q = vi ? vi.value.toLowerCase() : '';
  const sortMode = $('vocab-sort-select') ? $('vocab-sort-select').value : 'newest';
  
  let ls = ALL_WORDS.filter(w => {
    if (q && !w.word.toLowerCase().includes(q) && !(w.meaning || '').toLowerCase().includes(q)) return false;
    const m = vocabMeta[w.word.toLowerCase()];
    if (vocabPosFilter !== 'all' && (!m || m.pos !== vocabPosFilter)) return false;
    if (vocabProgFilter !== 'all' && getWordProgress(w.word) !== vocabProgFilter) return false;
    if (vocabTagFilter !== 'all' && (!w.tags || !w.tags.includes(vocabTagFilter))) return false;
    if (vocabPrefixFilter) {
      const a = m?.affixes?.toLowerCase() || '';
      if (!w.word.toLowerCase().includes(vocabPrefixFilter) && !a.includes(vocabPrefixFilter)) return false;
    }
    return true;
  });
  
  if (sortMode === 'oldest') {
    ls = ls.reverse();
  } else if (sortMode === 'az') {
    ls.sort((a, b) => a.word.localeCompare(b.word));
  } else if (sortMode === 'za') {
    ls.sort((a, b) => b.word.localeCompare(a.word));
  } else if (sortMode === 'low_retention') {
    ls.sort((a, b) => {
      const rA = srsData[a.word.toLowerCase()]?.stability || 0;
      const rB = srsData[b.word.toLowerCase()]?.stability || 0;
      return rA - rB;
    });
  }
  
  currentFilteredWords = ls;
  
  const vc = $('vocab-count');
  const vg = $('vocab-grid');
  const btn = $('vocab-load-more-btn');
  const bulk = $('vocab-bulk-actions');
  
  if (vc) vc.textContent = `${ls.length} / ${ALL_WORDS.length} Words`;
  if (bulk) {
    if (ls.length > 0 && ls.length < ALL_WORDS.length) bulk.classList.remove('hidden');
    else bulk.classList.add('hidden');
  }
  
  if (!vg) return;
  if (reset) {
    vocabPage = 1;
    vg.innerHTML = '';
  }
  
  if (!ALL_WORDS.length) {
    vg.innerHTML = `<div class="vocab-empty">${getUiLang() === 'ja' ? '空です' : 'Empty'}</div>`;
    if (btn) btn.classList.add('hidden');
    return;
  }
  
  const posL = { noun: 'N', verb: 'V', adjective: 'Adj', adverb: 'Adv', other: 'Oth' };
  const itemsToRender = ls.slice((vocabPage - 1) * VOCAB_PER_PAGE, vocabPage * VOCAB_PER_PAGE);
  
  const fragment = document.createDocumentFragment();
  itemsToRender.forEach(w => {
    const m = vocabMeta[w.word.toLowerCase()];
    const pb = m ? `<span class="pos-badge" style="background:var(--bg2);color:var(--text-muted);font-size:11px;padding:4px 6px;border-radius:6px;">${posL[m.pos] || 'Oth'}</span>` : '';
    const p = getWordProgress(w.word);
    const div = document.createElement('div');
    div.className = 'vocab-item';
    div.setAttribute('role', 'button');
    div.tabIndex = 0;
    div.onclick = () => showWordModal(w.word, w.meaning || '');
    
    const displayWord = highlightText(w.word, q);
    const displayMeaning = highlightText(w.meaning || '', q);
    
    div.innerHTML = `
      <div class="vi-left">
        <button class="vocab-speak audio-btn p-8" onclick="speakWord('${escJS(w.word)}',event)">Audio</button>
        ${pb}
        <span class="vi-word">${displayWord}</span>
      </div>
      <div class="vi-right">
        <span class="prog-badge ${p}" onclick="cycleWordProgress('${escJS(w.word)}',event)">${t('prog_' + p)}</span>
        <span class="vi-mean">${displayMeaning}</span>
      </div>
    `;
    fragment.appendChild(div);
  });
  
  vg.appendChild(fragment);
  
  if (btn) {
    if (vocabPage * VOCAB_PER_PAGE < ls.length) btn.classList.remove('hidden');
    else btn.classList.add('hidden');
  }
};

window.loadMoreVocab = () => {
  vocabPage++;
  renderVocab(false);
};

window.bulkTagWords = () => {
  if (!currentFilteredWords.length) return;
  const tag = prompt(getUiLang() === 'ja' ? `表示中の ${currentFilteredWords.length} 単語に追加するタグを入力:` : `Enter tag to add to the currently displayed ${currentFilteredWords.length} words:`);
  if (!tag || !tag.trim()) return;
  const tStr = tag.trim();
  currentFilteredWords.forEach(w => {
    if (!w.tags) w.tags = [];
    if (!w.tags.includes(tStr)) w.tags.push(tStr);
  });
  save.words();
  updateTagFilters();
  renderVocab(true);
  showToast('Bulk tagging complete');
};

window.bulkResetProgress = () => {
  if (!currentFilteredWords.length) return;
  if (!confirm(getUiLang() === 'ja' ? `表示中の ${currentFilteredWords.length} 単語の学習進捗をリセットしますか？` : `Reset learning progress (FSRS) for the currently displayed ${currentFilteredWords.length} words?`)) return;
  currentFilteredWords.forEach(w => {
    delete srsData[w.word.toLowerCase()];
    setWordProgress(w.word, 'new');
  });
  save.srs();
  save.prog();
  renderVocab(true);
  renderVocabStats();
  showToast('Progress reset');
};

window.bulkDeleteWords = () => {
  if (!currentFilteredWords.length) return;
  if (!confirm(getUiLang() === 'ja' ? `表示中の ${currentFilteredWords.length} 単語を完全に削除しますか？この操作は元に戻せません。` : `Permanently delete the currently displayed ${currentFilteredWords.length} words? This action cannot be undone.`)) return;
  const wordsToDelete = new Set(currentFilteredWords.map(w => w.word.toLowerCase()));
  ALL_WORDS = ALL_WORDS.filter(w => !wordsToDelete.has(w.word.toLowerCase()));
  wordsToDelete.forEach(w => {
    savedWords = savedWords.filter(x => x.toLowerCase() !== w);
    delete srsData[w];
    delete wordProgress[w];
    delete vocabMeta[w];
  });
  save.words();
  save.saved();
  save.srs();
  save.prog();
  save.meta();
  renderVocab(true);
  renderVocabStats();
  updateTagFilters();
  showToast('Bulk deletion complete');
};

window.printWordTest = () => {
  const targets = ALL_WORDS.filter(w => getWordProgress(w.word) !== 'mastered');
  if (!targets.length) return showToast('No words to review');
  const words = [...targets].sort(() => 0.5 - Math.random()).slice(0, 50);
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <title>Vocabulary Quiz</title>
      <style>
        body{font-family:sans-serif;padding:20px}
        table{width:100%;border-collapse:collapse}
        th,td{border:1px solid #ccc;padding:10px}
        th{background:#f9f9f9}
        .btn{display:block;width:180px;margin:0 auto 20px;padding:10px;text-align:center;background:#111;color:#fff;border-radius:50px;cursor:pointer}
        @media print{.btn{display:none}}
      </style>
    </head>
    <body>
      <button class="btn" onclick="window.print()">Print</button>
      <h1>Vocabulary Quiz</h1>
      <table>
        <tr><th>Word</th><th style="width:60%">Meaning</th></tr>
        ${words.map(w => `<tr><td>${esc(w.word)}</td><td></td></tr>`).join('')}
      </table>
    </body>
    </html>
  `;
  printHtml(html);
};

window.exportVocabPDF = () => {
  if (!ALL_WORDS.length) return showToast('No words');
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <title>Vocabulary List</title>
      <style>
        body{font-family:sans-serif;padding:20px;font-size:13px}
        table{width:100%;border-collapse:collapse}
        th,td{border:1px solid #ddd;padding:8px}
        th{background:#f5f5f5}
        .mastered{color:#10B981;font-weight:bold}
        .learning{color:#F59E0B;font-weight:bold}
        .new{color:#94A3B8}
        .btn{display:block;width:180px;margin:0 auto 20px;padding:10px;text-align:center;background:#111;color:#fff;border-radius:50px;cursor:pointer}
        @media print{.btn{display:none}}
      </style>
    </head>
    <body>
      <button class="btn" onclick="window.print()">Print</button>
      <h1>Vocabulary List (${ALL_WORDS.length} words)</h1>
      <table>
        <tr><th>Word</th><th>Meaning</th><th>Progress</th></tr>
        ${ALL_WORDS.map(w => {
          const p = getWordProgress(w.word);
          return `<tr><td><b>${esc(w.word)}</b></td><td>${esc(w.meaning || '')}</td><td class="${p}">${t('prog_' + p)}</td></tr>`;
        }).join('')}
      </table>
    </body>
    </html>
  `;
  printHtml(html);
};

// ============================================================
// [12] SKILL UP
// ============================================================
window.switchWritingTab = tStr => {
  ['input', 'daily', 'quiz', 'media', 'shadowing', 'syntax', 'history'].forEach(x => {
    const tb = $('wtab-' + x);
    const pn = $('wpane-' + x);
    if (tb) {
      if (x === tStr) tb.classList.add('active');
      else tb.classList.remove('active');
    }
    if (pn) {
      if (x === tStr) pn.classList.add('active');
      else pn.classList.remove('active');
    }
  });
  if (tStr === 'history') renderWritingHistory();
  if (tStr === 'daily') {
    window.switchDailyTab(currentDailyTab);
    renderDaily();
  }
  if (tStr === 'syntax') renderSyntax();
};

window.setWritingInputMode = m => {
  wInputMode = m;
  ['text', 'file', 'photo'].forEach(x => {
    const btn = $('wmode-' + x);
    const area = $('w-' + x + '-area');
    if (btn) {
      if (x === m) btn.classList.add('active');
      else btn.classList.remove('active');
    }
    if (area) {
      if (x === m) area.classList.remove('hidden');
      else area.classList.add('hidden');
    }
  });
};

window.handleWritingFile = e => {
  const f = e.target.files[0];
  if (!f) return;
  const fn = $('writing-file-name');
  const ft = $('writing-file-text');
  if (fn) fn.textContent = f.name;
  const r = new FileReader();
  r.onload = ev => {
    if (ft) ft.value = ev.target.result;
  };
  r.readAsText(f);
};

window.handleWritingPhoto = e => {
  const f = e.target.files[0];
  if (!f) return;
  openImageCropper(f, (croppedDataUrl) => {
    wPhotoData = croppedDataUrl;
    const wp = $('writing-photo-preview');
    if (wp) wp.innerHTML = `<img src="${wPhotoData}" style="max-width:100%;border-radius:10px">`;
    const qb = $('writing-photo-quiz-btn');
    if (qb) qb.classList.remove('hidden');
  });
};

window.generateQuizFromPhoto = async () => {
  if (!wPhotoData) return showToast('Please select a photo');
  const b = wPhotoData.split(',')[1];
  const m = wPhotoData.match(/data:([^;]+)/)[1];
  const ld = $('writing-loading');
  const rs = $('writing-result');
  
  if (ld) {
    ld.innerHTML = skeletonHtml;
    ld.classList.remove('hidden');
  }
  if (rs) rs.innerHTML = '';
  
  try {
    const prompt = `この画像内の英文や内容から、内容理解を問う4択クイズを3問作成し、HTMLで出力せよ。必ず以下の構造に従うこと：
<h4>Question 1</h4>
<p>[問題文]</p>
<ul>
  <li>[選択肢1]</li>
  <li>[選択肢2]</li>
  <li>[選択肢3]</li>
  <li>[選択肢4]</li>
</ul>
<h4>Answer & Explanation</h4>
<p>Answer: [正解]<br>Explanation: [解説。文末は「〜だ。」]</p>`;

    const rep = await callGemini([{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: m, data: b } },
        { type: 'text', text: prompt }
      ]
    }], 8192);
    if (rs) rs.innerHTML = `<div class="card">${clean(rep.replace(/```html?/g, '').replace(/```/g, ''))}</div>`;
  } catch (e) {
    if (rs) handleApiError(e, 'writing-result');
  } finally {
    if (ld) ld.classList.add('hidden');
  }
};

const extractSyntaxFromText = async text => {
  showToast('Extracting syntax...');
  try {
    const rep = await callGemini([{ role: 'user', content: text }], 8192, '大学受験レベルの重要構文を抽出し、JSON配列のみで出力せよ。形式:[{"syntax":"...","meaning":"...（体言止め）","note":"...（文末は「〜だ。」）"}]', true);
    const arr = extractJSON(rep);
    if (!arr || !arr.length) return showToast('No syntax found');
    
    let added = 0;
    arr.forEach(item => {
      if (item.syntax) {
        syntaxList.unshift({
          id: generateId(),
          syntax: item.syntax,
          meaning: item.meaning || '',
          note: item.note || '',
          date: new Date().toLocaleDateString('en-US')
        });
        added++;
      }
    });
    
    if (added > 0) {
      save.syntax();
      const pn = $('wpane-syntax');
      if (pn && pn.classList.contains('active')) renderSyntax();
      showToast(`${added} saved`);
    }
  } catch (e) {
    showToast('Communication error');
  }
};

window.extractSyntaxFromHistory = async id => {
  const h = writingHistory.find(x => String(x.id) === String(id));
  if (!h) return;
  await extractSyntaxFromText(h.original + '\n' + h.result.replace(/<[^>]+>/g, ''));
};

window.submitWriting = async type => {
  let c = [];
  let histTxt = '';
  let imageId = null;
  
  if (wInputMode === 'text') {
    const tStr = $('writing-text-input')?.value.trim();
    if (!tStr) return;
    histTxt = tStr;
    c = [{ type: 'text', text: type === 'analyze' ? `構文解析と和訳:\n${tStr}` : type === 'paraphrase' ? `言い換え:\n${tStr}` : type === 'essay' ? `エッセイ評価:\n${tStr}` : `添削:\n${tStr}` }];
  } else if (wInputMode === 'file') {
    const tStr = $('writing-file-text')?.value.trim();
    if (!tStr) return;
    histTxt = tStr;
    c = [{ type: 'text', text: type === 'analyze' ? `構文解析と和訳:\n${tStr}` : type === 'paraphrase' ? `言い換え:\n${tStr}` : type === 'essay' ? `エッセイ評価:\n${tStr}` : `添削:\n${tStr}` }];
  } else if (wInputMode === 'photo') {
    if (!wPhotoData) return;
    const b = wPhotoData.split(',')[1];
    const m = wPhotoData.match(/data:([^;]+)/)[1];
    histTxt = '(Photo)';
    imageId = await saveImageToDB(wPhotoData);
    c = [
      { type: 'image', source: { type: 'base64', media_type: m, data: b } },
      { type: 'text', text: type === 'analyze' ? '画像内の英文を構文解析・和訳' : type === 'paraphrase' ? '画像内の英文を言い換え' : type === 'essay' ? '画像内のエッセイを評価' : '画像内の英文添削' }
    ];
  }
  
  const sb = $('writing-submit-btn');
  const ab = $('writing-analyze-btn');
  const pb = $('writing-paraphrase-btn');
  const eb = $('writing-essay-btn');
  const ld = $('writing-loading');
  const rs = $('writing-result');
  
  if (sb) sb.classList.add('hidden');
  if (ab) ab.classList.add('hidden');
  if (pb) pb.classList.add('hidden');
  if (eb) eb.classList.add('hidden');
  if (ld) {
    ld.innerHTML = skeletonHtml;
    ld.classList.remove('hidden');
  }
  if (rs) rs.innerHTML = '';
  
  try {
    let sys = '';
    if (type === 'correct') {
      sys = `提出された英文を客観的かつ丁寧に添削し、以下のHTMLテンプレートの構造を【一言一句違わず】守って出力せよ。独自のタグ追加は禁止。
<h4>Score</h4>
<p>[ここに0〜100の数字]/100</p>
<h4>Grammar & Usage Explanation</h4>
<ul><li>[解説1。文末は「〜だ。」]</li></ul>
<h4>More Natural Expression</h4>
<p>[模範解答となる英文]</p>
<p>[その理由。文末は「〜である。」]</p>`;
    } else if (type === 'analyze') {
      sys = `客観的な構文解析を行い、以下のHTMLテンプレートの構造を【一言一句違わず】守って出力せよ。
<h4>SVOC Analysis</h4>
<p>SVOCを<span class="svoc-s">S</span>等で色付、<span class="slash">/</span>で区切って表示</p>
<h4>Syntax Explanation</h4>
<ul><li>[解説。文末は「〜だ。」]</li></ul>
<h4>Translation</h4>
<p>[自然な和訳。文末は「〜である。」]</p>`;
    } else if (type === 'paraphrase') {
      sys = `入力された英文をより洗練された学術的な英語に言い換え、以下のHTMLテンプレートの構造を【一言一句違わず】守って出力せよ。
<h4>Paraphrase Suggestion</h4>
<p>[英文]</p>
<h4>Reason & Nuance Difference</h4>
<ul><li>[解説。文末は「〜だ。」]</li></ul>`;
    } else if (type === 'essay') {
      sys = `提出されたエッセイを「論理性」「語彙」「文法」の観点から客観的に評価し、以下のHTMLテンプレートの構造を【一言一句違わず】守って出力せよ。
<h4>Score</h4>
<p>[ここに0〜100の数字]/100</p>
<h4>Evaluation (Logic, Vocab, Grammar)</h4>
<ul><li>[評価。文末は「〜だ。」]</li></ul>
<h4>Improvement Suggestion</h4>
<p>[改善案。文末は「〜である。」]</p>`;
    }
    
    const rep = await callGemini([{ role: 'user', content: c }], 8192, sys);
    const ht = clean(rep.replace(/```html?/g, '').replace(/```/g, ''));
    const newId = generateId();
    
    writingHistory.unshift({
      id: newId,
      type,
      date: new Date().toLocaleString('en-US'),
      original: histTxt.substring(0, 100),
      fullOriginal: histTxt,
      result: ht,
      score: (type === 'correct' || type === 'essay') ? (ht.match(/(\d{1,3})\s*(?:点|\/\s*100)/i) ? parseInt(RegExp.$1) : null) : null,
      imageId
    });
    save.writing();
    
    if (rs) {
      if (type === 'analyze') {
        rs.innerHTML = `
          <div class="card">
            <div class="text-xs font-bold text-muted mb-2">Blank Text Test</div>
            <div class="text-base mb-4" style="line-height:1.6;">${esc(histTxt).replace(/\n/g, '<br>')}</div>
            <button class="action-btn mb-0 bg-accent" onclick="document.getElementById('res-analyzed-${newId}').classList.remove('hidden');this.classList.add('hidden');">View Answer</button>
            <div id="res-analyzed-${newId}" class="hidden mt-14">
              <div class="correction-box mt-0">${ht}</div>
              <button class="action-btn mt-4 mb-0 bg-accent2" onclick="extractSyntaxFromHistory('${newId}')">Extract Key Syntax</button>
            </div>
          </div>
        `;
      } else {
        rs.innerHTML = `
          <div class="correction-box">${ht}</div>
          ${(type === 'correct' || type === 'essay') ? `<button class="action-btn mt-4 mb-0 bg-accent2" onclick="extractSyntaxFromHistory('${newId}')">Extract Key Syntax</button>` : ''}
        `;
      }
    }
  } catch (e) {
    handleApiError(e, 'writing-result');
  } finally {
    if (ld) ld.classList.add('hidden');
    if (sb) sb.classList.remove('hidden');
    if (ab) ab.classList.remove('hidden');
    if (pb) pb.classList.remove('hidden');
    if (eb) eb.classList.remove('hidden');
  }
};

const renderWritingHistory = () => {
  const c = $('writing-history-list');
  if (!c) return;
  
  const filterDate = $('history-filter-date')?.value;
  const filterType = $('history-filter-type')?.value || 'all';
  const filterScore = $('history-filter-score')?.value || 'all';
  
  let filtered = writingHistory;
  if (filterDate) {
    const dStr = new Date(filterDate).toLocaleDateString('en-US');
    filtered = filtered.filter(h => h.date.startsWith(dStr));
  }
  if (filterType !== 'all') {
    filtered = filtered.filter(h => h.type === filterType);
  }
  if (filterScore === 'under80') {
    filtered = filtered.filter(h => h.score !== null && h.score <= 80);
  }
  
  if (filtered.length) {
    c.innerHTML = filtered.map(h => `
      <div class="writing-history-item" role="button" tabindex="0" onclick="showWritingHistoryDetail('${h.id}')">
        <div class="text-xs text-muted mb-2">
          ${h.date}${h.score != null ? ' — ' + h.score + ' pts' : ''} (${h.type === 'analyze' ? 'Parse' : h.type === 'paraphrase' ? 'Para' : h.type === 'essay' ? 'Essay' : 'Correct'})
        </div>
        <div class="text-sm text-sub">${esc(h.original)}</div>
      </div>
    `).join('');
  } else {
    c.innerHTML = `<div class="vocab-empty">${getUiLang() === 'ja' ? '履歴がありません' : 'No history'}</div>`;
  }
};

$('history-filter-date')?.addEventListener('change', renderWritingHistory);
$('history-filter-type')?.addEventListener('change', renderWritingHistory);
$('history-filter-score')?.addEventListener('change', renderWritingHistory);

window.showWritingHistoryDetail = id => {
  const h = writingHistory.find(x => String(x.id) === String(id));
  const mb = $('writing-history-modal-body');
  if (!h || !mb) return;
  
  let html = '';
  if (h.imageId) {
    html += `
      <div class="mb-4">
        <button class="btn-text-muted" onclick="showSavedImage('${h.imageId}')">View Original Image</button>
        <div id="saved-img-${h.imageId}" class="mt-3"></div>
      </div>
    `;
  }
  
  if (h.type === 'analyze' || (!h.type && h.score === null)) {
    html += `
      <div class="text-xs font-bold text-muted mb-2">Blank Text Test</div>
      <div class="text-base mb-4 p-16 bg-main radius-sm line-height-16">${esc(h.fullOriginal || h.original).replace(/\n/g, '<br>')}</div>
      <button class="action-btn mb-0 bg-accent" onclick="document.getElementById('hist-analyzed-${id}').classList.remove('hidden');this.classList.add('hidden');">View Answer</button>
      <div id="hist-analyzed-${id}" class="hidden mt-14">
        <div class="correction-box mt-0">${h.result}</div>
      </div>
    `;
  } else {
    html += `<div class="correction-box">${h.result}</div>`;
  }
  
  html += `<button class="action-btn mt-4 mb-0 btn-danger" onclick="deleteWritingHistory('${id}')">Delete this history</button>`;
  mb.innerHTML = html;
  openModal('writing-history-modal');
};

window.deleteWritingHistory = id => {
  const h = writingHistory.find(x => String(x.id) === String(id));
  if (!h) return;
  writingHistory = writingHistory.filter(x => String(x.id) !== String(id));
  save.writing();
  renderWritingHistory();
  closeModal('writing-history-modal');
  
  showUndoSnackbar('History deleted', () => {
    writingHistory.unshift(h);
    save.writing();
    renderWritingHistory();
  }, () => {});
};

window.switchDailyTab = tStr => {
  currentDailyTab = tStr;
  ['comp', 'parse', 'reading', 'listen', 'drill'].forEach(x => {
    const b = $('dtab-' + x);
    const a = $('daily-area-' + x);
    if (b) {
      if (x === tStr) b.classList.add('active');
      else b.classList.remove('active');
    }
    if (a) {
      if (x === tStr) a.classList.remove('hidden');
      else a.classList.add('hidden');
    }
  });
  
  const diffWrap = $('daily-difficulty-wrap');
  if (diffWrap) {
    if (tStr === 'drill') diffWrap.classList.add('hidden');
    else diffWrap.classList.remove('hidden');
  }
  renderDaily();
};

window.extractSyntaxFromDaily = async id => {
  const d = dailyChallenges.find(x => String(x.id) === String(id));
  if (d) {
    await extractSyntaxFromText(d.question.replace(/<[^>]+>/g, '') + '\n' + d.feedback.replace(/<[^>]+>/g, ''));
  }
};

window.toggleReadingTranslation = (id) => {
  const el = $(id);
  if (el) el.classList.toggle('hidden');
};

const renderDaily = () => {
  const ts = new Date().toLocaleDateString('en-US');
  if (currentDailyTab === 'comp' || currentDailyTab === 'parse' || currentDailyTab === 'reading') {
    const area = $('daily-area-' + currentDailyTab);
    if (!area) return;
    
    const tasks = dailyChallenges.filter(d => d.date === ts && d.taskType === currentDailyTab);
    let html = '';
    
    if (!tasks.length) {
      html += `
        <div class="card text-center p-40">
          <button class="action-btn mb-0 btn-auto-width btn-lg-pad whitespace-nowrap" onclick="generateDailyTask('${currentDailyTab}')">${t('btn_create_question')}</button>
        </div>
      `;
    } else {
      html += tasks.map(task => {
        let qHtml = task.question;
        if (currentDailyTab === 'reading') {
          qHtml = qHtml.replace(/<div class="translation hidden" id="([^"]+)">/g, '<button class="btn-text-muted mt-2 mb-3" onclick="toggleReadingTranslation(\'$1\')">Show Translation</button><div class="translation hidden text-sm text-sub bg-main p-16 radius-sm mb-4" id="$1">');
        }
        
        if (!task.answer) {
          return `
            <div class="card">
              <p class="text-xs font-bold text-muted mb-3">Question (${task.date})</p>
              <div class="text-base mb-4 line-height-16">${qHtml}</div>
              <textarea id="daily-ans-${task.id}" class="writing-textarea mb-3" placeholder="Answer..."></textarea>
              <button class="action-btn mb-0" id="daily-submit-${task.id}" onclick="submitDailyAnswer('${task.id}')">Submit & Correct</button>
              <div id="daily-load-${task.id}" class="hidden text-center mt-10"><span class="loading-dots"></span></div>
            </div>
          `;
        } else {
          return `
            <div class="card">
              <p class="text-xs font-bold text-green mb-3">Complete</p>
              <div class="text-sm mb-3 pb-3 border-bottom line-height-16"><b>Question:</b><br>${qHtml}</div>
              <div class="text-sm mb-3 pb-3 border-bottom line-height-16"><b>Answer:</b><br>${esc(task.answer)}</div>
              <div class="correction-box mt-0">${task.feedback}</div>
              <button class="action-btn mt-4 mb-0 bg-accent2" onclick="extractSyntaxFromDaily('${task.id}')">Extract Key Syntax</button>
            </div>
          `;
        }
      }).join('');
      html += `
        <div class="text-center mt-4">
          <button class="action-btn btn-secondary btn-auto-width btn-md-pad whitespace-nowrap" onclick="generateDailyTask('${currentDailyTab}')">+ Create More</button>
        </div>
      `;
    }
    
    const hist = dailyChallenges.filter(d => d.date !== ts && d.taskType === currentDailyTab);
    if (hist.length) {
      html += `
        <div class="mt-4 pt-4 border-top">
          <p class="section-note">Past Questions</p>
          ${hist.map(h => `
            <div class="writing-history-item" role="button" tabindex="0" onclick="showDailyHistoryDetail('${h.id}')">
              <div class="text-xs text-muted mb-2">${h.date}${h.score != null ? ' — ' + h.score + ' pts' : ''}</div>
              <div class="text-sm">${h.question.replace(/<[^>]+>/g, '').substring(0, 60)}...</div>
            </div>
          `).join('')}
        </div>
      `;
    }
    area.innerHTML = html;
  } else if (currentDailyTab === 'listen') {
    renderListenArea();
  }
};

window.generateDailyTask = async type => {
  const a = $('daily-area-' + type);
  if (!a) return;
  a.innerHTML = `<div class="p-40">${skeletonHtml}</div>`;
  
  const diff = $('daily-difficulty') ? $('daily-difficulty').value : 'standard';
  let diffText = diff === 'basic' ? '初級（共通テストレベル）の' : diff === 'advanced' ? '上級（難関大レベル）の極めて高度な' : '中級（国公立大レベル）の';
  let sys = '';
  const seed = Date.now();
  
  if (type === 'reading') {
    const interests = userProfile.courses || '一般的な話題';
    sys = `生徒の興味（${interests}）に合わせた、高校生向けの${diffText}英語長文（${diff === 'basic' ? '150' : diff === 'advanced' ? '500' : '300'}語程度）と、内容説明の記述式問題を1題出題せよ。(seed: ${seed}) HTMLのみ。h4で「<h4>Today's Reading</h4>」、pで本文。段落ごとに和訳を <div class="translation hidden" id="trans_ランダムID">和訳</div> の形式で埋め込むこと。解答や解説は絶対に含めるな。`;
  } else if (type === 'comp') {
    sys = `高校生向けの${diffText}和文英訳問題を1題出題せよ。(seed: ${seed}) HTMLのみ。h4で「<h4>Today's Writing</h4>」、pで日本語問題文。解答や解説は絶対に含めるな。`;
  } else if (type === 'parse') {
    sys = `高校生向けの${diffText}英文解釈（和訳）問題を1題出題せよ。(seed: ${seed}) HTMLのみ。h4で「<h4>Today's Parsing</h4>」、pで英文。解答や解説は絶対に含めるな。`;
  }
  
  try {
    const rep = await callGemini([{ role: 'user', content: '問題作成' }], 8192, sys);
    const ht = clean(rep.replace(/```html?/g, '').replace(/```/g, '').trim());
    const ts = new Date().toLocaleDateString('en-US');
    
    dailyChallenges.unshift({
      id: 'daily_' + generateId(),
      date: ts,
      taskType: type,
      question: ht,
      answer: '',
      feedback: '',
      score: null
    });
    save.daily();
    renderDaily();
  } catch (e) {
    handleApiError(e, a.id);
    setTimeout(renderDaily, 2000);
  }
};

window.submitDailyAnswer = async id => {
  const i = $('daily-ans-' + id);
  if (!i || !i.value.trim()) return;
  const task = dailyChallenges.find(d => String(d.id) === String(id));
  if (!task) return;
  
  const sb = $('daily-submit-' + id);
  const ld = $('daily-load-' + id);
  if (sb) sb.classList.add('hidden');
  if (ld) ld.classList.remove('hidden');
  
  let sys = '';
  if (task.taskType === 'comp') {
    sys = `提出された英作文を客観的かつ丁寧に添削し、以下のHTMLテンプレートの構造を【一言一句違わず】守って出力せよ。
<h4>Score</h4>
<p>[ここに0〜100の数字]/100</p>
<h4>Explanation</h4>
<ul><li>[解説。文末は「〜だ。」]</li></ul>
<h4>Model Answer</h4>
<p>[英文]</p>`;
  } else if (task.taskType === 'parse') {
    sys = `和訳解答を客観的かつ丁寧に添削し、以下のHTMLテンプレートの構造を【一言一句違わず】守って出力せよ。
<h4>Score</h4>
<p>[ここに0〜100の数字]/100</p>
<h4>SVOC Analysis</h4>
<p>SVOCを<span class="svoc-s">S</span>等で色付、<span class="slash">/</span>で区切って表示</p>
<h4>Explanation</h4>
<ul><li>[解説。文末は「〜だ。」]</li></ul>`;
  } else if (task.taskType === 'reading') {
    sys = `長文読解の解答を客観的かつ丁寧に添削し、以下のHTMLテンプレートの構造を【一言一句違わず】守って出力せよ。
<h4>Score</h4>
<p>[ここに0〜100の数字]/100</p>
<h4>Explanation (Logical Process)</h4>
<ul><li>[解説。文末は「〜だ。」]</li></ul>
<h4>Summary</h4>
<p>[要旨。文末は「〜である。」]</p>`;
  }
  
  try {
    const rep = await callGemini([{ role: 'user', content: `問題:\n${task.question}\n解答:\n${i.value}` }], 8192, sys);
    const ht = clean(rep.replace(/```html?/g, '').replace(/```/g, ''));
    task.answer = i.value;
    task.feedback = ht;
    task.score = ht.match(/(\d{1,3})\s*(?:点|\/\s*100)/i) ? parseInt(RegExp.$1) : null;
    save.daily();
    renderDaily();
  } catch (e) {
    showToast('Communication error');
    if (sb) sb.classList.remove('hidden');
    if (ld) ld.classList.add('hidden');
  }
};

window.showDailyHistoryDetail = id => {
  const h = dailyChallenges.find(x => String(x.id) === String(id));
  const mb = $('writing-history-modal-body');
  if (!h || !mb) return;
  
  const sK = "daily_" + h.id;
  const r = srsData[sK.toLowerCase()];
  const sT = r ? `Next: ${srsDaysDiff(srsNextDate(r)) <= 0 ? 'Today' : srsDaysDiff(srsNextDate(r)) + ' days'}` : 'Not registered';
  
  let html = `
    <div class="text-sm mb-3 pb-3 border-bottom line-height-16"><b>Question (${h.date}):</b><br>${h.question}</div>
    <div class="text-sm mb-3 pb-3 border-bottom line-height-16"><b>Answer:</b><br>${esc(h.answer)}</div>
    <div class="correction-box mt-0">${h.feedback}</div>
    <div class="mt-4 pt-4 border-top">
      <p class="text-xs font-bold mb-3">Retention (FSRS)</p>
      <div class="flex-gap-8 flex-wrap">
        <button onclick="srsReviewItem('${sK}',0);showDailyHistoryDetail('${h.id}')" class="btn-srs bg-danger flex-1 min-w-60">Forgot</button>
        <button onclick="srsReviewItem('${sK}',1);showDailyHistoryDetail('${h.id}')" class="btn-srs bg-streak flex-1 min-w-60">Hard</button>
        <button onclick="srsReviewItem('${sK}',2);showDailyHistoryDetail('${h.id}')" class="btn-srs bg-green flex-1 min-w-60">Good</button>
        <button onclick="srsReviewItem('${sK}',3);showDailyHistoryDetail('${h.id}')" class="btn-srs bg-blue flex-1 min-w-60">Easy</button>
      </div>
      <p class="text-xs text-muted text-center mt-3">${sT}</p>
    </div>
    <button class="action-btn mt-4 mb-0 btn-danger" onclick="deleteDailyChallenge('${id}')">Delete this question</button>
  `;
  mb.innerHTML = html;
  openModal('writing-history-modal');
};

window.deleteDailyChallenge = id => {
  const d = dailyChallenges.find(x => String(x.id) === String(id));
  if (!d) return;
  dailyChallenges = dailyChallenges.filter(x => String(x.id) !== String(id));
  save.daily();
  renderDaily();
  closeModal('writing-history-modal');
  
  showUndoSnackbar('Question deleted', () => {
    dailyChallenges.unshift(d);
    save.daily();
    renderDaily();
  }, () => {});
};

window.generateWeaknessDrill = async () => {
  const btn = $('generate-weakness-drill-btn');
  const ld = $('drill-loading');
  const area = $('drill-content-area');
  
  if (btn) btn.classList.add('hidden');
  if (ld) {
    ld.innerHTML = skeletonHtml;
    ld.classList.remove('hidden');
  }
  if (area) area.innerHTML = '';
  
  const mistakes = writingHistory.filter(h => h.score !== null && h.score < 80).slice(0, 3).map(h => h.result.replace(/<[^>]+>/g, '').substring(0, 200));
  const dailyMistakes = dailyChallenges.filter(d => d.score !== null && d.score < 80).slice(0, 3).map(d => d.feedback.replace(/<[^>]+>/g, '').substring(0, 200));
  const weakWords = Object.entries(srsData).filter(x => x[1].difficulty > 7).slice(0, 5).map(x => x[0]);
  
  const context = `【過去の添削ミス】\n${mistakes.join('\n')}\n【過去の問題ミス】\n${dailyMistakes.join('\n')}\n【苦手単語】\n${weakWords.join(', ')}`;
  
  try {
    const sys = `生徒の過去のミス傾向と苦手単語を分析し、それらを克服するための「弱点特化ドリル（文法・語法・単語の穴埋め問題など）」を3問作成せよ。以下のHTMLテンプレートの構造を【一言一句違わず】守って出力せよ。
<h4>Question 1</h4>
<p>...</p>
<h4>Answer & Explanation</h4>
<p>Answer: ...<br>Explanation: ...（文末は「〜だ。」）</p>`;
    const rep = await callGemini([{ role: 'user', content: context }], 8192, sys);
    const html = clean(rep.replace(/```html?/g, '').replace(/```/g, ''));
    if (area) {
      area.innerHTML = `
        <div class="card">${html}</div>
        <div class="text-center mt-4">
          <button class="action-btn btn-secondary btn-auto-width whitespace-nowrap" onclick="generateWeaknessDrill()">Regenerate</button>
        </div>
      `;
    }
  } catch (e) {
    if (area) handleApiError(e, 'drill-content-area');
    if (btn) btn.classList.remove('hidden');
  } finally {
    if (ld) ld.classList.add('hidden');
  }
};

window.generateTrickDrill = async () => {
  const ld = $('drill-loading');
  const area = $('drill-content-area');
  ld.innerHTML = skeletonHtml;
  ld.classList.remove('hidden');
  area.innerHTML = '';
  
  const mistakes = writingHistory.filter(h => h.score !== null && h.score < 80).slice(0, 3).map(h => h.result.replace(/<[^>]+>/g, '').substring(0, 200));
  
  try {
    const sys = `過去のミスを分析し、あえて間違えやすいダミー選択肢を混ぜた「ひっかけ問題」を3問作成せよ。以下のHTMLテンプレートの構造を【一言一句違わず】守って出力せよ。
<h4>Question 1</h4>
<p>...</p>
<h4>Answer & Explanation</h4>
<p>Answer: ...<br>Explanation: ...（文末は「〜だ。」）</p>`;
    const rep = await callGemini([{ role: 'user', content: `過去のミス: ${mistakes.join('\n')}` }], 8192, sys);
    area.innerHTML = `<div class="card">${clean(rep.replace(/```html?/g, '').replace(/```/g, ''))}</div>`;
  } catch (e) {
    area.innerHTML = '<p class="text-danger">Generation failed</p>';
  } finally {
    ld.classList.add('hidden');
  }
};

window.setListenMode = m => {
  currentListenMode = m;
  ['mc', 'dict'].forEach(x => {
    const b = $('listen-mode-' + x);
    const a = $('listen-' + x + '-area');
    if (b) {
      if (x === m) b.classList.add('active');
      else b.classList.remove('active');
    }
    if (a) {
      if (x === m) a.classList.remove('hidden');
      else a.classList.add('hidden');
    }
  });
  renderListenArea();
};

window.showDictationHint = (id) => {
  const task = listenHistory.find(x => String(x.id) === String(id));
  if (!task) return;
  const hint = task.transcript.replace(/[a-zA-Z]/g, '_ ');
  showToast(hint);
};

const renderListenArea = () => {
  const ts = new Date().toLocaleDateString('en-US');
  if (currentListenMode === 'mc') {
    const area = $('listen-mc-area');
    if (!area) return;
    
    const tasks = listenHistory.filter(d => d.date === ts && d.type !== 'dict');
    let html = '';
    
    if (!tasks.length) {
      html += `
        <div class="card text-center p-40">
          <button class="action-btn mb-0 btn-auto-width btn-lg-pad bg-accent2 whitespace-nowrap" onclick="generateDailyListen()">${t('btn_create_question')}</button>
        </div>
      `;
    } else {
      html += tasks.map(task => {
        const ans = task.userAnswer >= 0;
        const accL = ACCENT_LABELS[task.accent] || task.accent || 'US English';
        let opts = task.options.map((o, i) => {
          let c = 'listen-option';
          if (ans) {
            if (i === task.answer) c += ' show-correct';
            else if (i === task.userAnswer && task.userAnswer !== task.answer) c += ' selected-wrong';
          }
          return `<div class="${c}" role="button" tabindex="0" onclick="submitDailyListenAnswer('${task.id}', ${i})">${String.fromCharCode(65 + i)}. ${esc(o)}</div>`;
        }).join('');
        
        let card = `
          <div class="card mb-4">
            <div class="flex-between align-center mb-3">
              <span class="text-xs font-bold text-muted">LISTENING — ${accL}</span>
              <span class="text-xs text-muted">${task.date}</span>
            </div>
            <div class="flex-center gap-3 mb-4 flex-wrap">
              <button onclick="playListenAudioById('${task.id}', 1.0)" class="btn-pill bg-accent text-bg border-none btn-md-pad whitespace-nowrap">Normal Speed</button>
              <button onclick="playListenAudioById('${task.id}', 0.7)" class="btn-pill btn-outline btn-md-pad whitespace-nowrap">Slow Speed</button>
            </div>
            <p class="text-base font-bold mb-4 line-height-15">${esc(task.question)}</p>
            <div class="listen-options">${opts}</div>
        `;
        
        if (ans) {
          card += `
            <div style="background:${task.userAnswer === task.answer ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'};border-radius:var(--radius-sm);padding:16px;margin-top:16px;">
              <p style="font-weight:700;margin-bottom:8px;color:${task.userAnswer === task.answer ? '#065F46' : '#991B1B'}">${task.userAnswer === task.answer ? 'Correct!' : 'Incorrect'}</p>
              <p class="text-sm line-height-16">${esc(task.explanation)}</p>
            </div>
            <div class="mt-4 p-16 bg-main radius-sm border">
              <p class="text-xs font-bold text-muted mb-2">Transcript</p>
              <p class="text-sm line-height-16" id="listen-transcript-${task.id}">${esc(task.transcript)}</p>
            </div>
          `;
        }
        return card + `</div>`;
      }).join('');
      
      html += `
        <div class="text-center mt-4">
          <button class="action-btn btn-secondary btn-auto-width btn-md-pad whitespace-nowrap" onclick="generateDailyListen()">+ Create More</button>
        </div>
      `;
    }
    
    const hist = listenHistory.filter(d => d.date !== ts && d.type !== 'dict');
    if (hist.length) {
      html += `
        <div class="mt-4 pt-4 border-top">
          <p class="section-note">Past Questions</p>
          ${hist.map(h => `
            <div class="writing-history-item" role="button" tabindex="0" onclick="showListenHistoryDetail('${h.id}')">
              <div class="text-xs text-muted mb-2">${h.date} — ${ACCENT_LABELS[h.accent] || h.accent}</div>
              <div class="text-sm text-sub">${esc((h.transcript || '').substring(0, 40))}...</div>
            </div>
          `).join('')}
        </div>
      `;
    }
    area.innerHTML = html;
  } else {
    const area = $('listen-dict-area');
    if (!area) return;
    
    const tasks = listenHistory.filter(d => d.date === ts && d.type === 'dict');
    let html = '';
    
    if (!tasks.length) {
      html += `
        <div class="card text-center p-40">
          <button class="action-btn mb-0 btn-auto-width btn-lg-pad bg-accent2 whitespace-nowrap" onclick="generateDailyDictation()">${t('btn_create_question')}</button>
        </div>
      `;
    } else {
      html += tasks.map(task => {
        const isDone = task.userAnswer !== undefined;
        const accL = ACCENT_LABELS[task.accent] || task.accent || 'US English';
        let card = `
          <div class="card mb-4">
            <div class="flex-between align-center mb-3">
              <span class="text-xs font-bold text-muted">DICTATION — ${accL}</span>
              <span class="text-xs text-muted">${task.date}</span>
            </div>
            <div class="flex-center gap-3 mb-4 flex-wrap">
              <button onclick="playListenAudioById('${task.id}', 1.0)" class="btn-pill bg-accent text-bg border-none btn-md-pad whitespace-nowrap">Normal Speed</button>
              <button onclick="playListenAudioById('${task.id}', 0.7)" class="btn-pill btn-outline btn-md-pad whitespace-nowrap">Slow Speed</button>
            </div>
        `;
        
        if (!isDone) {
          card += `
            <textarea id="dict-ans-${task.id}" class="writing-textarea mb-3" placeholder="Enter the English you heard..."></textarea>
            <div class="flex-gap-8 flex-wrap">
              <button class="action-btn mb-0 flex-1 min-w-100" id="dict-submit-${task.id}" onclick="submitDailyDictation('${task.id}')">Grade</button>
              <button class="action-btn mb-0 btn-secondary w-auto flex-shrink-0" onclick="showDictationHint('${task.id}')">Hint</button>
            </div>
            <div id="dict-load-${task.id}" class="hidden text-center mt-10"><span class="loading-dots"></span></div>
          `;
        } else {
          card += `
            <div class="text-sm mb-3 pb-3 border-bottom line-height-16"><b>Your Answer:</b><br>${esc(task.userAnswer)}</div>
            <div class="correction-box mt-0">${task.feedback}</div>
          `;
        }
        return card + `</div>`;
      }).join('');
      
      html += `
        <div class="text-center mt-4">
          <button class="action-btn btn-secondary btn-auto-width btn-md-pad whitespace-nowrap" onclick="generateDailyDictation()">+ Create More</button>
        </div>
      `;
    }
    
    const hist = listenHistory.filter(d => d.date !== ts && d.type === 'dict');
    if (hist.length) {
      html += `
        <div class="mt-4 pt-4 border-top">
          <p class="section-note">Past Dictations</p>
          ${hist.map(h => `
            <div class="writing-history-item" role="button" tabindex="0" onclick="showListenHistoryDetail('${h.id}')">
              <div class="text-xs text-muted mb-2">${h.date} — ${ACCENT_LABELS[h.accent] || h.accent}</div>
              <div class="text-sm text-sub">${esc((h.transcript || '').substring(0, 40))}...</div>
            </div>
          `).join('')}
        </div>
      `;
    }
    area.innerHTML = html;
  }
};

window.generateDailyListen = async () => {
  const a = $('listen-mc-area');
  if (!a) return;
  a.innerHTML = `<div class="p-40">${skeletonHtml}</div>`;
  
  const ac = ACCENTS[Math.floor(Math.random() * ACCENTS.length)];
  const diff = $('daily-difficulty') ? $('daily-difficulty').value : 'standard';
  const diffText = diff === 'basic' ? '初級（共通テストレベル）の' : diff === 'advanced' ? '上級（難関大レベル）の極めて高度な' : '中級（国公立大レベル）の';
  const seed = Date.now();
  
  try {
    const sys = `高校生向けの英語リスニング問題を作成せよ。難易度は「${diffText}」レベル。(seed: ${seed}) 日常的な対話（2人の会話）や短いアナウンス（100〜150語程度）をスクリプトとし、その内容に関する4択問題を作成せよ。JSONのみ:{"transcript":"英文スクリプト","question":"内容を問う設問","options":["1","2","3","4"],"answer":0,"explanation":"正解の根拠となる聞き取るべきキーワードと詳しい解説（文末は「〜だ。」）"}`;
    const rep = await callGemini([{ role: 'user', content: '作成' }], 8192, sys, true);
    const js = extractJSON(rep);
    const ts = new Date().toLocaleDateString('en-US');
    
    listenHistory.unshift({
      id: 'listen_' + generateId(),
      type: 'mc',
      date: ts,
      accent: ac,
      transcript: js.transcript,
      question: js.question,
      options: js.options,
      answer: js.answer,
      explanation: js.explanation,
      userAnswer: -1
    });
    save.listen();
    renderListenArea();
  } catch (e) {
    handleApiError(e, a.id);
    setTimeout(renderListenArea, 2000);
  }
};

window.submitDailyListenAnswer = (id, idx) => {
  const tObj = listenHistory.find(x => String(x.id) === String(id));
  if (!tObj || tObj.userAnswer >= 0) return;
  tObj.userAnswer = idx;
  save.listen();
  renderListenArea();
};

window.generateDailyDictation = async () => {
  const a = $('listen-dict-area');
  if (!a) return;
  a.innerHTML = `<div class="p-40">${skeletonHtml}</div>`;
  
  const ac = ACCENTS[Math.floor(Math.random() * ACCENTS.length)];
  const diff = $('daily-difficulty') ? $('daily-difficulty').value : 'standard';
  const diffText = diff === 'basic' ? '初級（共通テストレベル）の' : diff === 'advanced' ? '上級（難関大レベル）の極めて高度な' : '中級（国公立大レベル）の';
  const seed = Date.now();
  
  try {
    const sys = `高校生向けのディクテーション（書き取り）用の自然な英語パッセージを作成せよ。難易度は「${diffText}」レベル。(seed: ${seed}) 長さは2〜3文（30〜40語程度）。ネイティブの自然な発音（音の連結や脱落など）を意識した実践的な英文にすること。JSONのみ:{"transcript":"英文","translation":"和訳（文末は「〜である。」）","explanation":"日本人が聞き取りにくい音声変化のポイントや文法の解説（文末は「〜だ。」）"}`;
    const rep = await callGemini([{ role: 'user', content: '作成' }], 8192, sys, true);
    const js = extractJSON(rep);
    const ts = new Date().toLocaleDateString('en-US');
    
    listenHistory.unshift({
      id: 'dict_' + generateId(),
      type: 'dict',
      date: ts,
      accent: ac,
      transcript: js.transcript,
      translation: js.translation,
      explanation: js.explanation
    });
    save.listen();
    renderListenArea();
  } catch (e) {
    handleApiError(e, a.id);
    setTimeout(renderListenArea, 2000);
  }
};

window.submitDailyDictation = async id => {
  const i = $('dict-ans-' + id);
  if (!i || !i.value.trim()) return;
  const task = listenHistory.find(x => String(x.id) === String(id));
  if (!task) return;
  
  const sb = $('dict-submit-' + id);
  const ld = $('dict-load-' + id);
  if (sb) sb.classList.add('hidden');
  if (ld) ld.classList.remove('hidden');
  
  try {
    const sys = `生徒のディクテーション（書き取り）を客観的かつ丁寧に添削し、以下のHTMLテンプレートの構造を【一言一句違わず】守って出力せよ。
<h4>Score</h4>
<p>[ここに0〜100の数字]/100</p>
<h4>Mistake Pointing</h4>
<ul><li>[指摘。文末は「〜だ。」]</li></ul>
<h4>Translation & Explanation</h4>
<p>[和訳と解説。文末は「〜である。」]</p>
Correct Sentence: ${task.transcript}
Translation: ${task.translation}
Explanation: ${task.explanation}`;
    const rep = await callGemini([{ role: 'user', content: `生徒の解答:\n${i.value.trim()}` }], 8192, sys);
    task.userAnswer = i.value.trim();
    task.feedback = clean(rep.replace(/```html?/g, '').replace(/```/g, ''));
    save.listen();
    renderListenArea();
  } catch (e) {
    showToast('Communication error');
    if (sb) sb.classList.remove('hidden');
    if (ld) ld.classList.add('hidden');
  }
};

window.playListenAudioById = (id, rate = 1.0) => {
  const tObj = listenHistory.find(x => String(x.id) === String(id));
  if (!tObj) return;
  
  if (!window.speechSynthesis) return;
  speechSynthesis.cancel();
  
  if (availableVoices.length === 0) {
    availableVoices = speechSynthesis.getVoices();
  }
  
  const langMap = { en_US: 'en-US', en_GB: 'en-GB', en_AU: 'en-AU' };
  const lang = langMap[tObj.accent] || 'en-US';
  
  const u = new SpeechSynthesisUtterance(tObj.transcript);
  u.lang = lang;
  
  if (availableVoices.length > 0) {
    const voice = availableVoices.find(v => v.lang === u.lang) || availableVoices.find(v => v.lang.startsWith(u.lang.split('-')[0]));
    if (voice) u.voice = voice;
  }
  u.rate = rate;
  
  const transcriptEl = $(`listen-transcript-${id}`);
  if (transcriptEl) {
    const originalText = transcriptEl.textContent;
    u.onboundary = (event) => {
      if (event.name === 'word') {
        const before = originalText.substring(0, event.charIndex);
        const word = originalText.substring(event.charIndex, event.charIndex + event.charLength);
        const after = originalText.substring(event.charIndex + event.charLength);
        transcriptEl.innerHTML = `${esc(before)}<span style="background:var(--streak);color:#fff;border-radius:2px;padding:0 2px;">${esc(word)}</span>${esc(after)}`;
      }
    };
    u.onend = () => {
      transcriptEl.textContent = originalText;
    };
  }
  
  speechSynthesis.speak(u);
};

window.showListenHistoryDetail = id => {
  const h = listenHistory.find(x => String(x.id) === String(id));
  const mb = $('writing-history-modal-body');
  if (!h || !mb) return;
  
  const sK = "daily_" + h.id;
  const r = srsData[sK.toLowerCase()];
  const sT = r ? `Next: ${srsDaysDiff(srsNextDate(r)) <= 0 ? 'Today' : srsDaysDiff(srsNextDate(r)) + ' days'}` : 'Not registered';
  const accL = ACCENT_LABELS[h.accent] || h.accent || 'US English';
  
  let ht = '';
  if (h.type === 'dict') {
    ht = `
      <div class="text-xs font-bold text-muted mb-3">DICTATION (${h.date})</div>
      <div class="flex-center gap-3 mb-4 flex-wrap">
        <button onclick="playListenAudioById('${h.id}', 1.0)" class="btn-pill bg-accent text-bg border-none btn-md-pad whitespace-nowrap">Normal Speed</button>
        <button onclick="playListenAudioById('${h.id}', 0.7)" class="btn-pill btn-outline btn-md-pad whitespace-nowrap">Slow Speed</button>
      </div>
      <div class="text-sm mb-3 pb-3 border-bottom line-height-16"><b>Your Answer:</b><br>${esc(h.userAnswer || '')}</div>
      <div class="correction-box mt-0">${h.feedback}</div>
    `;
  } else {
    const ans = h.userAnswer >= 0;
    let opts = h.options.map((o, i) => {
      let c = 'listen-option';
      if (ans) {
        if (i === h.answer) c += ' show-correct';
        else if (i === h.userAnswer && h.userAnswer !== h.answer) c += ' selected-wrong';
      }
      return `<div class="${c}">${String.fromCharCode(65 + i)}. ${esc(o)}</div>`;
    }).join('');
    
    ht = `
      <div class="text-xs font-bold text-muted mb-3">LISTENING (${h.date})</div>
      <div class="flex-center gap-3 mb-4 flex-wrap">
        <button onclick="playListenAudioById('${h.id}', 1.0)" class="btn-pill bg-accent text-bg border-none btn-md-pad whitespace-nowrap">Normal Speed</button>
        <button onclick="playListenAudioById('${h.id}', 0.7)" class="btn-pill btn-outline btn-md-pad whitespace-nowrap">Slow Speed</button>
      </div>
      <p class="text-base font-bold mb-4 line-height-15">${esc(h.question)}</p>
      <div class="listen-options">${opts}</div>
    `;
    
    if (ans) {
      ht += `
        <div style="background:${h.userAnswer === h.answer ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'};border-radius:var(--radius-sm);padding:16px;margin-top:16px;">
          <p style="font-weight:700;margin-bottom:8px;color:${h.userAnswer === h.answer ? '#065F46' : '#991B1B'}">${h.userAnswer === h.answer ? 'Correct!' : 'Incorrect'}</p>
          <p class="text-sm line-height-16">${esc(h.explanation)}</p>
        </div>
        <div class="mt-4 p-16 bg-main radius-sm border">
          <p class="text-xs font-bold text-muted mb-2">Transcript</p>
          <p class="text-sm line-height-16" id="listen-transcript-${h.id}">${esc(h.transcript)}</p>
        </div>
      `;
    }
  }
  
  ht += `
    <div class="mt-4 pt-4 border-top">
      <p class="text-xs font-bold mb-3">Retention (FSRS)</p>
      <div class="flex-gap-8 flex-wrap">
        <button onclick="srsReviewItem('${sK}',0);showListenHistoryDetail('${h.id}')" class="btn-srs bg-danger flex-1 min-w-60">Forgot</button>
        <button onclick="srsReviewItem('${sK}',1);showListenHistoryDetail('${h.id}')" class="btn-srs bg-streak flex-1 min-w-60">Hard</button>
        <button onclick="srsReviewItem('${sK}',2);showListenHistoryDetail('${h.id}')" class="btn-srs bg-green flex-1 min-w-60">Good</button>
        <button onclick="srsReviewItem('${sK}',3);showListenHistoryDetail('${h.id}')" class="btn-srs bg-blue flex-1 min-w-60">Easy</button>
      </div>
      <p class="text-xs text-muted text-center mt-3">${sT}</p>
    </div>
    <button class="action-btn mt-4 mb-0 btn-danger" onclick="deleteListenHistory('${h.id}')">Delete this question</button>
  `;
  
  mb.innerHTML = ht;
  openModal('writing-history-modal');
};

window.deleteListenHistory = id => {
  const h = listenHistory.find(x => String(x.id) === String(id));
  if (!h) return;
  listenHistory = listenHistory.filter(x => String(x.id) !== String(id));
  save.listen();
  renderDaily();
  closeModal('writing-history-modal');
  
  showUndoSnackbar('Question deleted', () => {
    listenHistory.unshift(h);
    save.listen();
    renderDaily();
  }, () => {});
};

window.generateWordQuiz = async () => {
  const range = $('quiz-range').value;
  const count = parseInt($('quiz-count').value) || 5;
  const includeFill = $('quiz-include-fill') && $('quiz-include-fill').checked;
  
  const ld = $('word-quiz-loading');
  const area = $('word-quiz-area');
  
  if (ld) {
    ld.innerHTML = skeletonHtml;
    ld.classList.remove('hidden');
  }
  if (area) area.innerHTML = '';
  
  let targetWords = [];
  if (range === 'all') {
    targetWords = ALL_WORDS.slice();
  } else if (range === 'saved') {
    targetWords = ALL_WORDS.filter(w => savedWords.includes(w.word));
  } else if (range === 'srs') {
    targetWords = srsGetDueWords();
  }
  
  if (targetWords.length < count) {
    targetWords = ALL_WORDS.slice();
  }
  
  const shuffled = targetWords.sort(() => 0.5 - Math.random()).slice(0, count);
  if (shuffled.length === 0) {
    if (ld) ld.classList.add('hidden');
    return showToast('No words available');
  }
  
  const wordsToPrompt = shuffled.map(w => w.word).join(', ');
  const btn = $('generate-quiz-btn');
  if (btn) btn.disabled = true;
  
  let sys = `以下の英単語を使ってランダムにクイズを作成し、JSON配列のみで出力せよ。単語: ${wordsToPrompt}
出題形式は以下の${includeFill ? '3' : '2'}種類のいずれかをランダムに混ぜること。
1. 4択問題 {"type":"mc", "word":"...", "q":"(単語) の意味は？", "options":["...", "...", "...", "..."], "ans": (正解のインデックス0-3)}
${includeFill ? '2. 穴埋め問題 {"type":"fill", "word":"...", "q":"英文の穴埋め: I eat an ___.", "ans": "(正解の単語)"}' : ''}
${includeFill ? '3' : '2'}. 並び替え問題 {"type":"sort", "word":"...", "q":"和訳: 私はりんごを食べる", "options":["eat", "I", "apple", "an"], "ans":["I", "eat", "an", "apple"]}`;

  try {
    const rep = await callGemini([{ role: 'user', content: sys }], 8192, '', true);
    activeQuizList = extractJSON(rep);
    if (!activeQuizList || !Array.isArray(activeQuizList) || activeQuizList.length === 0) throw new Error('Invalid JSON');
    
    activeQuizList = activeQuizList.filter(q => q.type && q.q && q.ans !== undefined);
    if (activeQuizList.length === 0) throw new Error('No valid questions');
    
    activeQuizIndex = 0;
    quizScore = 0;
    if (ld) ld.classList.add('hidden');
    renderWordQuiz();
  } catch (e) {
    if (ld) ld.classList.add('hidden');
    handleApiError(e, 'word-quiz-area');
  } finally {
    if (btn) btn.disabled = false;
  }
};

const renderWordQuiz = () => {
  const area = $('word-quiz-area');
  if (activeQuizIndex >= activeQuizList.length) {
    area.innerHTML = `
      <div class="card text-center p-40">
        <h2 style="font-family:var(--font-block); font-size:36px; margin-bottom:12px;">RESULT</h2>
        <p style="font-size:20px; font-weight:700; color:var(--accent); margin-bottom:24px;">${quizScore} / ${activeQuizList.length} Correct</p>
        <button class="action-btn" onclick="document.getElementById('word-quiz-area').innerHTML='';">Finish</button>
      </div>
    `;
    return;
  }
  
  const q = activeQuizList[activeQuizIndex];
  let html = `
    <div class="card">
      <p class="text-xs font-bold text-muted mb-3">Q${activeQuizIndex + 1} / ${activeQuizList.length}</p>
      <p class="text-lg font-bold mb-4 line-height-15">${esc(q.q)}</p>
      <div id="quiz-interactive-area">
  `;
  
  if (q.type === 'mc') {
    q.options.forEach((opt, i) => {
      html += `<div class="quiz-option" role="button" tabindex="0" onclick="submitWordQuiz('mc', ${i})">${esc(opt)}</div>`;
    });
  } else if (q.type === 'fill') {
    html += `
      <input type="text" id="quiz-fill-input" class="score-input mb-4" placeholder="Enter answer..." style="font-size:16px;">
      <button class="action-btn" onclick="submitWordQuiz('fill')">Submit</button>
    `;
  } else if (q.type === 'sort') {
    html += `
      <div class="quiz-sortable" id="quiz-sort-target" onclick="handleSortClick(event, 'target')"></div>
      <p class="text-xs text-muted mb-3">Tap the words below to arrange them in the box above</p>
      <div class="quiz-sortable" id="quiz-sort-source" onclick="handleSortClick(event, 'source')">
        ${q.options.sort(() => 0.5 - Math.random()).map(w => `<div class="quiz-word-chip">${esc(w)}</div>`).join('')}
      </div>
      <button class="action-btn" onclick="submitWordQuiz('sort')">Submit</button>
    `;
  }
  
  html += `
      </div>
      <div id="quiz-feedback-area" class="hidden mt-4 p-16 radius-sm"></div>
    </div>
  `;
  area.innerHTML = html;
};

window.handleSortClick = (e, targetContainer) => {
  if (!e.target.classList.contains('quiz-word-chip')) return;
  const chip = e.target;
  const targetId = targetContainer === 'source' ? 'quiz-sort-target' : 'quiz-sort-source';
  $(targetId).appendChild(chip);
};

window.submitWordQuiz = (type, val) => {
  if (type === 'fill') val = $('quiz-fill-input').value;
  const q = activeQuizList[activeQuizIndex];
  const fb = $('quiz-feedback-area');
  const ia = $('quiz-interactive-area');
  ia.style.pointerEvents = 'none';
  
  let isCorrect = false;
  let correctText = '';
  
  if (type === 'mc') {
    isCorrect = (val === q.ans);
    correctText = q.options[q.ans];
    const opts = ia.querySelectorAll('.quiz-option');
    if (opts[val]) opts[val].classList.add(isCorrect ? 'correct' : 'wrong');
    if (!isCorrect && opts[q.ans]) opts[q.ans].classList.add('correct');
  } else if (type === 'fill') {
    isCorrect = (val.trim().toLowerCase() === q.ans.toLowerCase());
    correctText = q.ans;
  } else if (type === 'sort') {
    const userArr = Array.from($('quiz-sort-target').children).map(c => c.textContent);
    isCorrect = (userArr.join(' ') === q.ans.join(' '));
    correctText = q.ans.join(' ');
  }
  
  if (isCorrect) {
    quizScore++;
    if (window.confetti) confetti({ particleCount: 30, spread: 40, origin: { y: 0.7 } });
  }
  
  if (q.word && srsData[q.word.toLowerCase()]) {
    srsReview(q.word, isCorrect ? 2 : 0);
  }
  
  fb.classList.remove('hidden');
  fb.style.backgroundColor = isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
  fb.style.border = `1px solid ${isCorrect ? 'var(--green)' : 'var(--danger)'}`;
  fb.innerHTML = `
    <p style="font-weight:700; color:${isCorrect ? '#065F46' : '#991B1B'}; margin-bottom:8px;">${isCorrect ? 'Correct!' : 'Incorrect'}</p>
    <p class="text-sm text-sub">Answer: ${esc(correctText)}</p>
    <button class="action-btn mt-4 mb-0 bg-accent" onclick="activeQuizIndex++; renderWordQuiz();">Next Question</button>
  `;
};

window.generateYouTubeLesson = async () => {
  const url = $('media-yt-url').value;
  if (!url) return showToast('Please enter a URL');
  
  const ld = $('media-loading');
  const area = $('media-result-area');
  if (ld) {
    ld.innerHTML = skeletonHtml;
    ld.classList.remove('hidden');
  }
  area.innerHTML = '';
  
  try {
    const sys = `以下のYouTube動画URLの内容を推測・取得し、英語学習用の「要約」「重要単語」「内容理解クイズ」を作成せよ。以下のHTMLテンプレートの構造を【一言一句違わず】守って出力せよ。
<h4>Summary</h4>
<p>[要約。文末は「〜である。」]</p>
<h4>Key Words</h4>
<ul><li><b>[単語]</b>: [意味（体言止め）]</li></ul>
<h4>Comprehension Quiz</h4>
<p>[問題]</p>
<p>Answer: [正解]<br>Explanation: [解説。文末は「〜だ。」]</p>
URL: ${url}`;
    const rep = await callGemini([{ role: 'user', content: sys }], 8192);
    area.innerHTML = `<div class="card">${clean(rep.replace(/```html?/g, '').replace(/```/g, ''))}</div>`;
  } catch (e) {
    area.innerHTML = '<p class="text-danger">Generation failed</p>';
  } finally {
    if (ld) ld.classList.add('hidden');
  }
};

// PDF Reader with Text Selection Popup
let pdfSelectedText = '';

window.openPdfReaderModal = () => {
  openModal('pdf-reader-modal');
};

window.loadPdfFile = async (e) => {
  const f = e.target.files[0];
  if (!f) return;
  const container = $('pdf-reader-container');
  container.innerHTML = `<div class="p-20">${skeletonHtml}</div>`;
  
  try {
    const arrayBuffer = await f.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    container.innerHTML = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 });
      
      const pageDiv = document.createElement('div');
      pageDiv.style.position = 'relative';
      pageDiv.style.marginBottom = '10px';
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = '100%';
      canvas.style.display = 'block';
      
      await page.render({ canvasContext: ctx, viewport: viewport }).promise;
      
      const textContent = await page.getTextContent();
      const textLayerDiv = document.createElement('div');
      textLayerDiv.style.position = 'absolute';
      textLayerDiv.style.left = '0';
      textLayerDiv.style.top = '0';
      textLayerDiv.style.right = '0';
      textLayerDiv.style.bottom = '0';
      textLayerDiv.style.color = 'transparent';
      textLayerDiv.style.cursor = 'text';
      
      pdfjsLib.renderTextLayer({
        textContent: textContent,
        container: textLayerDiv,
        viewport: viewport,
        textDivs: []
      });
      
      pageDiv.appendChild(canvas);
      pageDiv.appendChild(textLayerDiv);
      container.appendChild(pageDiv);
    }
  } catch (err) {
    container.innerHTML = '<p class="text-danger">Failed to load PDF</p>';
  }
};

document.addEventListener('selectionchange', () => {
  const modal = $('pdf-reader-modal');
  if (!modal || !modal.classList.contains('open')) return;
  
  const selection = window.getSelection();
  const text = selection.toString().trim();
  const popup = $('pdf-popup-menu');
  
  if (text && popup) {
    pdfSelectedText = text;
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const modalRect = modal.querySelector('.modal-sheet').getBoundingClientRect();
    
    popup.style.left = `${rect.left - modalRect.left + (rect.width / 2) - (popup.offsetWidth / 2)}px`;
    popup.style.top = `${rect.top - modalRect.top - 40}px`;
    popup.classList.remove('hidden');
  } else if (popup) {
    popup.classList.add('hidden');
  }
});

window.addPdfWord = () => {
  if (!pdfSelectedText) return;
  $('word-input').value = pdfSelectedText;
  closeModal('pdf-reader-modal');
  setTabByIndex(2); // Vocab tab
  searchWord();
};

window.analyzePdfSyntax = () => {
  if (!pdfSelectedText) return;
  $('writing-text-input').value = pdfSelectedText;
  closeModal('pdf-reader-modal');
  setTabByIndex(3); // SkillUp tab
  window.switchWritingTab('input');
  window.setWritingInputMode('text');
  window.submitWriting('analyze');
};

let pdfHighlightMode = false;
window.togglePdfHighlightMode = () => {
  pdfHighlightMode = !pdfHighlightMode;
  showToast(pdfHighlightMode ? 'Highlight Mode ON' : 'Highlight Mode OFF');
};

window.addPdfNote = () => {
  showToast('PDF note feature is currently under development');
};

window.openShadowingModal = () => {
  openModal('shadowing-modal');
};

window.playShadowingModel = () => {
  const text = $('shadowing-text-input').value;
  if (!text) return showToast('Please enter English text');
  speakWord(text);
  drawFakeWaveform('shadowing-model-canvas', '#3B82F6');
};

window.toggleShadowingRecord = async () => {
  const btn = $('shadowing-record-btn');
  if (btn.textContent === 'Start Recording' || btn.textContent === '録音開始') {
    btn.textContent = getUiLang() === 'ja' ? '停止' : 'Stop';
    btn.classList.remove('bg-danger');
    btn.classList.add('bg-accent');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      shadowingAudioCtx = new AudioContext();
      const source = shadowingAudioCtx.createMediaStreamSource(stream);
      shadowingAnalyser = shadowingAudioCtx.createAnalyser();
      source.connect(shadowingAnalyser);
      drawRealWaveform('shadowing-user-canvas', '#F97316');
    } catch (e) {
      showToast('Microphone permission is required');
      window.toggleShadowingRecord();
    }
  } else {
    btn.textContent = getUiLang() === 'ja' ? '録音開始' : 'Start Recording';
    btn.classList.remove('bg-accent');
    btn.classList.add('bg-danger');
    if (shadowingAudioCtx) shadowingAudioCtx.close();
    cancelAnimationFrame(shadowingReqAnimFrame);
  }
};

const drawFakeWaveform = (id, color) => {
  const canvas = $(id);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let x = 0;
  const draw = () => {
    if (x > canvas.width) return;
    ctx.fillStyle = color;
    const h = Math.random() * canvas.height;
    ctx.fillRect(x, (canvas.height - h) / 2, 2, h);
    x += 3;
    requestAnimationFrame(draw);
  };
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  draw();
};

const drawRealWaveform = (id, color) => {
  const canvas = $(id);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  shadowingAnalyser.fftSize = 256;
  const bufferLength = shadowingAnalyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  
  const draw = () => {
    shadowingReqAnimFrame = requestAnimationFrame(draw);
    shadowingAnalyser.getByteFrequencyData(dataArray);
    ctx.fillStyle = 'var(--bg2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const barWidth = (canvas.width / bufferLength) * 2.5;
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
      const barHeight = dataArray[i] / 2;
      ctx.fillStyle = color;
      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
      x += barWidth + 1;
    }
  };
  draw();
};

const renderSyntax = () => {
  const c = $('syntax-list');
  if (!c) return;
  if (!syntaxList.length) {
    c.innerHTML = `<div class="vocab-empty">${getUiLang() === 'ja' ? '構文がありません' : 'No syntax available'}</div>`;
    return;
  }
  
  c.innerHTML = syntaxList.map(s => {
    const sK = "syntax_" + s.id;
    const r = srsData[sK.toLowerCase()];
    const sT = r ? `Next: ${srsDaysDiff(srsNextDate(r)) <= 0 ? 'Today' : srsDaysDiff(srsNextDate(r)) + ' days'}` : 'Not registered';
    
    return `
      <div class="card mb-3 p-16">
        <div class="flex-between align-center mb-3">
          <div class="text-base font-bold line-height-15" style="font-family:var(--font-block);">${esc(s.syntax)}</div>
          <button onclick="deleteSyntax('${s.id}')" class="btn-clear text-danger">✕</button>
        </div>
        <div class="text-sm text-sub mb-3">${esc(s.meaning || '')}</div>
        ${s.note ? `<div class="text-xs text-muted mt-3 pt-3 border-top border-dashed">${esc(s.note)}</div>` : ''}
        <div class="flex align-center gap-2 mt-4 flex-wrap">
          <button onclick="srsReviewItem('${sK}',0);renderSyntax()" class="btn-srs bg-danger btn-pill flex-1 min-w-60">Forgot</button>
          <button onclick="srsReviewItem('${sK}',1);renderSyntax()" class="btn-srs bg-streak btn-pill flex-1 min-w-60">Hard</button>
          <button onclick="srsReviewItem('${sK}',2);renderSyntax()" class="btn-srs bg-green btn-pill flex-1 min-w-60">Good</button>
          <button onclick="srsReviewItem('${sK}',3);renderSyntax()" class="btn-srs bg-blue btn-pill flex-1 min-w-60">Easy</button>
          <span class="text-xs text-muted ml-2 whitespace-nowrap">${sT}</span>
        </div>
      </div>
    `;
  }).join('');
};

window.addSyntaxManual = () => {
  const nt = $('syntax-new-text');
  const nm = $('syntax-new-meaning');
  const nn = $('syntax-new-note');
  
  if (!nt || !nt.value.trim()) return;
  
  syntaxList.unshift({
    id: generateId(),
    syntax: nt.value.trim(),
    meaning: nm ? nm.value.trim() : '',
    note: nn ? nn.value.trim() : '',
    date: new Date().toLocaleDateString('en-US')
  });
  
  save.syntax();
  renderSyntax();
  
  nt.value = '';
  if (nm) nm.value = '';
  if (nn) nn.value = '';
  showToast('Added');
};

window.deleteSyntax = id => {
  const s = syntaxList.find(x => String(x.id) === String(id));
  if (!s) return;
  syntaxList = syntaxList.filter(x => String(x.id) !== String(id));
  save.syntax();
  renderSyntax();
  
  showUndoSnackbar('Syntax deleted', () => {
    syntaxList.unshift(s);
    save.syntax();
    renderSyntax();
  }, () => {});
};

window.exportSyntaxPDF = () => {
  if (!syntaxList.length) return showToast('No syntax available');
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <title>Syntax List</title>
      <style>
        body{font-family:sans-serif;padding:20px;font-size:13px}
        table{width:100%;border-collapse:collapse}
        th,td{border:1px solid #ddd;padding:8px}
        th{background:#f5f5f5}
        .btn{display:block;width:180px;margin:0 auto 20px;padding:10px;text-align:center;background:#111;color:#fff;border-radius:50px;cursor:pointer}
        @media print{.btn{display:none}}
      </style>
    </head>
    <body>
      <button class="btn" onclick="window.print()">Print</button>
      <h1>Syntax List (${syntaxList.length} items)</h1>
      <table>
        <tr><th>Syntax</th><th>Meaning</th><th>Note</th></tr>
        ${syntaxList.map(s => `<tr><td><b>${esc(s.syntax)}</b></td><td>${esc(s.meaning || '')}</td><td>${esc(s.note || '')}</td></tr>`).join('')}
      </table>
    </body>
    </html>
  `;
  printHtml(html);
};

// ============================================================
// [13] CUSTOM DECKS
// ============================================================
const ccInitDecks = () => {
  ccRenderSelects();
  ccRenderDecksList();
  if (ccDeckId) ccLoadDeck();
};

const ccRenderSelects = () => {
  const o = `<option value="">${t('opt_select')}</option>` + customDecks.map(d => `<option value="${d.id}" ${d.id === ccDeckId ? 'selected' : ''}>${esc(d.name)}</option>`).join('');
  ['cc-deck-select', 'cc-edit-deck-select'].forEach(id => {
    const e = $(id);
    if (e) e.innerHTML = o;
  });
};

const ccRenderDecksList = () => {
  const c = $('cc-decks-list');
  if (c) {
    c.innerHTML = customDecks.length ? customDecks.map(d => `
      <div class="card flex-between align-center">
        <span>${esc(d.name)} (${d.cards.length} cards)</span>
        <div class="flex-gap-8">
          <button onclick="ccDeleteDeck('${d.id}')" class="btn-clear text-danger">${t('btn_delete')}</button>
        </div>
      </div>
    `).join('') : '';
  }
};

window.ccCreateDeck = () => {
  const i = $('cc-new-deck-name');
  if (!i || !i.value.trim()) return;
  customDecks.push({ id: 'deck_' + generateId(), name: i.value.trim(), cards: [] });
  save.decks();
  ccInitDecks();
  showToast('Created');
  i.value = '';
};

window.ccDeleteDeck = id => {
  if (!confirm(getUiLang() === 'ja' ? '削除しますか？' : 'Delete?')) return;
  customDecks = customDecks.filter(d => d.id !== id);
  if (ccDeckId === id) {
    ccDeckId = null;
    ccList = [];
    ccIdx = 0;
    ccRenderCard();
  }
  save.decks();
  ccInitDecks();
};

window.setCCMode = m => {
  ccMode = m;
  ['study', 'edit', 'decks'].forEach(x => {
    const el = $('cc-mode-' + x);
    const a = $('cc-' + x + '-area');
    if (el) {
      if (x === m) el.classList.add('active');
      else el.classList.remove('active');
    }
    if (a) {
      if (x === m) a.classList.remove('hidden');
      else a.classList.add('hidden');
    }
  });
  if (m === 'study') window.ccLoadDeck();
  if (m === 'edit' || m === 'decks') ccInitDecks();
};

window.ccLoadDeck = () => {
  const s = $('cc-deck-select');
  if (s && s.value) ccDeckId = s.value;
  
  const d = customDecks.find(x => x.id === ccDeckId);
  const fc = $('cc-flip-card');
  const ed = $('cc-empty-deck');
  const nd = $('cc-no-deck');
  const cc = $('cc-card-counter');
  const cn = $('cc-card-nav');
  
  if (fc) {
    if (d && d.cards.length) fc.classList.remove('hidden');
    else fc.classList.add('hidden');
  }
  if (ed) {
    if (d && !d.cards.length) ed.classList.remove('hidden');
    else ed.classList.add('hidden');
  }
  if (nd) {
    if (!d) nd.classList.remove('hidden');
    else nd.classList.add('hidden');
  }
  if (cc) {
    if (d && d.cards.length) cc.classList.remove('hidden');
    else cc.classList.add('hidden');
  }
  if (cn) {
    if (d && d.cards.length) cn.classList.remove('hidden');
    else cn.classList.add('hidden');
  }
  
  if (!d || !d.cards.length) return;
  ccList = d.cards.slice();
  ccIdx = 0;
  ccRenderCard();
};

const ccRenderCard = () => {
  const fi = $('cc-flip-inner');
  const cf = $('cc-card-front');
  const cb = $('cc-card-back');
  const ci = $('cc-card-idx');
  const ct = $('cc-card-total');
  
  if (fi) fi.classList.remove('flipped');
  
  if (!ccList.length) {
    if (cf) cf.textContent = '—';
    if (cb) cb.textContent = '—';
    if (ci) ci.textContent = '0';
    if (ct) ct.textContent = '0';
    return;
  }
  
  if (cf) cf.textContent = ccList[ccIdx].front;
  if (cb) cb.textContent = ccList[ccIdx].back;
  if (ci) ci.textContent = ccIdx + 1;
  if (ct) ct.textContent = ccList.length;
};

window.ccFlipCard = () => {
  const fi = $('cc-flip-inner');
  if (fi) fi.classList.toggle('flipped');
};

window.ccChangeCard = d => {
  if (ccList.length) {
    ccIdx = (ccIdx + d + ccList.length) % ccList.length;
    ccRenderCard();
  }
};

window.ccShuffleCards = () => {
  for (let i = ccList.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ccList[i], ccList[j]] = [ccList[j], ccList[i]];
  }
  ccIdx = 0;
  ccRenderCard();
};

window.ccRenderCards = () => {
  const s = $('cc-edit-deck-select');
  if (s && s.value) ccDeckId = s.value;
  
  const d = customDecks.find(x => x.id === ccDeckId);
  const ned = $('cc-no-edit-deck');
  const ce = $('cc-card-editor');
  const cl = $('cc-card-list');
  
  if (ned) {
    if (d) ned.classList.add('hidden');
    else ned.classList.remove('hidden');
  }
  if (ce) {
    if (d) ce.classList.remove('hidden');
    else ce.classList.add('hidden');
  }
  
  if (!d || !cl) return;
  
  cl.innerHTML = d.cards.map((c, i) => `
    <div class="card flex-between p-16">
      <div>
        <b>${esc(c.front)}</b><br>
        <span class="text-muted">${esc(c.back)}</span>
      </div>
      <button onclick="ccDeleteCard(${i})" class="btn-clear text-danger">✕</button>
    </div>
  `).join('');
};

window.ccAddCard = () => {
  const fi = $('cc-new-front');
  const bi = $('cc-new-back');
  const d = customDecks.find(x => x.id === ccDeckId);
  
  if (fi && bi && d && fi.value.trim() && bi.value.trim()) {
    d.cards.push({ front: fi.value.trim(), back: bi.value.trim() });
    save.decks();
    window.ccRenderCards();
    fi.value = '';
    bi.value = '';
    fi.focus();
    showToast('Added');
  }
};

window.ccDeleteCard = i => {
  const d = customDecks.find(x => x.id === ccDeckId);
  if (d) {
    d.cards.splice(i, 1);
    save.decks();
    window.ccRenderCards();
  }
};

window.setCCAiMode = m => {
  ccAiMode = m;
  ['text', 'file', 'photo'].forEach(x => {
    const btn = $('cc-ai-mode-' + x);
    const area = $('cc-ai-' + x + '-area');
    if (btn) {
      if (x === m) btn.classList.add('active');
      else btn.classList.remove('active');
    }
    if (area) {
      if (x === m) area.classList.remove('hidden');
      else area.classList.add('hidden');
    }
  });
  if (m === 'study') window.ccLoadDeck();
  if (m === 'edit' || m === 'decks') ccInitDecks();
};

window.handleCCAiFile = e => {
  const f = e.target.files[0];
  if (!f) return;
  const fn = $('cc-ai-file-name');
  if (fn) fn.textContent = f.name;
  const r = new FileReader();
  r.onload = ev => {
    ccAiFileData = ev.target.result;
  };
  r.readAsText(f);
};

window.handleCCAiPhoto = e => {
  const f = e.target.files[0];
  if (!f) return;
  openImageCropper(f, (croppedDataUrl) => {
    ccAiPhotoData = croppedDataUrl;
    const pv = $('cc-ai-photo-preview');
    if (pv) pv.innerHTML = `<img src="${ccAiPhotoData}" style="max-width:100%;border-radius:10px">`;
  });
};

window.ccGenerateCardsAI = async () => {
  const d = customDecks.find(x => x.id === ccDeckId);
  if (!d) return showToast('No deck selected');
  
  let c = [];
  if (ccAiMode === 'text') {
    const p = $('cc-ai-prompt')?.value.trim();
    if (!p) return showToast('Theme input required');
    c = [{ role: 'user', content: `「${p}」に関連するフラッシュカードのペア生成` }];
  } else if (ccAiMode === 'file') {
    if (!ccAiFileData) return showToast('No file selected');
    const p = $('cc-ai-file-prompt')?.value.trim() || 'フラッシュカード生成';
    c = [{ role: 'user', content: `ファイル内容:\n${ccAiFileData.substring(0, 5000)}\n\n指示:${p}` }];
  } else if (ccAiMode === 'photo') {
    if (!ccAiPhotoData) return showToast('No photo selected');
    const b = ccAiPhotoData.split(',')[1];
    const m = ccAiPhotoData.match(/data:([^;]+)/)[1];
    const p = $('cc-ai-photo-prompt')?.value.trim() || '画像内容からカード生成';
    c = [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: m, data: b } }, { type: 'text', text: p }] }];
  }
  
  const btn = $('cc-ai-btn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Generating...';
  }
  
  try {
    const rep = await callGemini(c, 8192, 'JSON配列のみ出力。キーは "front" と "back"。フロントとバックを簡潔に。', true);
    const arr = extractJSON(rep);
    if (arr && arr.length) {
      let added = 0;
      arr.forEach(cd => {
        if (cd.front && cd.back) {
          d.cards.push({ front: String(cd.front), back: String(cd.back) });
          added++;
        }
      });
      save.decks();
      window.ccRenderCards();
      showToast(`${added} cards generated`);
      
      if (ccAiMode === 'text') {
        const i = $('cc-ai-prompt');
        if (i) i.value = '';
      } else if (ccAiMode === 'file') {
        const f = $('cc-ai-file-input');
        if (f) f.value = '';
        $('cc-ai-file-name').textContent = '';
        $('cc-ai-file-prompt').value = '';
        ccAiFileData = '';
      } else if (ccAiMode === 'photo') {
        $('cc-ai-photo-input').value = '';
        $('cc-ai-photo-preview').innerHTML = '';
        $('cc-ai-photo-prompt').value = '';
        ccAiPhotoData = null;
      }
    } else {
      showToast('Failed');
    }
  } catch (e) {
    showToast('Communication error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = t('btn_gen_ai');
    }
  }
};

// ============================================================
// [14] SUBJECT QA
// ============================================================
window.setSubject = s => {
  curSubj = s;
  document.querySelectorAll('#subject-tabs .stab').forEach((b, i) => {
    if (Object.keys(SCORE_SUBJECTS)[i] === s) b.classList.add('active');
    else b.classList.remove('active');
  });
  
  const sl = $('subject-label');
  if (sl) sl.textContent = SCORE_SUBJECTS[s].label + ' Mode';
  
  const ocrOpt = $('math-sci-ocr-option');
  if (ocrOpt) {
    if (s === 'math' || s === 'science') ocrOpt.classList.remove('hidden');
    else ocrOpt.classList.add('hidden');
  }
  
  renderSubjectChat();
  renderSubjectSaved();
  renderSubjectQuiz();
};

window.switchSubjectView = v => {
  ['chat', 'history', 'quiz'].forEach(x => {
    const el = $('sview-' + x);
    const _v = $('subject-' + x + '-view');
    if (el) {
      if (x === v) el.classList.add('active');
      else el.classList.remove('active');
    }
    if (_v) {
      if (x === v) _v.classList.remove('hidden');
      else _v.classList.add('hidden');
    }
  });
  if (v === 'history') renderSubjectSaved();
  if (v === 'quiz') renderSubjectQuiz();
};

window.setSubjectInputMode = m => {
  sqMode = m;
  ['text', 'file', 'photo'].forEach(x => {
    const el = $('sqmode-' + x);
    const a = $('sq-' + x + '-area');
    if (el) {
      if (x === m) el.classList.add('active');
      else el.classList.remove('active');
    }
    if (a) {
      if (x === m) a.classList.remove('hidden');
      else a.classList.add('hidden');
    }
  });
};

window.handleSubjectFile = e => {
  const f = e.target.files[0];
  const fn = $('subject-file-name');
  if (!f) return;
  if (fn) fn.textContent = f.name;
  const r = new FileReader();
  r.onload = ev => sqFileData = ev.target.result;
  r.readAsText(f);
};

window.handleSubjectPhoto = e => {
  const f = e.target.files[0];
  if (!f) return;
  openImageCropper(f, (croppedDataUrl) => {
    sqPhotoData = croppedDataUrl;
    const pp = $('subject-photo-preview');
    if (pp) pp.innerHTML = `<img src="${sqPhotoData}" style="max-width:100%;border-radius:10px">`;
  });
};

const _sendSubj = async (c, dt) => {
  if (!subjHist[curSubj]) subjHist[curSubj] = [];
  subjHist[curSubj].push({ role: 'user', content: typeof c === 'string' ? c : dt });
  
  const ct = $('subject-chat');
  if (!ct) return;
  
  ct.insertAdjacentHTML('beforeend', `<div class="chat-bubble user">${esc(dt)}</div><div class="chat-bubble ai" id="sq-load"><span class="loading-dots"></span></div>`);
  ct.scrollTop = ct.scrollHeight;
  
  try {
    const rep = await callGemini(subjHist[curSubj].slice(0, -1).concat([{ role: 'user', content: c }]), 8192, 'ステップバイステップで論理的に解説せよ。文末は必ず「〜だ」「〜である」に統一すること。');
    const cleanRep = clean(rep);
    subjHist[curSubj].push({ role: 'assistant', content: cleanRep });
    
    const ld = $('sq-load');
    if (ld) ld.remove();
    
    ct.insertAdjacentHTML('beforeend', `<div class="chat-bubble ai">${cleanRep.replace(/\n/g, '<br>')} <button class="copy-btn mt-3" onclick="saveLastSubjectQA(this,'${curSubj}')">Save</button></div>`);
    renderMath(ct.lastElementChild);
  } catch (e) {
    const ld = $('sq-load');
    if (ld) ld.remove();
    ct.insertAdjacentHTML('beforeend', `<div class="chat-bubble ai text-danger">Communication error</div>`);
    subjHist[curSubj].pop();
  }
  ct.scrollTop = ct.scrollHeight;
};

window.sendSubjectMessage = () => {
  const i = $('subject-input');
  if (!i || !i.value.trim()) return;
  const tStr = i.value.trim();
  i.value = '';
  autoResize(i);
  _sendSubj(tStr, tStr);
};

window.sendSubjectFileMessage = () => {
  if (sqFileData) {
    const ex = $('subject-file-extra');
    _sendSubj([{ type: 'text', text: (ex ? ex.value : '') + '\n' + sqFileData }], 'File attached');
    if (ex) ex.value = '';
    sqFileData = '';
    const fn = $('subject-file-name');
    if (fn) fn.textContent = '';
  }
};

window.sendSubjectPhotoMessage = () => {
  if (sqPhotoData) {
    const b = sqPhotoData.split(',')[1];
    const m = sqPhotoData.match(/data:([^;]+)/)[1];
    const ex = $('subject-photo-extra');
    let textPrompt = ex ? ex.value || 'Question' : 'Question';
    
    const isMathOcr = $('subject-math-ocr-check') && $('subject-math-ocr-check').checked && (curSubj === 'math' || curSubj === 'science');
    if (isMathOcr) {
      textPrompt = `画像内の数式や問題を正確に読み取り、なぜその公式を使うのかを含めてステップバイステップで詳しく解説せよ。\n追加の質問: ${textPrompt}`;
    }
    
    _sendSubj([{ type: 'image', source: { type: 'base64', media_type: m, data: b } }, { type: 'text', text: textPrompt }], 'Photo');
    
    if (ex) ex.value = '';
    sqPhotoData = null;
    const pp = $('subject-photo-preview');
    if (pp) pp.innerHTML = '';
  }
};

const renderSubjectChat = () => {
  const c = $('subject-chat');
  if (!c) return;
  c.innerHTML = '';
  (subjHist[curSubj] || []).forEach(m => {
    c.insertAdjacentHTML('beforeend', `<div class="chat-bubble ${m.role === 'user' ? 'user' : 'ai'}">${m.role === 'user' ? esc(m.content) : String(m.content).replace(/\n/g, '<br>')}</div>`);
    if (m.role === 'assistant') renderMath(c.lastElementChild);
  });
  c.scrollTop = c.scrollHeight;
};

window.clearSubjectChat = () => {
  subjHist[curSubj] = [];
  renderSubjectChat();
};

window.saveLastSubjectQA = async (btn, subj) => {
  const hist = subjHist[subj];
  if (!hist || hist.length < 2) return;
  
  const qObj = hist[hist.length - 2].content;
  let qStr = 'Image';
  let imageId = null;
  
  if (typeof qObj === 'string') {
    qStr = qObj;
  } else if (Array.isArray(qObj)) {
    const textPart = qObj.find(x => x.type === 'text');
    if (textPart) qStr = textPart.text;
    const imgPart = qObj.find(x => x.type === 'image');
    if (imgPart) {
      const base64 = `data:${imgPart.source.media_type};base64,${imgPart.source.data}`;
      imageId = await saveImageToDB(base64);
    }
  }
  
  const folderId = $('subject-folder-select') ? $('subject-folder-select').value : 'uncategorized';
  
  subjectSaved.unshift({
    id: generateId(),
    subject: subj,
    subjectLabel: SCORE_SUBJECTS[subj].label,
    date: new Date().toLocaleString('en-US'),
    question: qStr,
    answer: hist[hist.length - 1].content,
    imageId,
    folderId
  });
  
  save.subSaved();
  showToast('Saved');
  if (btn) {
    btn.textContent = 'Saved';
    btn.disabled = true;
  }
};

window.generateSimilarSubject = async id => {
  const x = subjectSaved.find(s => String(s.id) === String(id));
  if (!x) return;
  showToast('Generating similar question...');
  try {
    const rep = await callGemini([{ role: 'user', content: `以下の問題と解答を参考にして、状況や数値を変えた類題を1つ出題し、その解答解説も出力せよ。JSONのみ: {"question":"...","answer":"...（文末は「〜だ。」）"}\nQ: ${x.question}\nA: ${x.answer}` }], 8192, '', true);
    const json = extractJSON(rep);
    subjectSaved.unshift({
      id: generateId(),
      subject: x.subject,
      subjectLabel: x.subjectLabel,
      date: new Date().toLocaleString('en-US'),
      question: json.question,
      answer: clean(json.answer),
      folderId: x.folderId
    });
    save.subSaved();
    renderSubjectSaved();
    showToast('Similar question added');
  } catch (e) {
    showToast('Communication error');
  }
};

window.createNewFolder = () => {
  const name = prompt('Enter new folder name:');
  if (!name || !name.trim()) return;
  subjectFolders.push({ id: 'folder_' + generateId(), name: name.trim() });
  save.subjectFolders();
  renderSubjectSaved();
};

const renderSubjectSaved = () => {
  const sl = $('subject-saved-list');
  if (!sl) return;
  
  const folderSel = $('subject-folder-select');
  if (folderSel) {
    const currentVal = folderSel.value;
    folderSel.innerHTML = `<option value="all">${t('folder_all')}</option><option value="uncategorized">${t('folder_uncategorized')}</option>` + subjectFolders.map(f => `<option value="${f.id}">${esc(f.name)}</option>`).join('');
    folderSel.value = currentVal || 'all';
  }
  
  const filterFolder = folderSel ? folderSel.value : 'all';
  let ls = subjectSaved.filter(x => x.subject === curSubj);
  if (filterFolder !== 'all') {
    ls = ls.filter(x => (x.folderId || 'uncategorized') === filterFolder);
  }
  
  if (ls.length) {
    sl.innerHTML = ls.map(x => `
      <div class="card mb-3">
        <div class="text-xs text-muted mb-2">${x.date}</div>
        <div class="text-sm font-bold mb-3">${esc(x.question)}</div>
        ${x.imageId ? `<div class="mb-3"><button class="btn-text-muted" onclick="showSavedImage('${x.imageId}')">View Image</button><div id="saved-img-${x.imageId}" class="mt-3"></div></div>` : ''}
        <div class="text-sm text-sub">${esc(x.answer)}</div>
        <div class="flex-gap-8 mt-4 flex-wrap">
          <button class="copy-btn flex-1 min-w-100 whitespace-nowrap" onclick="generateSimilarSubject('${x.id}')">Generate Similar</button>
          <button class="copy-btn text-danger flex-1 min-w-100 whitespace-nowrap" style="border-color:#f0d4d0;" onclick="deleteSubjectSaved('${x.id}')">Delete</button>
        </div>
      </div>
    `).join('');
  } else {
    sl.innerHTML = `<div class="vocab-empty">${getUiLang() === 'ja' ? '空です' : 'Empty'}</div>`;
  }
  
  sl.querySelectorAll('.text-sub').forEach(el => renderMath(el));
};

$('subject-folder-select')?.addEventListener('change', renderSubjectSaved);

window.showSavedImage = async (id) => {
  const container = $(`saved-img-${id}`);
  if (!container) return;
  if (container.innerHTML) {
    container.innerHTML = '';
    return;
  }
  const data = await getImageFromDB(id);
  if (data) {
    container.innerHTML = `<img src="${data}" style="max-width:100%; border-radius:8px;">`;
  }
};

window.deleteSubjectSaved = id => {
  const s = subjectSaved.find(x => String(x.id) === String(id));
  if (!s) return;
  subjectSaved = subjectSaved.filter(x => String(x.id) !== String(id));
  save.subSaved();
  renderSubjectSaved();
  
  showUndoSnackbar('Q&A history deleted', () => {
    subjectSaved.unshift(s);
    save.subSaved();
    renderSubjectSaved();
  }, () => {});
};

const renderSubjectQuiz = () => {
  const sqs = $('subject-quiz-start');
  const sqa = $('subject-quiz-area');
  if (!sqs || !sqa) return;
  
  const pendingQuiz = subjectQuizzes.find(q => q.subject === curSubj && !q.answer);
  if (pendingQuiz) {
    sqs.classList.add('hidden');
    sqa.classList.remove('hidden');
    renderSubjectQuizActive(pendingQuiz);
  } else {
    sqs.classList.remove('hidden');
    sqa.classList.add('hidden');
    const hist = subjectQuizzes.filter(q => q.subject === curSubj && q.answer);
    const hl = $('subject-quiz-history-list');
    if (hl) {
      hl.innerHTML = hist.length ? `<p class="section-note">Past Review Questions</p>` + hist.map(h => `
        <div class="writing-history-item" role="button" tabindex="0" onclick="showSubjectQuizHistory('${h.id}')">
          <div class="text-xs text-muted mb-2">${h.date}${h.score != null ? ' — ' + h.score + ' pts' : ''}</div>
          <div class="text-sm">${h.question.replace(/<[^>]+>/g, '').substring(0, 60)}...</div>
        </div>
      `).join('') : '';
    }
  }
};

window.generateSubjectQuiz = async () => {
  const ls = subjectSaved.filter(x => x.subject === curSubj);
  if (!ls.length) return showToast('No Q&A history');
  
  const qas = ls.slice(0, 5).map(x => `Q: ${x.question}\nA: ${x.answer}`).join('\n\n');
  const sqs = $('subject-quiz-start');
  const sqa = $('subject-quiz-area');
  
  if (sqs) sqs.classList.add('hidden');
  if (sqa) {
    sqa.classList.remove('hidden');
    sqa.innerHTML = `<div class="p-40">${skeletonHtml}</div>`;
  }
  
  try {
    const rep = await callGemini([{ role: 'user', content: `【QA履歴】\n${qas}\n\n復習問題を作成` }], 8192, `QA履歴から極めて難関な復習問題を1問作成せよ。HTML(h4+p)のみ。解答解説なし。`);
    const html = clean(rep.replace(/```html?/g, '').replace(/```/g, '').trim());
    const newQuiz = {
      id: 'squiz_' + generateId(),
      subject: curSubj,
      date: new Date().toLocaleDateString('en-US'),
      question: html,
      answer: '',
      feedback: '',
      score: null
    };
    subjectQuizzes.unshift(newQuiz);
    save.subQuiz();
    renderSubjectQuizActive(newQuiz);
  } catch (e) {
    if (sqa) handleApiError(e, sqa.id);
  }
};

const renderSubjectQuizActive = quiz => {
  const sqa = $('subject-quiz-area');
  if (!sqa) return;
  
  if (!quiz.answer) {
    sqa.innerHTML = `
      <div class="card">
        <p class="text-xs font-bold text-muted mb-3">Review Question</p>
        <div class="text-base mb-4 line-height-16">${quiz.question}</div>
        <textarea id="subquiz-answer-input" class="writing-textarea mb-3" placeholder="Answer..."></textarea>
        <button class="action-btn mb-0" id="subquiz-submit-btn" onclick="submitSubjectQuiz('${quiz.id}')">Correct</button>
        <div id="subquiz-loading" class="hidden text-center mt-10"><span class="loading-dots"></span></div>
      </div>
    `;
  } else {
    sqa.innerHTML = `
      <div class="card">
        <p class="text-xs font-bold text-green mb-3">Correction Complete</p>
        <div class="text-sm mb-3 pb-3 border-bottom line-height-16"><b>Question:</b><br>${quiz.question}</div>
        <div class="text-sm mb-3 pb-3 border-bottom line-height-16"><b>Answer:</b><br>${esc(quiz.answer)}</div>
        <div class="correction-box mt-0">${quiz.feedback}</div>
        <button class="action-btn mt-4 mb-0 bg-accent2" onclick="renderSubjectQuiz()">Back</button>
      </div>
    `;
  }
  renderMath(sqa);
};

window.submitSubjectQuiz = async id => {
  const i = $('subquiz-answer-input');
  if (!i || !i.value.trim()) return;
  const ans = i.value.trim();
  const quiz = subjectQuizzes.find(q => String(q.id) === String(id));
  const sb = $('subquiz-submit-btn');
  const ld = $('subquiz-loading');
  
  if (!quiz) return;
  if (sb) sb.classList.add('hidden');
  if (ld) ld.classList.remove('hidden');
  
  const ls = subjectSaved.filter(x => x.subject === curSubj).slice(0, 5).map(x => `Q: ${x.question}\nA: ${x.answer}`).join('\n\n');
  
  try {
    const sys = `非常に丁寧な添削と解説を作成せよ。以下のHTMLテンプレートの構造を【一言一句違わず】守って出力せよ。
<h4>Score</h4>
<p>[ここに0〜100の数字]/100</p>
<h4>Explanation</h4>
<ul><li>[解説。文末は「〜だ。」]</li></ul>
<h4>Model Answer</h4>
<p>[解答]</p>
参考:\n${ls}`;
    const rep = await callGemini([{ role: 'user', content: `問題:\n${quiz.question}\n解答:\n${ans}` }], 8192, sys);
    const html = clean(rep.replace(/```html?/g, '').replace(/```/g, ''));
    quiz.answer = ans;
    quiz.feedback = html;
    quiz.score = html.match(/(\d{1,3})\s*(?:点|\/\s*100)/i) ? parseInt(RegExp.$1) : null;
    save.subQuiz();
    renderSubjectQuizActive(quiz);
  } catch (e) {
    showToast('Communication error');
  } finally {
    if (ld) ld.classList.add('hidden');
    if (sb) sb.classList.remove('hidden');
  }
};

window.showSubjectQuizHistory = id => {
  const h = subjectQuizzes.find(x => String(x.id) === String(id));
  const mb = $('writing-history-modal-body');
  if (!h || !mb) return;
  
  let html = `
    <div class="text-sm mb-3 pb-3 border-bottom line-height-16"><b>Question:</b><br>${h.question}</div>
    <div class="text-sm mb-3 pb-3 border-bottom line-height-16"><b>Answer:</b><br>${esc(h.answer)}</div>
    <div class="correction-box mt-0">${h.feedback}</div>
    <button class="action-btn mt-4 mb-0 btn-danger" onclick="deleteSubjectQuizHistory('${id}')">Delete this question</button>
  `;
  mb.innerHTML = html;
  openModal('writing-history-modal');
  renderMath(mb);
};

window.deleteSubjectQuizHistory = id => {
  if (!confirm(getUiLang() === 'ja' ? '削除しますか？' : 'Delete?')) return;
  subjectQuizzes = subjectQuizzes.filter(x => String(x.id) !== String(id));
  save.subQuiz();
  renderSubjectQuiz();
  closeModal('writing-history-modal');
};

// ============================================================
// [15] PLANNER & LOGS
// ============================================================
window.setPlanMode = m => {
  planMode = m;
  ['calendar', 'weekly', 'yearly', 'gantt', 'score', 'ai'].forEach(x => {
    const el = $('plan-mode-' + x);
    if (el) {
      if (x === m) el.classList.add('active');
      else el.classList.remove('active');
    }
  });
  
  const pa = $('plan-calendar-area');
  const pw = $('plan-weekly-area');
  const py = $('plan-yearly-area');
  const pg = $('plan-gantt-area');
  const pai = $('plan-ai-area');
  const ps = $('plan-score-area');
  
  if (pa) { if (m === 'calendar') pa.classList.remove('hidden'); else pa.classList.add('hidden'); }
  if (pw) { if (m === 'weekly') pw.classList.remove('hidden'); else pw.classList.add('hidden'); }
  if (py) { if (m === 'yearly') py.classList.remove('hidden'); else py.classList.add('hidden'); }
  if (pg) { if (m === 'gantt') pg.classList.remove('hidden'); else pg.classList.add('hidden'); }
  if (pai) { if (m === 'ai') pai.classList.remove('hidden'); else pai.classList.add('hidden'); }
  if (ps) { if (m === 'score') ps.classList.remove('hidden'); else ps.classList.add('hidden'); }
  
  if (m === 'score') {
    renderScoreList();
    renderScoreChart();
  }
  if (m === 'calendar') {
    renderPlanCalendar();
    renderPlanDateList();
  }
  if (m === 'weekly') {
    renderWeeklyPlan();
  }
  if (m === 'yearly') {
    renderYearlyPlan();
  }
};

window.planCalPrev = () => {
  pCalMonth--;
  if (pCalMonth < 0) {
    pCalMonth = 11;
    pCalYear--;
  }
  renderPlanCalendar();
};

window.planCalNext = () => {
  pCalMonth++;
  if (pCalMonth > 11) {
    pCalMonth = 0;
    pCalYear++;
  }
  renderPlanCalendar();
};

const renderPlanCalendar = () => {
  const cl = $('plan-cal-month-label');
  if (cl) cl.textContent = `${pCalYear} ${t('month_' + (pCalMonth + 1))}`;
  
  const firstDay = new Date(pCalYear, pCalMonth, 1);
  const lastDay = new Date(pCalYear, pCalMonth + 1, 0);
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;
  
  let html = '';
  for (let i = 0; i < startDow; i++) {
    html += `<div class="cal-day other-month"></div>`;
  }
  
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const ds = `${pCalYear}-${String(pCalMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    let cls = 'cal-day';
    if (ds === todayDateStr()) cls += ' today';
    if (ds === selectedPlanDate) cls += ' selected';
    
    let dotHtml = '';
    const dp = plans[ds];
    if (dp && dp.length > 0) {
      dotHtml += `<div style="width:6px;height:6px;border-radius:50%;background:${dp.every(p => p.done) ? 'var(--green)' : 'var(--streak)'};"></div>`;
    }
    const ev = events[ds];
    if (ev && ev.length > 0) {
      dotHtml += `<div style="width:6px;height:6px;border-radius:50%;background:#3B82F6;"></div>`;
    }
    
    const dot = dotHtml ? `<div style="position:absolute;bottom:4px;left:50%;transform:translateX(-50%);display:flex;gap:3px;">${dotHtml}</div>` : '';
    html += `<div class="${cls}" onclick="selectPlanDate('${ds}')">${d}${dot}</div>`;
  }
  
  const cd = $('plan-cal-days');
  if (cd) cd.innerHTML = html;
};

window.selectPlanDate = ds => {
  selectedPlanDate = ds;
  renderPlanCalendar();
  renderPlanDateList();
};

const renderPlanDateList = () => {
  const lbl = $('plan-selected-date-label');
  if (lbl) lbl.textContent = selectedPlanDate;
  
  const evL = $('plan-event-list');
  const lsE = events[selectedPlanDate] || [];
  if (evL) {
    evL.innerHTML = lsE.length ? lsE.map((e, i) => `
      <div class="plan-item-row" style="margin-bottom:8px;border-left:4px solid #3B82F6;">
        <div style="flex:1">
          <div class="pi-text" style="font-size:15px;">${esc(e.text)}</div>
        </div>
        <button class="plan-del" onclick="deletePlanEvent(${i})">✕</button>
      </div>
    `).join('') : `<div class="text-center text-xs text-muted">${getUiLang() === 'ja' ? '予定はありません' : 'No events'}</div>`;
  }
  
  const plL = $('plan-content');
  const lsP = plans[selectedPlanDate] || [];
  if (plL) {
    plL.innerHTML = lsP.length ? lsP.map((p, i) => `
      <div class="plan-item-row mb-2">
        <input type="checkbox" ${p.done ? 'checked' : ''} onchange="togglePlanDatePlan(${i})">
        <div style="flex:1">
          <div class="pi-text ${p.done ? 'done' : ''}" style="font-size:15px;">${esc(p.text)}</div>
          ${p.time ? `<div class="pi-time" style="font-size:12px;color:var(--text-muted);margin-top:4px;">${esc(p.time)}</div>` : ''}
        </div>
        <button class="plan-del" onclick="deletePlanDatePlan(${i})">✕</button>
      </div>
    `).join('') : `<p class="text-center text-xs text-muted p-10">${getUiLang() === 'ja' ? '計画はありません' : 'No plans'}</p>`;
  }
};

window.toggleRoutineDays = val => {
  const sel = $('routine-days-selector');
  if (sel) {
    if (val === 'weekly') sel.classList.remove('hidden');
    else sel.classList.add('hidden');
  }
};

window.addPlanEvent = () => {
  const i = $('plan-event-input');
  if (!i || !i.value.trim()) return;
  if (!events[selectedPlanDate]) events[selectedPlanDate] = [];
  events[selectedPlanDate].push({ text: i.value.trim() });
  save.events();
  i.value = '';
  renderPlanCalendar();
  renderPlanDateList();
  if ($('Dashboard').classList.contains('active')) renderDashboard();
};

window.deletePlanEvent = i => {
  if (events[selectedPlanDate]) {
    events[selectedPlanDate].splice(i, 1);
    if (events[selectedPlanDate].length === 0) delete events[selectedPlanDate];
    save.events();
    renderPlanCalendar();
    renderPlanDateList();
    if ($('Dashboard').classList.contains('active')) renderDashboard();
  }
};

window.addPlanDatePlan = () => {
  const i = $('new-plan-input');
  const tStr = $('new-plan-time');
  const r = $('new-plan-routine');
  
  if (!i || !i.value.trim()) return;
  
  const text = i.value.trim();
  const time = tStr ? tStr.value.trim() : '';
  const routine = r ? r.value : 'none';
  
  if (routine === 'none') {
    if (!plans[selectedPlanDate]) plans[selectedPlanDate] = [];
    plans[selectedPlanDate].push({ text, done: false, time });
  } else {
    const startDate = new Date(selectedPlanDate);
    for (let j = 0; j < 90; j++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + j);
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      
      let shouldAdd = false;
      if (routine === 'daily') {
        shouldAdd = true;
      } else if (routine === 'weekly') {
        const checkedDays = Array.from(document.querySelectorAll('#routine-days-selector input:checked')).map(cb => parseInt(cb.value));
        if (checkedDays.includes(d.getDay())) shouldAdd = true;
      } else if (routine === 'monthly') {
        if (d.getDate() === startDate.getDate()) shouldAdd = true;
      }
      
      if (shouldAdd) {
        if (!plans[ds]) plans[ds] = [];
        plans[ds].push({ text, done: false, time });
      }
    }
  }
  
  save.plans();
  i.value = '';
  if (tStr) tStr.value = '';
  renderPlanCalendar();
  renderPlanDateList();
  if ($('Dashboard').classList.contains('active')) renderDashboard();
};

window.togglePlanDatePlan = i => {
  if (plans[selectedPlanDate] && plans[selectedPlanDate][i]) {
    plans[selectedPlanDate][i].done = !plans[selectedPlanDate][i].done;
    save.plans();
    renderPlanCalendar();
    renderPlanDateList();
    if ($('Dashboard').classList.contains('active')) renderDashboard();
  }
};

window.deletePlanDatePlan = i => {
  if (plans[selectedPlanDate]) {
    const p = plans[selectedPlanDate][i];
    plans[selectedPlanDate].splice(i, 1);
    if (plans[selectedPlanDate].length === 0) delete plans[selectedPlanDate];
    save.plans();
    renderPlanCalendar();
    renderPlanDateList();
    if ($('Dashboard').classList.contains('active')) renderDashboard();
    
    showUndoSnackbar('Plan deleted', () => {
      if (!plans[selectedPlanDate]) plans[selectedPlanDate] = [];
      plans[selectedPlanDate].splice(i, 0, p);
      save.plans();
      renderPlanCalendar();
      renderPlanDateList();
      if ($('Dashboard').classList.contains('active')) renderDashboard();
    }, () => {});
  }
};

window.rebuildScheduleAI = async () => {
  if (!confirm(getUiLang() === 'ja' ? '過去の未完了タスクを今日以降に自動再配置しますか？' : 'Automatically reschedule past incomplete plans to today or later?')) return;
  const today = todayDateStr();
  let pendingTasks = [];
  
  Object.keys(plans).forEach(date => {
    if (date < today) {
      plans[date].forEach(p => {
        if (!p.done) pendingTasks.push(p.text);
      });
      plans[date] = plans[date].filter(p => p.done);
    }
  });
  
  if (pendingTasks.length === 0) return showToast('No incomplete tasks to reschedule');
  
  const pa = $('plan-calendar-area');
  const ld = document.createElement('div');
  ld.className = 'p-20';
  ld.innerHTML = skeletonHtml;
  if (pa) pa.prepend(ld);
  
  try {
    const sys = `以下の未完了タスクを今日以降の適切な日程に分散させて再配置し、JSON配列で出力せよ。形式: [{"date":"YYYY-MM-DD", "tasks":["タスク1"]}]\n\n未完了タスク:\n${pendingTasks.join('\n')}`;
    const rep = await callGemini([{ role: 'user', content: sys }], 8192, '', true);
    const arr = extractJSON(rep);
    if (arr && arr.length) {
      arr.forEach(d => {
        if (!plans[d.date]) plans[d.date] = [];
        d.tasks.forEach(tStr => plans[d.date].push({ text: tStr, done: false, time: '' }));
      });
      save.plans();
      renderPlanCalendar();
      renderPlanDateList();
      showToast('Schedule rebuilt');
    } else {
      showToast('Failed to rebuild');
    }
  } catch (e) {
    showToast('Communication error');
  } finally {
    if (ld) ld.remove();
  }
};

const renderTextbooks = () => {
  const c = $('textbook-chips');
  if (!c) return;
  
  textbooks = textbooks.map(tObj => typeof tObj === 'string' ? { id: generateId(), name: tObj, subject: 'other' } : tObj);
  
  if (textbooks.length) {
    c.innerHTML = textbooks.map((tObj, i) => `
      <div class="filter-chip flex-between w-full" data-id="${tObj.id}" style="cursor:grab; padding:10px 16px;">
        <div class="flex align-center">
          <span class="material-symbols-rounded text-muted mr-2" style="font-size:18px;">drag_indicator</span>
          <span class="subj-badge ${tObj.subject}">${SCORE_SUBJECTS[tObj.subject]?.label || 'Oth'}</span>
          <span class="font-bold">${esc(tObj.name)}</span>
        </div>
        <button onclick="deleteTextbook('${tObj.id}')" class="btn-clear text-danger">✕</button>
      </div>
    `).join('');
  } else {
    c.innerHTML = `<span class="text-xs text-muted">${getUiLang() === 'ja' ? '空です' : 'Empty'}</span>`;
  }
  
  const ws = $('weekly-textbook-select');
  if (ws) {
    ws.innerHTML = `<option value="">${getUiLang() === 'ja' ? '参考書を選択...' : 'Select textbook...'}</option>` + textbooks.map(tObj => `<option value="${tObj.id}">${esc(tObj.name)}</option>`).join('');
  }

  if (sortableTextbooks) sortableTextbooks.destroy();
  sortableTextbooks = Sortable.create(c, {
    animation: 150,
    handle: '.material-symbols-rounded',
    onEnd: () => {
      const newOrderIds = Array.from(c.children).map(el => el.getAttribute('data-id'));
      textbooks = newOrderIds.map(id => textbooks.find(tObj => tObj.id === id)).filter(Boolean);
      save.books();
      renderTextbooks();
    }
  });
};

window.addTextbook = () => {
  const i = $('new-textbook-input');
  const s = $('new-textbook-subj');
  if (!i || !s) return;
  const v = i.value.trim();
  if (v) {
    textbooks.push({ id: generateId(), name: v, subject: s.value });
    save.books();
    i.value = '';
    renderTextbooks();
  }
};

window.deleteTextbook = id => {
  textbooks = textbooks.filter(tObj => tObj.id !== id);
  save.books();
  renderTextbooks();
};

window.planWeeklyPrev = () => {
  planWeeklyOffset++;
  renderWeeklyPlan();
};

window.planWeeklyNext = () => {
  if (planWeeklyOffset > 0) {
    planWeeklyOffset--;
    renderWeeklyPlan();
  }
};

const renderWeeklyPlan = () => {
  const c = $('plan-weekly-days');
  const lbl = $('plan-weekly-label');
  if (!c) return;
  
  if (lbl) {
    if (planWeeklyOffset === 0) lbl.textContent = t('label_this_week');
    else if (planWeeklyOffset === 1) lbl.textContent = t('label_last_week');
    else lbl.textContent = `${planWeeklyOffset} ${t('weeks_ago')}`;
  }

  const now = new Date();
  now.setDate(now.getDate() - (planWeeklyOffset * 7));
  const currentDay = now.getDay();
  const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  let html = '';
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const isToday = ds === todayDateStr();
    
    const dayPlans = plans[ds] || [];
    const planHtml = dayPlans.length ? dayPlans.map((p, idx) => `
      <div class="plan-item-row" style="padding:8px 12px; margin-bottom:6px;">
        <input type="checkbox" ${p.done ? 'checked' : ''} onchange="toggleWeeklyPlan('${ds}', ${idx})">
        <div style="flex:1"><div class="pi-text ${p.done ? 'done' : ''}" style="font-size:14px;">${esc(p.text)}</div></div>
        <button class="plan-del" onclick="deleteWeeklyPlan('${ds}', ${idx})">✕</button>
      </div>
    `).join('') : `<div class="text-xs text-muted text-center py-2">${getUiLang() === 'ja' ? '計画はありません' : 'No plans'}</div>`;

    html += `
      <div class="weekly-day-card" style="${isToday ? 'border-color:var(--accent); background:var(--bg2);' : ''}">
        <div class="weekly-day-header">
          <span class="weekly-day-title">${t('day_' + dayNames[i].toLowerCase())}</span>
          <span class="weekly-day-date">${d.getMonth() + 1}/${d.getDate()}</span>
        </div>
        <div>${planHtml}</div>
      </div>
    `;
  }
  c.innerHTML = html;
};

window.toggleWeeklyPlan = (ds, idx) => {
  if (plans[ds] && plans[ds][idx]) {
    plans[ds][idx].done = !plans[ds][idx].done;
    save.plans();
    renderWeeklyPlan();
    if (planMode === 'calendar') renderPlanCalendar();
  }
};

window.deleteWeeklyPlan = (ds, idx) => {
  if (plans[ds]) {
    plans[ds].splice(idx, 1);
    if (plans[ds].length === 0) delete plans[ds];
    save.plans();
    renderWeeklyPlan();
    if (planMode === 'calendar') renderPlanCalendar();
  }
};

window.addWeeklyPlanFromTextbook = () => {
  const tbId = $('weekly-textbook-select').value;
  const pages = $('weekly-plan-pages').value.trim();
  const dayVal = parseInt($('weekly-plan-day').value);
  
  if (!tbId || !pages) return showToast('Please enter textbook and range');
  
  const tb = textbooks.find(tObj => tObj.id === tbId);
  if (!tb) return;

  const now = new Date();
  now.setDate(now.getDate() - (planWeeklyOffset * 7));
  const currentDay = now.getDay();
  const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  
  let targetOffset = dayVal === 0 ? 6 : dayVal - 1;
  const targetDate = new Date(monday);
  targetDate.setDate(monday.getDate() + targetOffset);
  
  const ds = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
  
  if (!plans[ds]) plans[ds] = [];
  plans[ds].push({ text: `[${tb.name}] ${pages}`, done: false, time: '' });
  save.plans();
  
  $('weekly-plan-pages').value = '';
  renderWeeklyPlan();
  showToast('Added');
};

const getAcademicYearLabel = m => {
  const now = new Date();
  const curCalMonth = now.getMonth() + 1;
  const acadStartYear = curCalMonth >= 4 ? now.getFullYear() : now.getFullYear() - 1;
  const displayYear = (m >= 1 && m <= 3) ? (acadStartYear + 1) : acadStartYear;
  return `${t('month_' + m)} (${displayYear})`;
};

const renderYearlyPlan = () => {
  const mg = $('yearly-main-goal');
  if (mg) mg.value = yearlyPlan.goal || '';
  
  const grid = $('yearly-months-grid');
  if (!grid) return;
  
  let html = '';
  const curMonth = new Date().getMonth() + 1;
  
  ACADEMIC_YEAR_MONTHS.forEach(i => {
    const val = yearlyPlan.months[i] || '';
    const isCur = i === curMonth;
    html += `
      <div class="yearly-month-card" style="${isCur ? 'border-color:var(--accent); background:var(--bg2);' : ''}">
        <div class="yearly-month-label">${getAcademicYearLabel(i)} ${isCur ? `<span class="text-accent">(${getUiLang() === 'ja' ? '今月' : 'This Month'})</span>` : ''}</div>
        <textarea class="yearly-month-input" rows="3" placeholder="Goals / Plans..." oninput="updateYearlyMonth(${i}, this.value)">${esc(val)}</textarea>
      </div>
    `;
  });
  grid.innerHTML = html;
};

window.updateYearlyMonth = (m, val) => {
  if (!yearlyPlan.months) yearlyPlan.months = {};
  yearlyPlan.months[m] = val;
  saveYearlyPlanDebounced();
};

const saveYearlyPlan = () => {
  const mg = $('yearly-main-goal');
  if (mg) yearlyPlan.goal = mg.value.trim();
  save.yearly();
  if ($('Dashboard').classList.contains('active')) renderDashboard();
};

const saveYearlyPlanDebounced = debounce(saveYearlyPlan, 500);

window.generateMilestonesAI = async () => {
  const goal = $('yearly-main-goal').value;
  if (!goal) return showToast('Please enter yearly main goal');
  
  const grid = $('yearly-months-grid');
  if (grid) grid.innerHTML = `<div class="p-20" style="grid-column: 1 / -1;">${skeletonHtml}</div>`;
  
  try {
    const rep = await callGemini([{ role: 'user', content: `目標「${goal}」を達成するための月別マイルストーンをJSONで出力せよ。形式: {"4":"...", "5":"..."}` }], 8192, '', true);
    const json = extractJSON(rep);
    if (json) {
      Object.keys(json).forEach(m => {
        if (yearlyPlan.months) yearlyPlan.months[m] = json[m];
      });
      save.yearly();
      renderYearlyPlan();
      showToast('Generation complete');
    }
  } catch (e) {
    showToast('Generation failed');
    renderYearlyPlan();
  }
};

window.slideGanttSchedule = () => {
  showToast('Under development');
};

window.generateGanttSchedule = async () => {
  const targetName = $('gantt-target-name')?.value.trim();
  const targetDate = $('gantt-target-date')?.value;
  const materials = $('gantt-materials')?.value.trim();
  
  if (!targetName || !targetDate || !materials) return showToast('Please fill in all fields');
  
  const today = todayDateStr();
  if (targetDate < today) return showToast('Target date must be today or later');
  
  const ld = $('gantt-loading');
  const btn = $('gantt-generate-btn');
  if (ld) {
    ld.innerHTML = skeletonHtml;
    ld.classList.remove('hidden');
  }
  if (btn) btn.disabled = true;
  
  const prompt = `今日(${today})から目標日(${targetDate})までの学習スケジュール（逆算プラン）を構築し、JSON配列で出力せよ。
目標: ${targetName}
使用参考書・タスク量:\n${materials}
出力形式: [{"date": "YYYY-MM-DD", "tasks": ["やること1", "やること2"]}]`;

  try {
    const rep = await callGemini([{ role: 'user', content: prompt }], 8192, '', true);
    const planArr = extractJSON(rep);
    if (!planArr || !Array.isArray(planArr)) throw new Error('Invalid JSON');
    
    let addedCount = 0;
    planArr.forEach(dayPlan => {
      const d = dayPlan.date;
      if (!plans[d]) plans[d] = [];
      dayPlan.tasks.forEach(tStr => {
        const taskText = `[${targetName}] ${tStr}`;
        if (!plans[d].some(p => p.text === taskText)) {
          plans[d].push({ text: taskText, done: false, time: null });
          addedCount++;
        }
      });
    });
    save.plans();
    
    $('gantt-result-card')?.classList.remove('hidden');
    const resultText = $('gantt-result-text');
    if (resultText) resultText.textContent = `${addedCount} tasks automatically placed on the calendar.`;
    showToast('Schedule generation complete');
    
    if (!events[targetDate]) events[targetDate] = [];
    if (!events[targetDate].some(e => e.text.includes(targetName))) {
      events[targetDate].push({ text: `[ ${targetName} Day ]` });
      save.events();
    }
    
  } catch (e) {
    showToast('Communication error: Failed to create schedule');
  } finally {
    if (ld) ld.classList.add('hidden');
    if (btn) btn.disabled = false;
  }
};

window.generateAutoSchedule = () => {
  const { dueWords, dueSyntax, dueDaily } = srsGetDueItems();
  const ts = todayDateStr();
  if (!plans[ts]) plans[ts] = [];
  let added = 0;
  
  if (dueWords.length > 0) {
    const vw = dueWords.filter(w => ALL_WORDS.find(x => x.word.toLowerCase() === w));
    for (let i = 0; i < vw.length; i += 15) {
      plans[ts].push({ text: `Vocab Review (${vw.slice(i, i + 15).join(', ')})`, done: false, time: null });
      added++;
    }
  }
  
  if (dueSyntax.length > 0) {
    const vs = dueSyntax.map(id => syntaxList.find(s => String(s.id) === id)).filter(Boolean);
    for (let i = 0; i < vs.length; i += 5) {
      plans[ts].push({ text: `Syntax Review (${vs.slice(i, i + 5).map(s => s.syntax).join(', ')})`, done: false, time: null });
      added++;
    }
  }
  
  if (dueDaily.length > 0) {
    const vd = dueDaily.map(id => dailyChallenges.find(d => String(d.id) === id) || listenHistory.find(d => String(d.id) === id)).filter(Boolean);
    vd.forEach(d => {
      plans[ts].push({ text: `Past Question (${d.date})`, done: false, time: null });
      added++;
    });
  }
  
  if (examScores.length > 0) {
    const lt = examScores[0];
    if (lt.subjects && lt.subjects.length > 0) {
      const weak = lt.subjects.reduce((p, c) => {
        const pv = parseFloat(p.dev) || parseFloat(p.score) || 1000;
        const cv = parseFloat(c.dev) || parseFloat(c.score) || 1000;
        return (cv < pv) ? c : p;
      });
      plans[ts].push({ text: `Weakness Focus: ${weak.cat}(${weak.detail})`, done: false, time: null });
      added++;
    }
  }
  
  if (added === 0) {
    showToast('Perfect!');
  } else {
    save.plans();
    renderDashboard();
    if (planMode === 'calendar') {
      renderPlanCalendar();
      renderPlanDateList();
    }
    showToast(`${added} added`);
  }
};

window.clearPlanAiChat = () => {
  planAiHistory = [];
  const c = $('plan-ai-chat');
  if (c) c.innerHTML = '';
};

window.sendPlanAiMessage = async () => {
  const i = $('plan-ai-input');
  if (!i || !i.value.trim()) return;
  const txt = i.value.trim();
  i.value = '';
  autoResize(i);
  
  const sbtn = $('plan-ai-send');
  if (sbtn) sbtn.disabled = true;
  
  const c = $('plan-ai-chat');
  if (!c) return;
  
  c.insertAdjacentHTML('beforeend', `<div class="chat-bubble user">${esc(txt)}</div><div class="chat-bubble ai" id="pai-load"><span class="loading-dots"></span></div>`);
  planAiHistory.push({ role: 'user', content: txt });
  c.scrollTop = c.scrollHeight;
  
  try {
    const rep = await callGemini(planAiHistory.slice(), 8192, `学習アドバイザーとして回答せよ。文末は必ず「〜だ」「〜である」に統一すること。プロフ:${userProfile.targetUniv},${userProfile.grade}${buildScoreContext()}。`);
    const cleanRep = clean(rep);
    planAiHistory.push({ role: 'assistant', content: cleanRep });
    
    const ld = $('pai-load');
    if (ld) ld.remove();
    
    c.insertAdjacentHTML('beforeend', `<div class="chat-bubble ai">${cleanRep.replace(/\n/g, '<br>')}</div>`);
  } catch (e) {
    const ld = $('pai-load');
    if (ld) ld.remove();
    c.insertAdjacentHTML('beforeend', `<div class="chat-bubble ai text-danger">Communication error</div>`);
    planAiHistory.pop();
  } finally {
    if (sbtn) sbtn.disabled = false;
    c.scrollTop = c.scrollHeight;
  }
};

window.generateRoadmapReport = async () => {
  const r = $('ai-weakness-report');
  if (!r) return;
  r.innerHTML = `<div class="p-20">${skeletonHtml}</div>`;
  try {
    const sys = `客観的なデータ分析に基づき、合格ロードマップを作成せよ。プロフ(${JSON.stringify(userProfile)})と成績(${JSON.stringify(examScores.slice(0, 3))})から以下のHTMLテンプレートの構造を【一言一句違わず】守って出力せよ。
<h4>Current Analysis</h4>
<p>[分析。文末は「〜である。」]</p>
<h4>Monthly Roadmap</h4>
<ul><li><b>[月]</b>: [目標。文末は「〜だ。」]</li></ul>
<h4>Priority Tasks</h4>
<p>[課題。文末は「〜である。」]</p>`;
    const rep = await callGemini([{ role: 'user', content: '合格ロードマップを作成' }], 8192, sys);
    r.innerHTML = `<div class="card">${clean(rep.replace(/```html?/g, '').replace(/```/g, ''))}</div>`;
  } catch (e) {
    handleApiError(e, 'ai-weakness-report');
  }
};

window.generatePersonalizedExam = async () => {
  const r = $('ai-weakness-report');
  if (!r) return;
  r.innerHTML = `<div class="p-20">${skeletonHtml}</div>`;
  
  const weakWords = Object.entries(srsData).sort((a, b) => a[1].stability - b[1].stability).slice(0, 15).map(x => x[0]).join(', ');
  const recentMistakes = dailyChallenges.filter(d => d.score !== null && d.score < 80).slice(0, 3).map(d => d.question).join('\n');
  const pastExams = examScores.slice(0, 2).map(s => s.subjects.map(x => `${x.detail}:${x.dev}`).join(', ')).join('\n');
  
  const prompt = `以下の生徒の過去の学習データから、完全カスタマイズされた模試問題（英語長文または和文英訳などを1題）を作成せよ。以下のHTMLテンプレートの構造を【一言一句違わず】守って出力せよ。
<h4>Custom Exam</h4>
<p>[問題文]</p>
<h4>Answer & Explanation</h4>
<p>Answer: [正解]<br>Explanation: [解説。文末は「〜だ。」]</p>
【弱点単語】${weakWords}\n【最近の誤答傾向】${recentMistakes}\n【過去の成績】${pastExams}`;
  
  try {
    const rep = await callGemini([{ role: 'user', content: prompt }], 8192, '');
    r.innerHTML = `<div class="card">${clean(rep.replace(/```html?/g, '').replace(/```/g, ''))}</div>`;
  } catch (e) {
    handleApiError(e, 'ai-weakness-report');
  }
};

window.ocrScore = async e => {
  const f = e.target.files[0];
  if (!f) return;
  showToast('Analyzing image...');
  
  const resized = await resizeImage(f, 2048, 2048, false);
  const b = resized.split(',')[1];
  const m = resized.match(/data:([^;]+)/)[1];
  
  try {
    const rep = await callGemini([{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: m, data: b } }, { type: 'text', text: '成績表から模試名、実施日(YYYY/MM形式)、各科目の点数と偏差値(catはenglish,math,japanese,science,social,totalのいずれか、detailは科目名)、各志望校判定(univ,rank)を抽出せよ。出力は必ず {"name":"","date":"","subjects":[{"cat":"","detail":"","score":"","dev":""}],"judges":[{"univ":"","rank":""}]} のJSON形式のみ。' }] }], 8192, '', true);
    const json = extractJSON(rep);
    const ni = $('score-exam-name');
    const di = $('score-exam-date');
    
    if (ni && json.name) ni.value = json.name;
    if (di && json.date) di.value = json.date;
    
    $('exam-subjects-container').innerHTML = '';
    if (json.subjects) {
      json.subjects.forEach(s => {
        window.addExamSubjectRow();
        const rs = document.querySelectorAll('.score-subject-row');
        const r = rs[rs.length - 1];
        if (r) {
          r.querySelector('.exam-subj-cat').value = s.cat || 'other';
          window.updateSubjList(r.querySelector('.exam-subj-cat'));
          r.querySelector('.exam-subj-detail').value = s.detail;
          r.querySelector('.exam-subj-score').value = s.score;
          r.querySelector('.exam-subj-dev').value = s.dev;
        }
      });
    }
    
    $('exam-judges-container').innerHTML = '';
    if (json.judges) {
      json.judges.forEach(j => {
        window.addExamJudgeRow();
        const rs = document.querySelectorAll('.score-judge-row');
        const r = rs[rs.length - 1];
        if (r) {
          r.querySelector('.exam-judge-univ').value = j.univ;
          r.querySelector('.exam-judge-rank').value = j.rank;
        }
      });
    }
    showToast('Input reflected');
  } catch (err) {
    showToast('OCR failed');
  }
};

const getSubjectOptions = cat => {
  return (SCORE_SUBJECTS[cat]?.details.map(d => `<option value="${d}">${d}</option>`).join('')) || '';
};

window.updateSubjList = sel => {
  const ds = sel.parentElement.querySelector('.exam-subj-detail');
  if (ds) ds.innerHTML = getSubjectOptions(sel.value);
};

window.addExamSubjectRow = () => {
  const c = $('exam-subjects-container');
  if (!c) return;
  const r = document.createElement('div');
  r.className = 'score-subject-row flex gap-2 flex-wrap';
  const cats = Object.entries(SCORE_SUBJECTS).map(([k, v]) => `<option value="${k}" ${k === 'english' ? 'selected' : ''}>${v.label}</option>`).join('');
  r.innerHTML = `
    <select class="score-input exam-subj-cat w-auto flex-1 min-w-80" onchange="updateSubjList(this)">${cats}</select>
    <select class="score-input exam-subj-detail w-auto flex-1 min-w-100">${getSubjectOptions('english')}</select>
    <input class="score-input exam-subj-score w-60" type="number" placeholder="${t('label_score')}">
    <input class="score-input exam-subj-dev w-70" type="number" step="0.1" placeholder="${t('label_dev')}">
    <button onclick="this.parentElement.remove()" class="btn-clear p-8">✕</button>
  `;
  c.appendChild(r);
};

window.addExamJudgeRow = () => {
  const c = $('exam-judges-container');
  if (!c) return;
  const r = document.createElement('div');
  r.className = 'score-judge-row flex gap-2 flex-wrap';
  r.innerHTML = `
    <input class="score-input exam-judge-univ flex-2 min-w-100" placeholder="${t('label_univ')}">
    <select class="score-input exam-judge-rank flex-1 min-w-60">
      <option>A</option><option>B</option><option>C</option><option>D</option><option>E</option>
    </select>
    <button onclick="this.parentElement.remove()" class="btn-clear p-8">✕</button>
  `;
  c.appendChild(r);
};

window.addExamScore = () => {
  const ni = $('score-exam-name');
  if (!ni) return;
  const n = ni.value.trim();
  if (!n) return showToast('Enter exam name');
  
  const subjects = [];
  document.querySelectorAll('.score-subject-row').forEach(r => {
    const cat = r.querySelector('.exam-subj-cat').value;
    const detail = r.querySelector('.exam-subj-detail').value;
    const score = r.querySelector('.exam-subj-score').value.trim();
    const dev = r.querySelector('.exam-subj-dev').value.trim();
    if (score || dev) subjects.push({ cat, detail, score, dev });
  });
  
  const judges = [];
  document.querySelectorAll('.score-judge-row').forEach(r => {
    const univ = r.querySelector('.exam-judge-univ').value.trim();
    const rank = r.querySelector('.exam-judge-rank').value;
    if (univ) judges.push({ univ, rank });
  });
  
  const di = $('score-exam-date');
  const mi = $('score-memo');
  
  examScores.unshift({
    id: Date.now(),
    name: n,
    date: di ? di.value.trim() : '',
    memo: mi ? mi.value.trim() : '',
    subjects,
    judges
  });
  
  save.exams();
  renderScoreList();
  renderScoreChart();
  showToast('Saved');
  
  ni.value = '';
  if (di) di.value = '';
  if (mi) mi.value = '';
  $('exam-subjects-container').innerHTML = '';
  $('exam-judges-container').innerHTML = '';
  window.addExamSubjectRow();
  window.addExamJudgeRow();
};

window.deleteExamScore = id => {
  examScores = examScores.filter(s => s.id !== id);
  save.exams();
  renderScoreList();
  renderScoreChart();
};

const renderScoreList = () => {
  const c = $('score-list');
  if (!c) return;
  if (!examScores.length) {
    c.innerHTML = `<div class="vocab-empty">${getUiLang() === 'ja' ? '成績がありません' : 'No scores'}</div>`;
    return;
  }
  
  c.innerHTML = examScores.map(s => {
    const subjHtml = (s.subjects || []).map(x => `
      <div class="flex-between border-bottom border-dashed py-4 text-xs">
        <span>${(SCORE_SUBJECTS[x.cat]?.label || x.cat)} (${esc(x.detail)})</span>
        <span>${x.score ? esc(x.score) + ' pts' : '-'} ${x.dev ? '(Dev:' + esc(x.dev) + ')' : ''}</span>
      </div>
    `).join('');
    
    const judgeHtml = (s.judges || []).map(x => `
      <span class="inline-block bg-main border radius-sm px-8 py-4 mr-4 mb-2 text-xs font-bold">
        ${esc(x.univ)} <span class="text-danger">${esc(x.rank)}</span>
      </span>
    `).join('');
    
    return `
      <div class="card mb-3">
        <div class="flex-between align-center mb-3">
          <div>
            <div class="text-base font-bold">${esc(s.name)}</div>
            ${s.date ? `<div class="text-xs text-muted mt-1">${esc(s.date)}</div>` : ''}
          </div>
          <button onclick="deleteExamScore(${s.id})" class="btn-clear">✕</button>
        </div>
        ${subjHtml ? `<div class="mb-3">${subjHtml}</div>` : ''}
        ${judgeHtml ? `<div class="mb-2">${judgeHtml}</div>` : ''}
        ${s.memo ? `<div class="text-xs text-muted pt-3 border-top">${esc(s.memo)}</div>` : ''}
      </div>
    `;
  }).join('');
};

window.setScoreChartMode = m => {
  scoreChartMode = m;
  ['dev', 'judge'].forEach(x => {
    const btn = $('score-chart-mode-' + x);
    if (btn) {
      if (x === m) btn.classList.add('active');
      else btn.classList.remove('active');
    }
  });
  renderScoreChart();
};

const renderScoreChart = () => {
  const cv = $('scoreLineChart');
  const card = $('score-chart-card');
  if (!cv || !card) return;
  if (cv.offsetParent === null) return;
  
  const scored = examScores.filter(s => s.subjects && s.subjects.some(x => x.dev));
  if (!scored.length) {
    card.classList.add('hidden');
    return;
  }
  card.classList.remove('hidden');
  
  const sorted = [...scored].sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
  const labels = sorted.map(s => s.date || s.name);
  const colors = ['#3B82F6', '#EF4444', '#10B981', '#F97316', '#8B5CF6', '#14B8A6', '#C2410C', '#475569'];
  
  let datasets = [];
  let allDetails = [];
  
  if (scoreChartMode === 'dev') {
    allDetails = [...new Set(sorted.flatMap(s => s.subjects.filter(x => x.dev).map(x => x.detail)))];
    datasets = allDetails.map((det, i) => ({
      label: det,
      data: sorted.map(s => {
        const f = s.subjects.find(x => x.detail === det && x.dev);
        return f ? parseFloat(f.dev) : null;
      }),
      borderColor: colors[i % colors.length],
      backgroundColor: colors[i % colors.length] + '33',
      tension: 0.3,
      pointRadius: 5,
      pointHoverRadius: 7,
      spanGaps: true
    }));
  } else {
    const rankMap = { 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1 };
    allDetails = [...new Set(sorted.flatMap(s => (s.judges || []).map(x => x.univ)))];
    datasets = allDetails.map((univ, i) => ({
      label: univ,
      data: sorted.map(s => {
        const f = (s.judges || []).find(x => x.univ === univ);
        return f ? rankMap[f.rank] || null : null;
      }),
      borderColor: colors[i % colors.length],
      backgroundColor: colors[i % colors.length] + '33',
      tension: 0.3,
      pointRadius: 5,
      pointHoverRadius: 7,
      spanGaps: true
    }));
  }
  
  if (scoreLineChart) scoreLineChart.destroy();
  scoreLineChart = new Chart(cv, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          title: { display: true, text: scoreChartMode === 'dev' ? 'Deviation' : 'Judgment' },
          suggestedMin: scoreChartMode === 'dev' ? 30 : 1,
          suggestedMax: scoreChartMode === 'dev' ? 70 : 5,
          ticks: scoreChartMode === 'judge' ? { callback: function(value) { return ['E','D','C','B','A'][value-1] || ''; }, stepSize: 1 } : {}
        }
      }
    }
  });
  
  const leg = $('score-chart-legend');
  if (leg) {
    leg.innerHTML = allDetails.map((d, i) => `
      <span class="flex align-center gap-1">
        <span style="width:12px;height:12px;border-radius:50%;background:${colors[i % colors.length]};display:inline-block;"></span>
        ${esc(d)}
      </span>
    `).join('');
  }
};

function buildScoreContext() {
  if (!examScores.length) return '';
  return '\n【模試】\n' + examScores.slice(0, 5).map(s => {
    let p = [`${s.name}`];
    if (s.subjects) p.push(...s.subjects.map(x => `${x.detail}:${x.score}/${x.dev}`));
    return p.join(' ');
  }).join('\n');
}

window.openLogListModal = () => {
  openModal('log-list-modal');
  renderLogListModal();
};

const renderLogListModal = () => {
  const c = $('log-list-container');
  if (!c) return;
  if (!studyLogs.length) {
    c.innerHTML = `<div class="vocab-empty">${getUiLang() === 'ja' ? '学習記録がありません' : 'No study logs'}</div>`;
    return;
  }
  
  const sortedLogs = [...studyLogs].sort((a, b) => b.ts - a.ts);
  
  c.innerHTML = sortedLogs.map(l => `
    <div class="card flex-between align-center p-16 mb-0">
      <div>
        <div class="text-xs text-muted mb-2">${l.date}</div>
        <div class="text-sm font-bold"><span class="sli-subj mr-2">${esc(SCORE_SUBJECTS[l.subj]?.label || l.subj)}</span> ${Math.floor(l.seconds / 60)} min</div>
      </div>
      <div class="flex-gap-8">
        <button onclick="openLogEditModal(${l.ts})" class="btn-clear text-accent">Edit</button>
        <button onclick="deleteStudyLogFromList(${l.ts})" class="btn-clear text-danger">Delete</button>
      </div>
    </div>
  `).join('');
};

window.deleteStudyLogFromList = ts => {
  const l = studyLogs.find(x => x.ts === ts);
  if (!l) return;
  studyLogs = studyLogs.filter(x => x.ts !== ts);
  save.logs();
  renderLogListModal();
  if ($('Dashboard').classList.contains('active')) renderDashboard();
  
  showUndoSnackbar('Log deleted', () => {
    studyLogs.push(l);
    save.logs();
    renderLogListModal();
    if ($('Dashboard').classList.contains('active')) renderDashboard();
  }, () => {});
};

window.openLogEditModal = (ts) => {
  const log = studyLogs.find(l => l.ts === ts);
  if (!log) return;
  $('edit-log-ts').value = log.ts;
  $('edit-log-date').value = log.date;
  $('edit-log-subj').value = log.subj;
  $('edit-log-min').value = Math.floor(log.seconds / 60);
  openModal('log-edit-modal');
};

window.saveEditedLog = () => {
  const ts = parseInt($('edit-log-ts').value);
  const date = $('edit-log-date').value;
  const subj = $('edit-log-subj').value;
  
  const st = $('edit-log-start-time')?.value;
  const et = $('edit-log-end-time')?.value;
  let min = parseInt($('edit-log-min').value) || 0;
  
  if (st && et) {
    const [sh, sm] = st.split(':').map(Number);
    const [eh, em] = et.split(':').map(Number);
    let diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff < 0) diff += 24 * 60;
    min = diff;
  }
  
  if (!date || min <= 0) return showToast('Please enter correctly');
  const log = studyLogs.find(l => l.ts === ts);
  if (log) {
    log.date = date;
    log.subj = subj;
    log.seconds = min * 60;
    save.logs();
    renderLogListModal();
    if ($('Dashboard').classList.contains('active')) renderDashboard();
    closeModal('log-edit-modal');
    showToast('Saved');
  }
};

// ============================================================
// [19] ROUTER & INIT
// ============================================================
window.setTabByIndex = (idx) => {
  if (idx < 0 || idx >= TABS.length) return;
  currentTabIndex = idx;
  const targetId = TABS[idx];
  
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  
  const tEl = $(targetId);
  if (tEl) tEl.classList.add('active');
  
  const navItem = document.querySelector(`.nav-item[data-tab="${targetId}"]`);
  if (navItem) navItem.classList.add('active');
  
  closeModal('detail-modal');
  window.scrollTo(0, 0);
  triggerTabEffects(targetId);
};

const triggerTabEffects = (id) => {
  if (id === 'Dashboard') renderDashboard();
  if (id === 'Timer') {
    updateTimerDisplay();
    renderTimerPresets();
  }
  if (id === 'Vocab') {
    renderVocab(true);
    renderVocabStats();
    updateTagFilters();
  }
  if (id === 'Plan') {
    window.setPlanMode(planMode);
    renderTextbooks();
    loadProfileFields();
    renderYearlyPlan();
  }
  if (id === 'CustomCards') ccInitDecks();
  if (id === 'Manage') {
    updateFooter();
    updateAutoSyncBtn();
    initModelSelect();
    window.renderBackupList();
    
    const apiKeyInput = $('gemini-api-key-input');
    if (apiKeyInput) apiKeyInput.value = localStorage.getItem('study_gemini_api_key') || '';
    
    if (userProfile.reminderTime) $('reminder-time').value = userProfile.reminderTime;
    if (fsrsRetention) {
      $('fsrs-retention-slider').value = fsrsRetention;
      $('fsrs-retention-label').textContent = fsrsRetention + '%';
    }
    if ($('fsrs-auto-optimize')) {
      $('fsrs-auto-optimize').checked = userProfile.fsrsAutoOptimize !== false;
    }
    
    const uiFontSize = localStorage.getItem('study_ui_font_size') || 'medium';
    const uiFontSelect = $('ui-font-size-select');
    if (uiFontSelect) uiFontSelect.value = uiFontSize;
    
    const scheduleEnabled = safeGet('study_dark_schedule_enabled', false);
    const toggle = $('dark-mode-schedule-toggle');
    if (toggle) toggle.checked = scheduleEnabled;
    if (scheduleEnabled) $('dark-mode-schedule-times').classList.remove('hidden');
    
    $('dark-mode-start').value = safeGet('study_dark_schedule_start', '20:00');
    $('dark-mode-end').value = safeGet('study_dark_schedule_end', '06:00');
    
    if (userProfile.customThemeColor) $('custom-theme-bg').value = userProfile.customThemeColor;
    
    ['english', 'math', 'japanese', 'science', 'social', 'other'].forEach(k => {
      const el = $(`goal-time-${k}`);
      if (el) el.value = goalTimes[k] || '';
    });
    
    const langSelect = $('language-select');
    if (langSelect) langSelect.value = currentLang;
  }
  if (id === 'SkillUp') window.switchWritingTab('input');
  if (id === 'Subject') {
    renderSubjectChat();
    renderSubjectSaved();
    renderSubjectQuiz();
  }
  if (id === 'Plan' && planMode === 'score') {
    renderScoreList();
    renderScoreChart();
  }
  if (id === 'Mistakes') {
    window.switchMistakeTab(mistakeTab);
  }
};

document.querySelectorAll('.nav-item').forEach((item, idx) => {
  item.addEventListener('click', () => { window.setTabByIndex(idx); });
  item.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') window.setTabByIndex(idx);
  });
});

document.addEventListener('touchstart', e => {
  swipeStartX = e.touches[0].clientX;
  swipeStartY = e.touches[0].clientY;
}, { passive: true });

document.addEventListener('touchend', e => {
  if (!e.changedTouches.length) return;
  const dx = e.changedTouches[0].clientX - swipeStartX;
  const dy = e.changedTouches[0].clientY - swipeStartY;
  
  if (Math.abs(dx) > 80 && Math.abs(dx) > Math.abs(dy) * 2 && !window.getSelection().toString()) {
    if (e.target.closest('.flip-inner, .nav-bar, .heatmap-grid, [style*="overflow-x"], textarea, .cal-wrap, .chat-container, .quiz-sortable, .writing-tabs, .chat-subject-tabs, .import-tab-bar, .month-tabs, .week-day-tabs')) return;
    
    if (dx < 0 && currentTabIndex < TABS.length - 1) {
      window.setTabByIndex(currentTabIndex + 1);
    } else if (dx > 0 && currentTabIndex > 0) {
      window.setTabByIndex(currentTabIndex - 1);
    }
  }
}, { passive: true });

async function initAppData() {
  localforage.config({ name: 'StudyApp' });
  
  const [
    words, saved, p, ev, writing, subSaved, subQuiz, exams, books, srs, prof, decks, prog, meta, daily, syntax, listen, logs, yearly, freeze, examMistakesData, calcMistakesData, otherMistakesData, subjectFoldersData
  ] = await Promise.all([
    localforage.getItem('study_words'),
    localforage.getItem('study_saved'),
    localforage.getItem('study_plans'),
    localforage.getItem('study_events'),
    localforage.getItem('study_writing'),
    localforage.getItem('study_subject_saved'),
    localforage.getItem('study_subject_quizzes'),
    localforage.getItem('study_exam_scores'),
    localforage.getItem('study_textbooks'),
    localforage.getItem('study_srs'),
    localforage.getItem('study_profile'),
    localforage.getItem('study_custom_decks'),
    localforage.getItem('study_word_progress'),
    localforage.getItem('study_vocab_meta'),
    localforage.getItem('study_daily'),
    localforage.getItem('study_syntax'),
    localforage.getItem('study_listen'),
    localforage.getItem('study_logs'),
    localforage.getItem('study_yearly_plan'),
    localforage.getItem('study_freeze_logs'),
    localforage.getItem('study_exam_mistakes'),
    localforage.getItem('study_calc_mistakes'),
    localforage.getItem('study_other_mistakes'),
    localforage.getItem('study_subject_folders')
  ]);

  ALL_WORDS = words || [];
  savedWords = saved || [];
  plans = p || {};
  events = ev || {};
  writingHistory = writing || [];
  subjectSaved = subSaved || [];
  subjectQuizzes = subQuiz || [];
  examScores = exams || [];
  textbooks = books || [];
  srsData = srs || {};
  userProfile = prof || { targetUniv: '', grade: '', courses: '', autoSync: false, reminderTime: '', fsrsAutoOptimize: true, freezeItems: 0, themeColor: 'default', customThemeColor: '' };
  customDecks = decks || [];
  wordProgress = prog || {};
  vocabMeta = meta || {};
  dailyChallenges = daily || [];
  syntaxList = syntax || [];
  listenHistory = listen || [];
  studyLogs = logs || [];
  yearlyPlan = yearly || { year: new Date().getFullYear(), goal: '', months: {} };
  freezeLogs = freeze || [];
  examMistakes = examMistakesData || [];
  calcMistakes = calcMistakesData || [];
  otherMistakes = otherMistakesData || [];
  subjectFolders = subjectFoldersData || [];
  
  ALL_WORDS = ALL_WORDS.map(w => {
    if (typeof w === 'string') return { id: generateId(), word: w, meaning: '', example: '', tags: [] };
    if (!w.id) w.id = generateId();
    if (!w.tags) w.tags = [];
    if (!w.example) w.example = '';
    return w;
  });
  
  const cur = getISOWeek(new Date());
  const last = parseInt(localStorage.getItem('study_last_week') || '-1');
  
  if (last !== -1 && cur !== last) {
    const today = todayDateStr();
    let carriedOver = 0;
    Object.keys(plans).forEach(date => {
      if (date < today) {
        const incomplete = plans[date].filter(p => !p.done);
        if (incomplete.length > 0) {
          if (!plans[today]) plans[today] = [];
          incomplete.forEach(p => {
            plans[today].push({ text: p.text + ' (Carried over)', done: false, time: p.time || '' });
            carriedOver++;
          });
          plans[date] = plans[date].filter(p => p.done);
        }
      }
    });
    if (carriedOver > 0) {
      save.plans();
      showToast(`Carried over ${carriedOver} incomplete tasks to this week`);
    }
  }
  
  localStorage.setItem('study_last_week', cur);
  currentWeekDay = getTodayWeekIdx();
  
  if (userProfile.reminderTime) {
    $('reminder-time').value = userProfile.reminderTime;
    startReminderCheck();
  }
  
  const uiFontSize = localStorage.getItem('study_ui_font_size') || 'medium';
  document.documentElement.setAttribute('data-font-size', uiFontSize);
  
  applyThemeColor();
  loadWidgetOrder();
  applyLanguage();
  
  const wi = $('word-input');
  if (wi) wi.addEventListener('input', debounce(() => searchWord(true), 200));
  
  const vs = $('vocab-search');
  if (vs) vs.addEventListener('input', debounce(() => renderVocab(true), 200));
  
  const pm = $('timer-pomodoro-mode');
  if (pm) {
    pm.addEventListener('change', (e) => {
      isPomodoroMode = e.target.checked;
      if (isPomodoroMode && !timerRunning) {
        timerInitial = 25 * 60;
        timerTime = timerInitial;
        updateTimerDisplay();
      }
    });
  }
  
  $('fsrs-auto-optimize')?.addEventListener('change', (e) => {
    userProfile.fsrsAutoOptimize = e.target.checked;
    save.profile();
  });
  
  updateTagFilters();
  window.setPlanMode('calendar');
  updateFooter();
  renderVocabStats();
  renderTextbooks();
  loadProfileFields();
  updateTimerDisplay();
  renderTimerPresets();
  window.addExamSubjectRow();
  window.addExamJudgeRow();
  updateAutoSyncBtn();
  initModelSelect();
  
  renderCountdown();
  renderDashboard();
  
  createAutoBackup();
}

const getISOWeek = date => {
  const d = new Date(date.getTime());
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const w1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d.getTime() - w1.getTime()) / 86400000 - 3 + (w1.getDay() + 6) % 7) / 7);
};

window.addEventListener('DOMContentLoaded', initAppData);
