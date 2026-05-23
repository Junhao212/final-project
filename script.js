const countries = [
  { name: "Belgie", flag: "🇧🇪", aliases: ["belgie", "belgium", "belgië"] },
  { name: "Frankrijk", flag: "🇫🇷", aliases: ["frankrijk", "france"] },
  { name: "Duitsland", flag: "🇩🇪", aliases: ["duitsland", "duistland", "germany"] },
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

const DEFAULT_MODEL_URL = "https://teachablemachine.withgoogle.com/models/503N_0-42/";

const scoreEl = document.querySelector("#score");
const bestScoreEl = document.querySelector("#best-score");
const flagEl = document.querySelector("#flag");
const roundCountEl = document.querySelector("#round-count");
const countryHintEl = document.querySelector("#country-hint");
const modelUrlEl = document.querySelector("#model-url");
const startBtn = document.querySelector("#start-btn");
const stopBtn = document.querySelector("#stop-btn");
const skipBtn = document.querySelector("#skip-btn");
const resetBtn = document.querySelector("#reset-btn");
const statusEl = document.querySelector("#status");
const predictionEl = document.querySelector("#prediction");
const modelCheckEl = document.querySelector("#model-check");

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

function isNoiseLabel(label) {
  const normalizedLabel = normalizeAnswer(label);
  return ["background noise", "background", "noise", "unknown"].includes(
    normalizedLabel,
  );
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

function setListeningState(isListening) {
  startBtn.disabled = isListening;
  stopBtn.disabled = !isListening;
  startBtn.textContent = isListening ? "Luistert..." : "Start microfoon";
}

function setModelCheck(message, type = "") {
  modelCheckEl.textContent = message;
  modelCheckEl.className = `model-check ${type}`.trim();
}

function updateModelLabelCheck(labels) {
  const normalizedLabels = labels.map(normalizeAnswer).filter(Boolean);
  const presentLabels = countries.filter((country) =>
    country.aliases.some((alias) => normalizedLabels.includes(normalizeAnswer(alias))),
  );
  const missingLabels = countries.filter(
    (country) =>
      !country.aliases.some((alias) => normalizedLabels.includes(normalizeAnswer(alias))),
  );

  if (missingLabels.length === 0) {
    setModelCheck("Model check: alle land-labels zitten in je Teachable Machine model.", "ready");
    return;
  }

  setModelCheck(
    `Model check: ${presentLabels.length}/${countries.length} land-labels gevonden. Mist nog: ${missingLabels.map((country) => country.name).join(", ")}.`,
    "warning",
  );
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
  if (isNoiseLabel(rawAnswer)) return;

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
  updateModelLabelCheck(labels);

  recognizer.listen(
    (result) => {
      const scores = Array.from(result.scores);
      const bestIndex = scores.indexOf(Math.max(...scores));
      const label = labels[bestIndex];
      const confidence = scores[bestIndex];

      predictionEl.textContent = `${label} (${Math.round(confidence * 100)}%)`;

      if (confidence >= 0.75 && !isNoiseLabel(label)) {
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
  setListeningState(true);

  try {
    await startTeachableMachine();
  } catch (error) {
    setListeningState(false);
    setStatus(error.message);
  }
}

function stopGame() {
  if (recognizer && recognizer.isListening()) {
    recognizer.stopListening();
  }

  if (recognition) {
    recognition.stop();
  }

  setListeningState(false);
  setStatus("Microfoon is gestopt.");
}

function resetScore() {
  score = 0;
  bestScore = 0;
  localStorage.removeItem(STORAGE_KEYS.bestScore);
  render();
  setStatus("Score is gereset.");
}

modelUrlEl.value = localStorage.getItem(STORAGE_KEYS.modelUrl) || DEFAULT_MODEL_URL;
startBtn.addEventListener("click", startGame);
stopBtn.addEventListener("click", stopGame);
skipBtn.addEventListener("click", goToNextRound);
resetBtn.addEventListener("click", resetScore);
render();
