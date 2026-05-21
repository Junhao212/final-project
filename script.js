const countries = [
  { name: "Belgie", flag: "🇧🇪", aliases: ["belgie", "belgium", "belgië"] },
  { name: "Frankrijk", flag: "🇫🇷", aliases: ["frankrijk", "france"] },
  { name: "Duitsland", flag: "🇩🇪", aliases: ["duitsland", "germany"] },
  { name: "Nederland", flag: "🇳🇱", aliases: ["nederland", "netherlands", "holland"] },
  { name: "Spanje", flag: "🇪🇸", aliases: ["spanje", "spain"] },
  { name: "Italie", flag: "🇮🇹", aliases: ["italie", "italië", "italy"] },
  { name: "Portugal", flag: "🇵🇹", aliases: ["portugal"] },
  { name: "Japan", flag: "🇯🇵", aliases: ["japan"] },
  { name: "Brazilie", flag: "🇧🇷", aliases: ["brazilie", "brazilië", "brazil"] },
  { name: "Canada", flag: "🇨🇦", aliases: ["canada"] },
];

const STORAGE_KEYS = {
  bestScore: "flagVoiceBestScore",
  modelUrl: "flagVoiceModelUrl",
};

const scoreEl = document.querySelector("#score");
const bestScoreEl = document.querySelector("#best-score");
const flagEl = document.querySelector("#flag");
const roundCountEl = document.querySelector("#round-count");
const countryHintEl = document.querySelector("#country-hint");
const modelUrlEl = document.querySelector("#model-url");
const startBtn = document.querySelector("#start-btn");
const skipBtn = document.querySelector("#skip-btn");
const resetBtn = document.querySelector("#reset-btn");
const statusEl = document.querySelector("#status");
const predictionEl = document.querySelector("#prediction");

let score = 0;
let bestScore = Number(localStorage.getItem(STORAGE_KEYS.bestScore)) || 0;
let currentIndex = 0;
let answeredThisRound = false;
let recognizer;
let recognition;

function normalizeAnswer(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z\s]/g, "")
    .trim();
}

function currentCountry() {
  return countries[currentIndex % countries.length];
}

function render() {
  const country = currentCountry();
  scoreEl.textContent = score;
  bestScoreEl.textContent = bestScore;
  flagEl.textContent = country.flag;
  roundCountEl.textContent = `Vraag ${(currentIndex % countries.length) + 1} van ${countries.length}`;
  countryHintEl.textContent = "Zeg de naam van dit land";
}

function setStatus(message) {
  statusEl.textContent = message;
}

function saveBestScore() {
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem(STORAGE_KEYS.bestScore, String(bestScore));
  }
}

function goToNextRound() {
  answeredThisRound = false;
  currentIndex = (currentIndex + 1) % countries.length;
  render();
}

function checkAnswer(rawAnswer) {
  if (!rawAnswer || answeredThisRound) return;

  const country = currentCountry();
  const normalizedAnswer = normalizeAnswer(rawAnswer);
  const acceptedAnswers = country.aliases.map(normalizeAnswer);
  predictionEl.textContent = rawAnswer;

  if (acceptedAnswers.includes(normalizedAnswer)) {
    answeredThisRound = true;
    score += 1;
    saveBestScore();
    render();
    setStatus(`Juist, dat was ${country.name}.`);
    window.setTimeout(goToNextRound, 900);
  } else {
    setStatus(`Nog niet juist. Probeer opnieuw.`);
  }
}

function cleanModelUrl(url) {
  const trimmed = url.trim();
  if (!trimmed) return "";
  return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
}

async function startTeachableMachine() {
  const modelUrl = cleanModelUrl(modelUrlEl.value);
  if (!modelUrl) {
    startSpeechFallback();
    return;
  }

  if (!window.speechCommands) {
    throw new Error("Teachable Machine kon niet laden. Check je internetverbinding.");
  }

  localStorage.setItem(STORAGE_KEYS.modelUrl, modelUrl);
  recognizer = window.speechCommands.create(
    "BROWSER_FFT",
    undefined,
    `${modelUrl}model.json`,
    `${modelUrl}metadata.json`,
  );

  setStatus("Model aan het laden...");
  await recognizer.ensureModelLoaded();
  const labels = recognizer.wordLabels();

  recognizer.listen(
    (result) => {
      const scores = Array.from(result.scores);
      const bestIndex = scores.indexOf(Math.max(...scores));
      const label = labels[bestIndex];
      const confidence = scores[bestIndex];

      predictionEl.textContent = `${label} (${Math.round(confidence * 100)}%)`;

      if (confidence >= 0.75) {
        checkAnswer(label);
      }
    },
    {
      includeSpectrogram: false,
      probabilityThreshold: 0.75,
      invokeCallbackOnNoiseAndUnknown: false,
      overlapFactor: 0.5,
    },
  );

  setStatus("Microfoon staat aan. Zeg de naam van de vlag.");
}

function startSpeechFallback() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    setStatus("Je browser ondersteunt geen speech fallback. Gebruik een Teachable Machine URL.");
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = "nl-BE";
  recognition.continuous = true;
  recognition.interimResults = false;

  recognition.addEventListener("result", (event) => {
    const latestResult = event.results[event.results.length - 1][0].transcript;
    checkAnswer(latestResult);
  });

  recognition.addEventListener("end", () => {
    if (startBtn.disabled) recognition.start();
  });

  recognition.start();
  setStatus("Fallback speech recognition staat aan. Voor de eindopdracht plak je best je TM model-link.");
}

async function startGame() {
  startBtn.disabled = true;
  startBtn.textContent = "Luistert...";

  try {
    await startTeachableMachine();
  } catch (error) {
    startBtn.disabled = false;
    startBtn.textContent = "Start microfoon";
    setStatus(error.message);
  }
}

function resetScore() {
  score = 0;
  bestScore = 0;
  localStorage.removeItem(STORAGE_KEYS.bestScore);
  render();
  setStatus("Score is gereset.");
}

modelUrlEl.value = localStorage.getItem(STORAGE_KEYS.modelUrl) || "";
startBtn.addEventListener("click", startGame);
skipBtn.addEventListener("click", goToNextRound);
resetBtn.addEventListener("click", resetScore);
render();
