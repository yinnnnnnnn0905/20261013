// ==============================
// 台北捷運選擇題測驗系統
// 題庫來源：Google 試算表 CSV
// ==============================

// 設定 Google 試算表 CSV 網址
const GOOGLE_SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRt_Q6cAbosIJbBkIs9i6c-Fg9ye_4Knh0FVE4wBucZcC3m50L_dZFc0AOC0bHpBTgqOlgFY0pTPrfg/pub?gid=1467950475&single=true&output=csv";

// 設定每次測驗抽出的題目數量
const QUIZ_LENGTH = 5;

// 設定 Google Fonts 字型名稱
const FONT_NAME = "Noto Sans HK";

// 設定背景顏色
const BACKGROUND_COLOR = "#f4e285";

// 設定內容面板顏色
const PANEL_COLOR = "#f0f0c9";

// 設定一般選項顏色
const OPTION_COLOR = "#f4a259";

// 設定正確答案顏色
const CORRECT_COLOR = "#8cb369";

// 設定錯誤答案顏色
const WRONG_COLOR = "#bc4b51";

// 設定捷運路線選項
const ALL_LINES = [
  "板南線",
  "淡水信義線",
  "文湖線",
  "松山新店線",
  "中和新蘆線"
];

// 儲存完整題庫
let questionBank = [];

// 儲存本次測驗抽出的五題
let quizQuestions = [];

// 儲存目前題目編號
let currentQuestion = 0;

// 儲存答對題數
let score = 0;

// 儲存是否已經作答
let answered = false;

// 儲存是否顯示結果畫面
let showResult = false;

// 儲存使用者選擇的選項編號
let selectedOption = -1;

// 儲存答案是否正確
let answerIsCorrect = false;

// 儲存四個選項
let options = [];

// 儲存選項位置
let optionBoxes = [];

// 儲存 CSV 是否正在載入
let isLoading = true;

// 儲存 CSV 是否載入成功
let csvLoaded = false;

// 儲存錯誤訊息
let errorMessage = "";

// 儲存面板位置與大小
let panelX = 0;
let panelY = 0;
let panelWidth = 0;
let panelHeight = 0;

// 儲存選項位置與大小
let optionX = 0;
let optionStartY = 0;
let optionWidth = 0;
let optionHeight = 0;
let optionGap = 0;

// 儲存文字大小
let questionFontSize = 0;
let optionFontSize = 0;
let smallFontSize = 0;

// 儲存下一題按鈕位置與大小
let nextButtonX = 0;
let nextButtonY = 0;
let nextButtonWidth = 0;
let nextButtonHeight = 0;

// 儲存重新開始按鈕位置與大小
let restartButtonX = 0;
let restartButtonY = 0;
let restartButtonWidth = 0;
let restartButtonHeight = 0;

// 儲存彩帶粒子
let confettiParticles = [];

// 儲存錯誤叉叉動畫
let wrongCrossEffects = [];

// 儲存最後一次觸控時間
let lastTouchTime = 0;

// 儲存全螢幕按鈕
let fullscreenButton;

// 儲存重新載入題庫按鈕
let reloadButton;

// 在 setup() 之前載入 Google 試算表
function preload() {
  // 建立防止快取的 CSV 網址
  const csvURL =
    GOOGLE_SHEET_CSV_URL +
    "&time=" +
    Date.now();

  // 載入 Google 試算表 CSV
  loadTable(
    csvURL,
    "csv",
    "header",

    // CSV 成功載入時執行
    function (table) {
      // 清空原有題庫
      questionBank = [];

      // 逐列讀取 CSV
      for (
        let i = 0;
        i < table.getRowCount();
        i++
      ) {
        // 取得目前資料列
        const row = table.getRow(i);

        // 讀取站名
        const station = String(
          row.get("station") || ""
        ).trim();

        // 讀取正確路線
        const correctLine = String(
          row.get("correctLine") || ""
        ).trim();

        // 略過空白資料
        if (
          station === "" ||
          correctLine === ""
        ) {
          continue;
        }

        // 將題目加入題庫
        questionBank.push({
          station: station,
          correctLine: correctLine
        });
      }

      // 移除重複題目
      questionBank =
        removeDuplicateQuestions(questionBank);

      // 判斷題目數量是否足夠
      if (questionBank.length < QUIZ_LENGTH) {
        // 設定錯誤訊息
        errorMessage =
          "Google 試算表至少需要 " +
          QUIZ_LENGTH +
          " 題，目前只有 " +
          questionBank.length +
          " 題。";

        // 設定載入失敗
        csvLoaded = false;
      } else {
        // 設定載入成功
        csvLoaded = true;

        // 清除錯誤訊息
        errorMessage = "";

        // 隨機抽出五題
        startNewQuiz();
      }

      // 設定載入完成
      isLoading = false;
    },

    // CSV 載入失敗時執行
    function () {
      // 設定錯誤訊息
      errorMessage =
        "無法讀取 Google 試算表，請確認試算表已發佈為 CSV。";

      // 設定載入失敗
      csvLoaded = false;

      // 設定載入完成
      isLoading = false;
    }
  );
}

// 移除重複題目
function removeDuplicateQuestions(questions) {
  // 建立不重複題目陣列
  const uniqueQuestions = [];

  // 建立題目識別集合
  const questionKeys = new Set();

  // 逐一檢查題目
  for (const question of questions) {
    // 建立題目識別文字
    const key =
      question.station +
      "|" +
      question.correctLine;

    // 如果題目尚未出現
    if (!questionKeys.has(key)) {
      // 記錄題目識別
      questionKeys.add(key);

      // 加入不重複題目
      uniqueQuestions.push(question);
    }
  }

  // 回傳不重複題目
  return uniqueQuestions;
}

// p5.js 初始化函式
function setup() {
  // 建立符合瀏覽器大小的畫布
  createCanvas(windowWidth, windowHeight);

  // 設定 Noto Sans Hong Kong 字型
  textFont(FONT_NAME);

  // 設定文字水平與垂直置中
  textAlign(CENTER, CENTER);

  // 設定矩形繪製方式
  rectMode(CORNER);

  // 預設不繪製外框
  noStroke();

  // 建立全螢幕按鈕
  fullscreenButton = createButton("進入全螢幕");

  // 設定全螢幕按鈕文字大小
  fullscreenButton.style(
    "font-size",
    "16px"
  );

  // 設定全螢幕按鈕內距
  fullscreenButton.style(
    "padding",
    "8px 14px"
  );

  // 設定全螢幕按鈕背景
  fullscreenButton.style(
    "background-color",
    OPTION_COLOR
  );

  // 設定全螢幕按鈕文字顏色
  fullscreenButton.style(
    "color",
    "#000000"
  );

  // 移除全螢幕按鈕外框
  fullscreenButton.style(
    "border",
    "none"
  );

  // 設定全螢幕按鈕圓角
  fullscreenButton.style(
    "border-radius",
    "8px"
  );

  // 設定全螢幕按鈕位置
  fullscreenButton.position(16, 16);

  // 綁定全螢幕按鈕事件
  fullscreenButton.mousePressed(
    toggleFullscreen
  );

  // 建立重新載入題庫按鈕
  reloadButton = createButton(
    "重新載入題庫"
  );

  // 設定重新載入按鈕文字大小
  reloadButton.style(
    "font-size",
    "16px"
  );

  // 設定重新載入按鈕內距
  reloadButton.style(
    "padding",
    "8px 14px"
  );

  // 設定重新載入按鈕背景
  reloadButton.style(
    "background-color",
    OPTION_COLOR
  );

  // 設定重新載入按鈕文字顏色
  reloadButton.style(
    "color",
    "#000000"
  );

  // 移除重新載入按鈕外框
  reloadButton.style(
    "border",
    "none"
  );

  // 設定重新載入按鈕圓角
  reloadButton.style(
    "border-radius",
    "8px"
  );

  // 設定重新載入按鈕位置
  reloadButton.position(16, 62);

  // 綁定重新載入事件
  reloadButton.mousePressed(
    reloadQuestionBank
  );

  // 計算響應式版面
  updateLayout();
}

// 切換全螢幕
function toggleFullscreen() {
  // 取得目前全螢幕狀態
  const currentState = fullscreen();

  // 切換全螢幕
  fullscreen(!currentState);

  // 根據狀態顯示或隱藏按鈕
  if (currentState) {
    fullscreenButton.show();
  } else {
    fullscreenButton.hide();
  }
}

// 重新載入 Google 試算表題庫
function reloadQuestionBank() {
  // 設定載入中
  isLoading = true;

  // 設定尚未載入成功
  csvLoaded = false;

  // 清除錯誤訊息
  errorMessage = "";

  // 建立防快取網址
  const csvURL =
    GOOGLE_SHEET_CSV_URL +
    "&time=" +
    Date.now();

  // 重新讀取 Google 試算表
  loadTable(
    csvURL,
    "csv",
    "header",

    // 重新載入成功
    function (table) {
      // 清空舊題庫
      questionBank = [];

      // 逐列讀取資料
      for (
        let i = 0;
        i < table.getRowCount();
        i++
      ) {
        // 取得目前資料列
        const row = table.getRow(i);

        // 讀取站名
        const station = String(
          row.get("station") || ""
        ).trim();

        // 讀取正確路線
        const correctLine = String(
          row.get("correctLine") || ""
        ).trim();

        // 略過空白列
        if (
          station === "" ||
          correctLine === ""
        ) {
          continue;
        }

        // 將資料加入題庫
        questionBank.push({
          station: station,
          correctLine: correctLine
        });
      }

      // 移除重複題目
      questionBank =
        removeDuplicateQuestions(questionBank);

      // 檢查題目數量
      if (questionBank.length < QUIZ_LENGTH) {
        // 設定錯誤訊息
        errorMessage =
          "有效題目不足五題。";

        // 設定載入失敗
        csvLoaded = false;
      } else {
        // 設定載入成功
        csvLoaded = true;

        // 開始新的測驗
        startNewQuiz();
      }

      // 設定載入完成
      isLoading = false;
    },

    // 重新載入失敗
    function () {
      // 設定錯誤訊息
      errorMessage =
        "重新載入題庫失敗，請確認 Google 試算表網址。";

      // 設定載入失敗
      csvLoaded = false;

      // 設定載入完成
      isLoading = false;
    }
  );
}

// 開始新的測驗
function startNewQuiz() {
  // 如果題庫少於五題
  if (questionBank.length < QUIZ_LENGTH) {
    // 設定錯誤訊息
    errorMessage =
      "題庫不足五題，無法開始測驗。";

    // 設定載入失敗
    csvLoaded = false;

    // 結束函式
    return;
  }

  // 複製題庫
  const copiedQuestions =
    questionBank.slice();

  // 將題庫隨機排序
  shuffle(copiedQuestions, true);

  // 抽出五題
  quizQuestions =
    copiedQuestions.slice(
      0,
      QUIZ_LENGTH
    );

  // 回到第一題
  currentQuestion = 0;

  // 分數歸零
  score = 0;

  // 關閉結果畫面
  showResult = false;

  // 準備目前題目
  prepareQuestion();
}

// 準備目前題目
function prepareQuestion() {
  // 設定尚未作答
  answered = false;

  // 清除選項選擇
  selectedOption = -1;

  // 清除答案狀態
  answerIsCorrect = false;

  // 清除彩帶
  confettiParticles = [];

  // 清除叉叉
  wrongCrossEffects = [];

  // 取得正確路線
  const correctLine =
    quizQuestions[
      currentQuestion
    ].correctLine;

  // 取得三個錯誤路線
  const wrongLines =
    ALL_LINES.filter(
      line => line !== correctLine
    );

  // 將錯誤路線隨機排序
  shuffle(wrongLines, true);

  // 建立四個選項
  options = [
    correctLine,
    wrongLines[0],
    wrongLines[1],
    wrongLines[2]
  ];

  // 將選項隨機排列
  shuffle(options, true);

  // 更新版面
  updateLayout();
}

// 當瀏覽器視窗大小改變
function windowResized() {
  // 調整畫布大小
  resizeCanvas(
    windowWidth,
    windowHeight
  );

  // 重新計算版面
  updateLayout();
}

// 計算響應式版面
function updateLayout() {
  // 判斷是否為直向畫面
  const isPortrait =
    height > width;

  // 設定面板寬度
  panelWidth =
    min(width * 0.92, 920);

  // 設定面板高度
  panelHeight =
    min(height * 0.88, 760);

  // 手機小畫面使用較大面板
  if (isPortrait && height < 720) {
    panelHeight = height * 0.94;
  }

  // 防止面板超出畫布
  panelHeight =
    min(panelHeight, height - 20);

  // 計算面板位置
  panelX =
    (width - panelWidth) / 2;

  panelY =
    (height - panelHeight) / 2;

  // 設定題目文字大小
  questionFontSize = constrain(
    min(width * 0.045, height * 0.055),
    20,
    42
  );

  // 小螢幕調整題目文字大小
  if (isPortrait && height < 700) {
    questionFontSize = constrain(
      height * 0.038,
      17,
      28
    );
  }

  // 設定選項文字大小
  optionFontSize = constrain(
    min(width * 0.032, height * 0.042),
    16,
    30
  );

  // 小螢幕調整選項文字大小
  if (isPortrait && height < 700) {
    optionFontSize = constrain(
      height * 0.027,
      15,
      22
    );
  }

  // 設定題號文字大小
  smallFontSize = constrain(
    min(width * 0.022, height * 0.03),
    14,
    24
  );

  // 設定選項寬度
  optionWidth =
    min(panelWidth * 0.82, 720);

  // 計算選項水平位置
  optionX =
    width / 2 - optionWidth / 2;

  // 設定選項高度
  optionHeight =
    max(optionFontSize * 1.8, 46);

  // 小螢幕調整選項高度
  if (isPortrait && height < 700) {
    optionHeight =
      max(optionFontSize * 1.6, 42);
  }

  // 設定第一個選項位置
  optionStartY =
    panelY + panelHeight * 0.29;

  // 計算選項可用高度
  const availableHeight =
    panelHeight * 0.48;

  // 計算選項間距
  optionGap =
    (availableHeight - optionHeight * 4) / 3;

  // 設定選項間距下限
  optionGap =
    max(optionGap, 8);

  // 設定下一題按鈕寬度
  nextButtonWidth =
    min(panelWidth * 0.38, 260);

  // 設定下一題按鈕高度
  nextButtonHeight =
    max(optionHeight, 44);

  // 設定下一題按鈕位置
  nextButtonX =
    width / 2 - nextButtonWidth / 2;

  nextButtonY =
    panelY +
    panelHeight -
    nextButtonHeight -
    panelHeight * 0.07;

  // 設定重新開始按鈕尺寸
  restartButtonWidth =
    nextButtonWidth;

  restartButtonHeight =
    nextButtonHeight;

  // 設定重新開始按鈕位置
  restartButtonX =
    width / 2 -
    restartButtonWidth / 2;

  restartButtonY =
    panelY + panelHeight * 0.67;

  // 計算選項位置
  calculateOptionBoxes();
}

// 計算四個選項位置
function calculateOptionBoxes() {
  // 清空選項位置
  optionBoxes = [];

  // 建立四個選項位置
  for (let i = 0; i < 4; i++) {
    // 計算目前選項的 Y 座標
    const y =
      optionStartY +
      i * (optionHeight + optionGap);

    // 儲存選項位置
    optionBoxes.push({
      x: optionX,
      y: y,
      width: optionWidth,
      height: optionHeight,
      drawnY: y
    });
  }
}

// p5.js 每一幀執行
function draw() {
  // 繪製背景
  background(BACKGROUND_COLOR);

  // 如果正在載入
  if (isLoading) {
    // 顯示載入畫面
    drawLoadingScreen();

    // 結束本次繪圖
    return;
  }

  // 如果載入失敗
  if (!csvLoaded) {
    // 顯示錯誤畫面
    drawErrorScreen();

    // 結束本次繪圖
    return;
  }

  // 如果顯示結果
  if (showResult) {
    // 顯示結果畫面
    drawResultScreen();
  } else {
    // 顯示測驗畫面
    drawQuizScreen();
  }

  // 更新彩帶動畫
  updateConfetti();

  // 更新錯誤叉叉動畫
  updateWrongCrosses();
}

// 顯示載入畫面
function drawLoadingScreen() {
  // 設定面板顏色
  fill(PANEL_COLOR);

  // 移除外框
  noStroke();

  // 繪製載入面板
  rect(
    width * 0.1,
    height * 0.35,
    width * 0.8,
    height * 0.3,
    20
  );

  // 設定文字顏色
  fill("#000000");

  // 設定文字大小
  textSize(
    max(20, min(width * 0.06, 36))
  );

  // 顯示載入文字
  text(
    "正在載入題庫...",
    width / 2,
    height / 2
  );
}

// 顯示錯誤畫面
function drawErrorScreen() {
  // 設定錯誤面板寬度
  const errorWidth =
    min(width * 0.88, 760);

  // 設定錯誤面板高度
  const errorHeight =
    min(height * 0.5, 340);

  // 計算錯誤面板位置
  const errorX =
    width / 2 - errorWidth / 2;

  const errorY =
    height / 2 - errorHeight / 2;

  // 設定面板顏色
  fill(PANEL_COLOR);

  // 繪製錯誤面板
  rect(
    errorX,
    errorY,
    errorWidth,
    errorHeight,
    20
  );

  // 設定文字顏色
  fill("#000000");

  // 設定標題文字大小
  textSize(
    max(22, min(width * 0.05, 34))
  );

  // 顯示錯誤標題
  text(
    "題庫載入失敗",
    width / 2,
    errorY + errorHeight * 0.28
  );

  // 設定錯誤訊息文字大小
  textSize(
    max(14, min(width * 0.028, 20))
  );

  // 顯示錯誤訊息
  text(
    errorMessage,
    width / 2,
    errorY + errorHeight * 0.5
  );

  // 顯示處理建議
  text(
    "請確認 Google 試算表已發佈為 CSV。",
    width / 2,
    errorY + errorHeight * 0.67
  );

  // 顯示重新載入提示
  text(
    "請按左上角「重新載入題庫」。",
    width / 2,
    errorY + errorHeight * 0.78
  );
}

// 繪製測驗畫面
function drawQuizScreen() {
  // 設定面板顏色
  fill(PANEL_COLOR);

  // 移除外框
  noStroke();

  // 繪製面板
  rect(
    panelX,
    panelY,
    panelWidth,
    panelHeight,
    24
  );

  // 設定文字顏色
  fill("#000000");

  // 設定題號大小
  textSize(smallFontSize);

  // 顯示題號
  text(
    "第 " +
      (currentQuestion + 1) +
      " 題／共 " +
      quizQuestions.length +
      " 題",
    width / 2,
    panelY + panelHeight * 0.08
  );

  // 設定題目文字大小
  textSize(questionFontSize);

  // 顯示題目
  text(
    quizQuestions[currentQuestion].station +
      "站屬於哪一條捷運線？",
    width / 2,
    panelY + panelHeight * 0.17
  );

  // 重新計算選項位置
  calculateOptionBoxes();

  // 繪製四個選項
  for (let i = 0; i < 4; i++) {
    // 取得目前選項
    const box = optionBoxes[i];

    // 判斷目前是否為正確答案
    const isCorrect =
      options[i] ===
      quizQuestions[currentQuestion].correctLine;

    // 設定選項預設顏色
    let boxColor = OPTION_COLOR;

    // 設定跳動位移
    let jumpOffset = 0;

    // 如果已經作答
    if (answered) {
      // 正確答案變綠色
      if (isCorrect) {
        boxColor = CORRECT_COLOR;

        // 答錯時正確答案上下跳動
        if (!answerIsCorrect) {
          jumpOffset =
            sin(frameCount * 0.22) * 10;
        }
      }

      // 使用者選錯的答案變紅色
      if (
        !answerIsCorrect &&
        i === selectedOption
      ) {
        boxColor = WRONG_COLOR;
      }
    }

    // 記錄選項實際 Y 座標
    box.drawnY =
      box.y + jumpOffset;

    // 設定選項顏色
    fill(boxColor);

    // 繪製選項方塊
    rect(
      box.x,
      box.drawnY,
      box.width,
      box.height,
      12
    );

    // 設定文字顏色
    fill("#000000");

    // 設定文字大小
    textSize(optionFontSize);

    // 顯示選項文字
    text(
      options[i],
      width / 2,
      box.drawnY + box.height / 2
    );
  }

  // 如果已作答
  if (answered) {
    // 顯示下一題按鈕
    drawNextButton();
  }
}

// 繪製下一題按鈕
function drawNextButton() {
  // 設定按鈕顏色
  fill(OPTION_COLOR);

  // 繪製按鈕
  rect(
    nextButtonX,
    nextButtonY,
    nextButtonWidth,
    nextButtonHeight,
    12
  );

  // 設定文字顏色
  fill("#000000");

  // 設定文字大小
  textSize(optionFontSize);

  // 如果是最後一題
  if (
    currentQuestion ===
    quizQuestions.length - 1
  ) {
    // 顯示查看結果
    text(
      "查看結果",
      width / 2,
      nextButtonY + nextButtonHeight / 2
    );
  } else {
    // 顯示下一題
    text(
      "下一題",
      width / 2,
      nextButtonY + nextButtonHeight / 2
    );
  }
}

// 繪製結果畫面
function drawResultScreen() {
  // 設定面板顏色
  fill(PANEL_COLOR);

  // 繪製面板
  rect(
    panelX,
    panelY,
    panelWidth,
    panelHeight,
    24
  );

  // 設定文字顏色
  fill("#000000");

  // 設定標題文字大小
  textSize(questionFontSize * 1.2);

  // 顯示測驗結束
  text(
    "測驗結束！",
    width / 2,
    panelY + panelHeight * 0.28
  );

  // 設定分數文字大小
  textSize(questionFontSize);

  // 顯示分數
  text(
    "你答對了 " +
      score +
      "／" +
      quizQuestions.length +
      " 題",
    width / 2,
    panelY + panelHeight * 0.43
  );

  // 設定按鈕顏色
  fill(OPTION_COLOR);

  // 繪製重新開始按鈕
  rect(
    restartButtonX,
    restartButtonY,
    restartButtonWidth,
    restartButtonHeight,
    12
  );

  // 設定文字顏色
  fill("#000000");

  // 設定文字大小
  textSize(optionFontSize);

  // 顯示重新開始
  text(
    "重新開始",
    width / 2,
    restartButtonY + restartButtonHeight / 2
  );
}

// 處理滑鼠點擊
function mousePressed() {
  // 取得目前時間
  const currentTime = millis();

  // 防止觸控後重複觸發滑鼠
  if (
    currentTime - lastTouchTime < 400
  ) {
    return false;
  }

  // 處理點擊
  handleClick(
    mouseX,
    mouseY
  );

  // 阻止瀏覽器預設行為
  return false;
}

// 處理手機觸控
function touchStarted() {
  // 記錄觸控時間
  lastTouchTime = millis();

  // 如果有觸控點
  if (touches.length > 0) {
    // 取得第一個觸控點
    const touchPoint = touches[0];

    // 處理觸控
    handleClick(
      touchPoint.x,
      touchPoint.y
    );
  }

  // 阻止瀏覽器預設行為
  return false;
}

// 處理點擊與觸控
function handleClick(x, y) {
  // 如果正在載入
  if (isLoading) {
    return;
  }

  // 如果題庫載入失敗
  if (!csvLoaded) {
    return;
  }

  // 如果正在顯示結果
  if (showResult) {
    // 判斷是否點擊重新開始按鈕
    if (
      x >= restartButtonX &&
      x <= restartButtonX + restartButtonWidth &&
      y >= restartButtonY &&
      y <= restartButtonY + restartButtonHeight
    ) {
      // 重新讀取最新題庫
      reloadQuestionBank();
    }

    // 結束處理
    return;
  }

  // 如果尚未作答
  if (!answered) {
    // 逐一檢查四個選項
    for (
      let i = 0;
      i < optionBoxes.length;
      i++
    ) {
      // 取得目前選項區域
      const box = optionBoxes[i];

      // 判斷是否點擊選項
      if (
        x >= box.x &&
        x <= box.x + box.width &&
        y >= box.y &&
        y <= box.y + box.height
      ) {
        // 記錄使用者選項
        selectedOption = i;

        // 設定已經作答
        answered = true;

        // 判斷答案是否正確
        answerIsCorrect =
          options[i] ===
          quizQuestions[currentQuestion].correctLine;

        // 如果答對
        if (answerIsCorrect) {
          // 分數加一
          score++;

          // 產生彩帶
          spawnConfetti(box);
        } else {
          // 產生錯誤叉叉
          spawnWrongCrosses(box);
        }

        // 重新繪製畫面
        redraw();

        // 結束函式
        return;
      }
    }

    // 尚未作答時結束
    return;
  }

  // 判斷是否點擊下一題按鈕
  if (
    x >= nextButtonX &&
    x <= nextButtonX + nextButtonWidth &&
    y >= nextButtonY &&
    y <= nextButtonY + nextButtonHeight
  ) {
    // 如果還有下一題
    if (
      currentQuestion <
      quizQuestions.length - 1
    ) {
      // 題目編號加一
      currentQuestion++;

      // 準備下一題
      prepareQuestion();
    } else {
      // 顯示結果畫面
      showResult = true;

      // 清除動畫
      confettiParticles = [];
      wrongCrossEffects = [];
    }

    // 重新繪製畫面
    redraw();
  }
}

// 從正確選項左右兩側產生彩帶
function spawnConfetti(box) {
  // 清除舊彩帶
  confettiParticles = [];

  // 建立 100 個彩帶粒子
  for (let i = 0; i < 100; i++) {
    // 隨機決定左側或右側
    const side =
      random() < 0.5 ? -1 : 1;

    // 設定起始 X 座標
    const startX =
      side === -1
        ? box.x
        : box.x + box.width;

    // 設定起始 Y 座標
    const startY =
      box.drawnY + box.height / 2;

    // 建立彩帶
    confettiParticles.push({
      x: startX,
      y: startY,
      velocityX: side * random(2, 7),
      velocityY: random(-8, 1),
      size: random(5, 12),
      angle: random(TWO_PI),
      rotationSpeed: random(-0.2, 0.2),
      particleColor: random([
        "#e63946",
        "#457b9d",
        "#2a9d8f",
        "#f4a261",
        "#8338ec",
        "#ffbe0b"
      ]),
      alpha: 255
    });
  }
}

// 更新彩帶
function updateConfetti() {
  // 從後往前處理粒子
  for (
    let i = confettiParticles.length - 1;
    i >= 0;
    i--
  ) {
    // 取得目前粒子
    const particle =
      confettiParticles[i];

    // 加入重力
    particle.velocityY += 0.18;

    // 更新粒子位置
    particle.x += particle.velocityX;
    particle.y += particle.velocityY;

    // 更新旋轉
    particle.angle +=
      particle.rotationSpeed;

    // 降低透明度
    particle.alpha -= 3;

    // 儲存畫布狀態
    push();

    // 移動到粒子位置
    translate(
      particle.x,
      particle.y
    );

    // 旋轉粒子
    rotate(particle.angle);

    // 取得粒子顏色
    const particleColor =
      color(particle.particleColor);

    // 設定粒子顏色
    fill(
      red(particleColor),
      green(particleColor),
      blue(particleColor),
      particle.alpha
    );

    // 移除外框
    noStroke();

    // 繪製彩帶
    rect(
      0,
      0,
      particle.size,
      particle.size * 0.45
    );

    // 還原畫布狀態
    pop();

    // 如果粒子已消失
    if (
      particle.alpha <= 0 ||
      particle.y > height + 80
    ) {
      // 移除粒子
      confettiParticles.splice(i, 1);
    }
  }
}

// 從錯誤選項左右兩側產生叉叉
function spawnWrongCrosses(box) {
  // 清除舊叉叉
  wrongCrossEffects = [];

  // 建立新的錯誤叉叉效果
  wrongCrossEffects.push({
    startTime: millis(),
    box: box,
    crosses: [],
    nextSpawnTime: 0
  });
}

// 更新錯誤叉叉
function updateWrongCrosses() {
  // 逐一處理叉叉效果
  for (
    const effect of wrongCrossEffects
  ) {
    // 計算動畫時間
    const elapsed =
      millis() - effect.startTime;

    // 1.5 秒內分批產生叉叉
    if (
      elapsed < 1500 &&
      elapsed >= effect.nextSpawnTime
    ) {
      // 設定本批叉叉數量
      const count = floor(
        random(3, 7)
      );

      // 建立本批叉叉
      for (
        let i = 0;
        i < count;
        i++
      ) {
        // 決定左側或右側
        const side =
          random() < 0.5 ? -1 : 1;

        // 設定叉叉 X 座標
        const crossX =
          side === -1
            ? effect.box.x - random(20, 90)
            : effect.box.x +
              effect.box.width +
              random(20, 90);

        // 設定叉叉 Y 座標
        const crossY =
          effect.box.drawnY +
          effect.box.height / 2 +
          random(
            -effect.box.height,
            effect.box.height
          );

        // 加入叉叉資料
        effect.crosses.push({
          x: crossX,
          y: crossY,
          size: random(5, 11),
          bornTime: millis(),
          alpha: 255
        });
      }

      // 設定下一批叉叉時間
      effect.nextSpawnTime += 160;
    }

    // 繪製所有叉叉
    for (
      const cross of effect.crosses
    ) {
      // 計算叉叉存在時間
      const age =
        millis() - cross.bornTime;

      // 計算叉叉透明度
      cross.alpha = map(
        age,
        0,
        1500,
        255,
        0
      );

      // 儲存畫布狀態
      push();

      // 設定叉叉顏色
      stroke(
        188,
        75,
        81,
        cross.alpha
      );

      // 設定叉叉粗細
      strokeWeight(3);

      // 繪製第一條斜線
      line(
        cross.x - cross.size,
        cross.y - cross.size,
        cross.x + cross.size,
        cross.y + cross.size
      );

      // 繪製第二條斜線
      line(
        cross.x - cross.size,
        cross.y + cross.size,
        cross.x + cross.size,
        cross.y - cross.size
      );

      // 還原畫布狀態
      pop();
    }

    // 移除已經消失的叉叉
    effect.crosses =
      effect.crosses.filter(
        cross =>
          millis() -
            cross.bornTime <
          1500
      );
  }

  // 移除已完成的叉叉效果
  wrongCrossEffects =
    wrongCrossEffects.filter(
      effect =>
        millis() -
          effect.startTime <
          1500 ||
        effect.crosses.length > 0
    );
}