const tabs = {
  flashcards: document.getElementById("tab-flashcards"),
  manage: document.getElementById("tab-manage"),
};
const pages = {
  flashcards: document.getElementById("flashcard-page"),
  manage: document.getElementById("manage-page"),
};
const flashcard = document.getElementById("flashcard");
const cardFront = document.getElementById("card-front");
const cardBack = document.getElementById("card-back");
const currentIndex = document.getElementById("current-index");
const cardDetails = document.getElementById("card-details");
const prevWord = document.getElementById("prev-word");
const nextWord = document.getElementById("next-word");
const wordForm = document.getElementById("word-form");
const autoFillButton = document.getElementById("auto-fill");
const englishWordInput = document.getElementById("english-word");
const translationInput = document.getElementById("translation");
const posInput = document.getElementById("part-of-speech");
const exampleInput = document.getElementById("example-sentence");
const rootInput = document.getElementById("root-analysis");
const wordListContainer = document.getElementById("word-list");

let wordEntries = [];
let currentWordIndex = 0;
let cardFlipped = false;

const STORAGE_KEY = "vocabFlashcards";
const defaultWords = [
  {
    english: "example",
    translation: "例子；範例",
    partOfSpeech: "名詞",
    example: "This is an example sentence.",
    root: "exam- 檢查, ple 表示動作，原意為“檢查”延伸為‘範例’。",
  },
  {
    english: "culture",
    translation: "文化",
    partOfSpeech: "名詞",
    example: "Art and music are part of culture.",
    root: "cult- 培養、崇拜，-ure 表示狀態或結果。",
  },
];

function loadWords() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      wordEntries = JSON.parse(saved);
    } catch (error) {
      wordEntries = [...defaultWords];
    }
  } else {
    wordEntries = [...defaultWords];
  }
  if (!wordEntries.length) {
    wordEntries = [...defaultWords];
  }
}

function saveWords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(wordEntries));
}

function updateTab(target) {
  Object.entries(tabs).forEach(([key, button]) => {
    const active = key === target;
    button.classList.toggle("active", active);
    pages[key].classList.toggle("active-page", active);
  });
  if (target === "flashcards") {
    renderFlashcard();
  }
}

function renderFlashcard() {
  if (!wordEntries.length) {
    cardFront.textContent = "請新增單字";
    cardBack.innerHTML = "<p>目前沒有單字，請到管理頁面新增。</p>";
    currentIndex.textContent = "0 / 0";
    cardDetails.innerHTML = "";
    return;
  }

  const current = wordEntries[currentWordIndex];
  cardFront.textContent = current.english;
  cardBack.innerHTML = `
    <div class="back-item">
      <p class="back-title">翻譯</p>
      <p class="back-text">${current.translation || "無"}</p>
    </div>
    <div class="back-item">
      <p class="back-title">詞性</p>
      <p class="back-text">${current.partOfSpeech || "無"}</p>
    </div>
    <div class="back-item">
      <p class="back-title">例句</p>
      <p class="back-text">${current.example || "無"}</p>
    </div>
    <div class="back-item">
      <p class="back-title">字根分析</p>
      <p class="back-text">${current.root || "無"}</p>
    </div>
  `;
  currentIndex.textContent = `${currentWordIndex + 1} / ${wordEntries.length}`;
  cardDetails.innerHTML = `
    <h3>${current.english}</h3>
    <p><strong>翻譯：</strong>${current.translation || "無"}</p>
    <p><strong>詞性：</strong>${current.partOfSpeech || "無"}</p>
    <p><strong>例句：</strong>${current.example || "無"}</p>
    <p><strong>字根分析：</strong>${current.root || "無"}</p>
  `;
  if (cardFlipped) {
    flashcard.classList.remove("flipped");
    cardFlipped = false;
  }
}

function renderManageList() {
  wordListContainer.innerHTML = wordEntries
    .map(
      (entry, index) => `
      <article class="word-card">
        <header>
          <strong>${entry.english}</strong>
          <button data-index="${index}" class="delete-word">刪除</button>
        </header>
        <p><strong>翻譯：</strong>${entry.translation || "無"}</p>
        <p><strong>詞性：</strong>${entry.partOfSpeech || "無"}</p>
        <p><strong>例句：</strong>${entry.example || "無"}</p>
        <p><strong>字根分析：</strong>${entry.root || "無"}</p>
      </article>
    `
    )
    .join("");
}

function addWord(entry) {
  wordEntries.push(entry);
  saveWords();
  renderManageList();
  renderFlashcard();
}

function buildRootAnalysis(word, dictionaryData) {
  const lower = word.toLowerCase();
  const knownRoots = [
    { root: "re", meaning: "再次、回" },
    { root: "un", meaning: "不、相反" },
    { root: "in", meaning: "不、進入" },
    { root: "dis", meaning: "否定、分離" },
    { root: "pre", meaning: "前" },
    { root: "sub", meaning: "在下、次要" },
    { root: "port", meaning: "攜帶" },
    { root: "spect", meaning: "看" },
    { root: "scrib", meaning: "寫" },
    { root: "ject", meaning: "投、擲" },
  ];

  const found = knownRoots.find(item => lower.startsWith(item.root));
  if (found) {
    return `${found.root} - ${found.meaning}，整體單字可能與此字根含義相關。`;
  }

  const endings = [
    { suffix: "tion", meaning: "行為、狀態、結果" },
    { suffix: "ing", meaning: "進行式" },
    { suffix: "ed", meaning: "過去式/過去分詞" },
    { suffix: "ly", meaning: "...地（副詞）" },
    { suffix: "ment", meaning: "行為、結果" },
  ];

  const foundSuffix = endings.find(item => lower.endsWith(item.suffix));
  if (foundSuffix) {
    return `${foundSuffix.suffix} - ${foundSuffix.meaning}，整體單字可能含有此字尾變化。`;
  }

  if (dictionaryData && dictionaryData.length) {
    const rootHints = dictionaryData
      .map(item => item.word)
      .filter(Boolean)
      .join(" / ");
    return `詞源提示：${rootHints}`;
  }

  return "無明確字根分析，建議以字首/字尾規則補充學習。";
}

async function fetchDictionaryData(word) {
  const dictionaryUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;
  try {
    const response = await fetch(dictionaryUrl);
    if (!response.ok) {
      throw new Error("無法取得字典資料");
    }
    return await response.json();
  } catch (error) {
    return null;
  }
}

async function fetchTranslation(word) {
  const translationUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|zh-TW`;
  try {
    const response = await fetch(translationUrl);
    if (!response.ok) {
      throw new Error("無法取得翻譯");
    }
    const result = await response.json();
    const translatedText = result.responseData?.translatedText;
    return translatedText || "";
  } catch (error) {
    return "";
  }
}

async function autoFillData() {
  const word = englishWordInput.value.trim();
  if (!word) {
    alert("請先輸入英文單字再按自動填入。");
    return;
  }

  autoFillButton.textContent = "載入中...";
  autoFillButton.disabled = true;

  const [dictionaryData, translation] = await Promise.all([
    fetchDictionaryData(word),
    fetchTranslation(word),
  ]);

  const pos = dictionaryData?.[0]?.meanings?.[0]?.partOfSpeech || "";
  const example = dictionaryData?.[0]?.meanings?.[0]?.definitions?.find(def => def.example)?.example || "";
  const root = buildRootAnalysis(word, dictionaryData);

  translationInput.value = translation || translationInput.value;
  posInput.value = pos || posInput.value;
  exampleInput.value = example || exampleInput.value;
  rootInput.value = root || rootInput.value;

  autoFillButton.textContent = "自動填入";
  autoFillButton.disabled = false;
}

function bindEvents() {
  tabs.flashcards.addEventListener("click", () => updateTab("flashcards"));
  tabs.manage.addEventListener("click", () => updateTab("manage"));

  flashcard.addEventListener("click", () => {
    cardFlipped = !cardFlipped;
    flashcard.classList.toggle("flipped", cardFlipped);
  });

  prevWord.addEventListener("click", () => {
    if (!wordEntries.length) return;
    currentWordIndex = (currentWordIndex - 1 + wordEntries.length) % wordEntries.length;
    renderFlashcard();
  });

  nextWord.addEventListener("click", () => {
    if (!wordEntries.length) return;
    currentWordIndex = (currentWordIndex + 1) % wordEntries.length;
    renderFlashcard();
  });

  wordForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const newEntry = {
      english: englishWordInput.value.trim(),
      translation: translationInput.value.trim(),
      partOfSpeech: posInput.value.trim(),
      example: exampleInput.value.trim(),
      root: rootInput.value.trim(),
    };
    if (!newEntry.english) {
      alert("請輸入英文單字。");
      return;
    }
    addWord(newEntry);
    wordForm.reset();
    alert("已新增單字！");
  });

  autoFillButton.addEventListener("click", autoFillData);

  wordListContainer.addEventListener("click", (event) => {
    const target = event.target;
    if (target.matches(".delete-word")) {
      const index = Number(target.dataset.index);
      if (Number.isInteger(index)) {
        wordEntries.splice(index, 1);
        if (currentWordIndex >= wordEntries.length) {
          currentWordIndex = Math.max(0, wordEntries.length - 1);
        }
        saveWords();
        renderManageList();
        renderFlashcard();
      }
    }
  });
}

function init() {
  loadWords();
  renderFlashcard();
  renderManageList();
  bindEvents();
}

init();
