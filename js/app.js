// элементы страницы
const razmerInput = document.getElementById("size");
const algoritmSelect = document.getElementById("algorithm");
const svoiInput = document.getElementById("manual-array");
const knopkaGenerate = document.getElementById("generate-button");
const knopkaSvoi = document.getElementById("apply-manual-button");
const knopkaSort = document.getElementById("sort-button");
const knopkaCompare = document.getElementById("compare-button");
const knopkaStop = document.getElementById("stop-button");
const poleMassiva = document.getElementById("array-stage");
const textStart = document.getElementById("source-array");
const textFinish = document.getElementById("sorted-array");
const statusText = document.getElementById("status-message");
const statTime = document.getElementById("time-stat");
const statCompare = document.getElementById("comparisons-stat");
const statSwap = document.getElementById("swaps-stat");
const statStep = document.getElementById("steps-stat");
const guideName = document.getElementById("guide-name");
const guideDescription = document.getElementById("guide-description");
const guideComplexity = document.getElementById("guide-complexity");
const guideBehavior = document.getElementById("guide-behavior");
const guideBestFor = document.getElementById("guide-best-for");
const guideNote = document.getElementById("guide-note");
const guideCases = document.getElementById("guide-cases");
const guideMore = document.getElementById("guide-more");
const guidePseudo = document.getElementById("guide-pseudo");
const compareText = document.getElementById("comparison-message");
const compareBody = document.getElementById("comparison-body");
const panelSortirovki = document.getElementById("panel-sortirovki");

// кнопки алгоритмов
const knopkiAlgoritmov = Array.from(document.querySelectorAll(".algorithm-card"));
const knopkiSortTable = Array.from(document.querySelectorAll(".table-sort"));

// границы массива
const MIN_ARRAY_SIZE = Number(razmerInput.min);
const MAX_ARRAY_SIZE = Number(razmerInput.max);

// данные из html
const infoAlgoritmov = Array.from(document.querySelectorAll(".algorithm-info"));

// состояние страницы
let pyodide = null;
let pythonGotov = false;
let zanat = false;
let sortirovkaIdet = false;
let nadoOstanovit = false;
let massiv = [];
let comparisonResults = [];
let tableSort = "steps";
let tableDirection = "asc";

// текст массива
function massivText(array) {
    if (array.length === 0) {
        return "Нет данных.";
    }

    return "[" + array.join(", ") + "]";
}

// время
function formatVremya(value) {
    const ms = Number(value);

    if (!Number.isFinite(ms)) {
        return "0 мс";
    }

    if (ms < 0.001) {
        return "< 0.001 мс";
    }

    return ms.toFixed(3) + " мс";
}

// сообщение снизу
function pokazatStatus(text, type = "") {
    statusText.textContent = text;
    statusText.className = type === "" ? "status-message" : "status-message status-" + type;
}

// статистика
function pokazatStatistiku(stats = null) {
    if (stats === null) {
        statTime.textContent = "0 мс";
        statCompare.textContent = "0";
        statSwap.textContent = "0";
        statStep.textContent = "0";
        return;
    }

    statTime.textContent = stats.time_text || formatVremya(stats.time_ms);
    statCompare.textContent = String(stats.comparisons);
    statSwap.textContent = String(stats.swaps);
    statStep.textContent = String(stats.steps);
}

// вывод массивов
function pokazatTextMassivov(startArray = [], finishArray = null) {
    if (startArray.length === 0) {
        textStart.textContent = "Пока не сгенерирован.";
    } else {
        textStart.textContent = massivText(startArray);
    }

    if (finishArray !== null && finishArray.length > 0) {
        textFinish.textContent = massivText(finishArray);
    } else {
        textFinish.textContent = "Пока не отсортирован.";
    }
}

// поиск данных алгоритма
function naitiInfo(name) {
    for (let i = 0; i < infoAlgoritmov.length; i += 1) {
        if (infoAlgoritmov[i].dataset.algorithm === name) {
            return infoAlgoritmov[i];
        }
    }

    return infoAlgoritmov[0];
}

// текст из html
function textInfo(info, selector) {
    const item = info.querySelector(selector);

    if (item === null) {
        return "";
    }

    return item.textContent.trim();
}

// html из блока
function htmlInfo(info, selector) {
    const item = info.querySelector(selector);

    if (item === null) {
        return "";
    }

    return item.innerHTML.trim();
}

// название алгоритма
function nazvanieAlgoritma(name) {
    return textInfo(naitiInfo(name), ".info-name");
}

// описание выбранного сорта
function obnovitInfo() {
    const info = naitiInfo(algoritmSelect.value);

    guideName.textContent = textInfo(info, ".info-name");
    guideDescription.textContent = textInfo(info, ".info-description");
    guideComplexity.innerHTML = htmlInfo(info, ".info-complexity");
    guideBehavior.textContent = textInfo(info, ".info-behavior");
    guideBestFor.textContent = textInfo(info, ".info-best-for");
    guideNote.textContent = textInfo(info, ".info-note");
    guideCases.innerHTML = htmlInfo(info, ".info-cases");
    guideMore.textContent = textInfo(info, ".info-more");
    guidePseudo.textContent = textInfo(info, ".info-pseudo");

    for (let i = 0; i < knopkiAlgoritmov.length; i += 1) {
        const knopka = knopkiAlgoritmov[i];
        knopka.classList.toggle("active", knopka.dataset.algorithm === algoritmSelect.value);
    }
}

// выбор размера
function vybratRazmer(size) {
    if (zanat) {
        return;
    }

    razmerInput.value = size;
}

// включение кнопок
function obnovitDostup() {
    knopkaGenerate.disabled = zanat || !pythonGotov;
    knopkaSvoi.disabled = zanat;
    knopkaSort.disabled = zanat || !pythonGotov || massiv.length === 0;
    knopkaCompare.disabled = zanat || !pythonGotov || massiv.length === 0;
    knopkaStop.disabled = !sortirovkaIdet;
    razmerInput.disabled = zanat;
    algoritmSelect.disabled = zanat;
    svoiInput.disabled = zanat;

    for (let i = 0; i < knopkiAlgoritmov.length; i += 1) {
        knopkiAlgoritmov[i].disabled = zanat;
    }
}

// рисует столбцы
function risovatMassiv(array, active = [], sorted = false) {
    if (array.length === 0) {
        poleMassiva.innerHTML = '<p class="placeholder">Сначала сгенерируйте массив или введите его вручную.</p>';
        return;
    }

    const maxValue = Math.max(...array, 1);
    let html = "";

    for (let i = 0; i < array.length; i += 1) {
        const value = array[i];
        const height = Math.max(7, Math.round(value / maxValue * 100));
        let className = "array-bar";

        if (sorted) {
            className += " sorted";
        } else if (active.length > 0 && active[0] === i) {
            className += " active";
        } else if (active.includes(i)) {
            className += " compare";
        }

        html += '<div class="' + className + '" style="height: ' + height + '%;" title="' + value + '"></div>';
    }

    poleMassiva.innerHTML = html;
}

// шаг применяется 
function primenitShag(array, step) {
    if (step.type === "swap") {
        const a = step.indices[0];
        const b = step.indices[1];
        const vremenno = array[a];
        array[a] = array[b];
        array[b] = vremenno;
        return [a, b];
    }

    if (step.type === "overwrite") {
        array[step.index] = step.value;
        return [step.index];
    }

    return step.indices || [];
}

// пауза между шагами
function pauza(size) {
    let delay = 12;

    if (size <= 20) {
        delay = 70;
    } else if (size <= 40) {
        delay = 30;
    }

    return delay;
}

// пропуск лишних шагов
function shagAnimacii(stepCount) {
    if (stepCount <= 300) {
        return 1;
    }

    return Math.ceil(stepCount / 300);
}

// пауза
function sleep(ms) {
    return new Promise(function (resolve) {
        window.setTimeout(resolve, ms);
    });
}

// анимация сорта
async function animacia(startArray, steps) {
    const array = startArray.slice();
    const delay = pauza(array.length);
    const skip = shagAnimacii(steps.length);

    risovatMassiv(array);

    for (let i = 0; i < steps.length; i += 1) {
        if (nadoOstanovit) {
            risovatMassiv(array);
            return false;
        }

        const active = primenitShag(array, steps[i]);
        const nadoRisovat = i % skip === 0 || i === steps.length - 1 || steps[i].type !== "compare";

        if (nadoRisovat) {
            risovatMassiv(array, active);
            await sleep(delay);
        }
    }

    risovatMassiv(array, [], true);
    return true;
}

// очистка сравнения
function ochistitSravnenie() {
    comparisonResults = [];
    tableSort = "steps";
    tableDirection = "asc";
    obnovitSortTable();
    compareText.textContent = "Здесь появятся результаты после нажатия кнопки «Сравнить все».";
    compareBody.innerHTML = '<tr><td colspan="5">Пока нет данных.</td></tr>';
}

// значение для таблицы
function znachenieSortirovki(item, field) {
    if (field === "name") {
        return nazvanieAlgoritma(item.algorithm);
    }

    if (field === "time") {
        return item.stats.time_ms;
    }

    return item.stats[field];
}

// сортировка таблицы
function otsortirovatResults() {
    const result = comparisonResults.slice();

    result.sort(function (a, b) {
        const left = znachenieSortirovki(a, tableSort);
        const right = znachenieSortirovki(b, tableSort);
        let answer = 0;

        if (typeof left === "string") {
            answer = left.localeCompare(right, "ru");
        } else {
            answer = left - right;
        }

        if (tableDirection === "desc") {
            answer = -answer;
        }

        return answer;
    });

    return result;
}

// стрелка в таблице
function obnovitSortTable() {
    for (let i = 0; i < knopkiSortTable.length; i += 1) {
        const button = knopkiSortTable[i];
        const arrow = button.querySelector(".sort-arrow");
        const active = button.dataset.sort === tableSort;

        button.classList.toggle("active", active);
        arrow.textContent = active ? (tableDirection === "asc" ? "▲" : "▼") : "";
    }
}

// выбор сортировки таблицы
function vybratSortTablicy(newSort) {
    if (tableSort === newSort) {
        tableDirection = tableDirection === "asc" ? "desc" : "asc";
    } else {
        tableSort = newSort;
        tableDirection = "asc";
    }

    if (comparisonResults.length > 0) {
        pokazatSravnenie();
    } else {
        obnovitSortTable();
    }
}

// показ таблицы
function pokazatSravnenie(results = null) {
    if (results !== null) {
        comparisonResults = results.slice();
    }

    if (comparisonResults.length === 0) {
        ochistitSravnenie();
        return;
    }

    compareText.textContent = "Все запускаемые алгоритмы запускались на одном и том же массиве, поэтому результаты удобно сравнивать.";
    const sortedResults = otsortirovatResults();
    let html = "";

    for (let i = 0; i < sortedResults.length; i += 1) {
        const item = sortedResults[i];

        html += "<tr>";
        html += "<td>" + nazvanieAlgoritma(item.algorithm) + "</td>";
        html += "<td>" + formatVremya(item.stats.time_ms) + "</td>";
        html += "<td>" + item.stats.comparisons + "</td>";
        html += "<td>" + item.stats.swaps + "</td>";
        html += "<td>" + item.stats.steps + "</td>";
        html += "</tr>";
    }

    compareBody.innerHTML = html;
    obnovitSortTable();
}

// разбор своего массива
function razobratSvoiMassiv(text) {
    const bezSkobok = text.replace(/[\[\]]/g, " ");
    const parts = bezSkobok.split(/[\s,;]+/).filter(Boolean);

    if (parts.length < MIN_ARRAY_SIZE) {
        throw new Error("Введите минимум 5 чисел.");
    }

    if (parts.length > MAX_ARRAY_SIZE) {
        throw new Error("Можно вводить не больше " + MAX_ARRAY_SIZE + " чисел.");
    }

    const result = [];

    for (let i = 0; i < parts.length; i += 1) {
        const value = Number(parts[i]);

        if (!Number.isInteger(value)) {
            throw new Error("В массиве должны быть только целые числа.");
        }

        if (value < 1) {
            result.push(1);
        } else if (value > 999) {
            result.push(999);
        } else {
            result.push(value);
        }
    }

    return result;
}

// загрузка Python
async function zagruzitPython() {
    pokazatStatus("Загружается Python прямо в браузере...");
    obnovitDostup();

    try {
        if (typeof loadPyodide !== "function") {
            throw new Error("Pyodide не найден.");
        }

        pyodide = await loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.29.3/full/",
        });

        const response = await fetch("sorting.py");

        if (!response.ok) {
            throw new Error("Файл sorting.py не загрузился.");
        }

        const code = await response.text();
        pyodide.runPython(code);

        pythonGotov = true;
        pokazatStatus("Python загружен. Теперь можно генерировать и сортировать массив.", "success");
    } catch {
        pokazatStatus("Python не загрузился. Требуется подключения к интернету для скачивания Pyodide.", "error");
    }

    obnovitDostup();
}

// вызов Python
function python(name, ...args) {
    const func = pyodide.globals.get(name);

    try {
        return JSON.parse(func(...args));
    } finally {
        func.destroy();
    }
}

// загрузка массива на страницу
function zagruzitMassiv(array) {
    massiv = array.slice();
    razmerInput.value = array.length;
    svoiInput.value = array.join(", ");

    risovatMassiv(array);
    pokazatTextMassivov(array, null);
    pokazatStatistiku(null);
    ochistitSravnenie();
    obnovitDostup();
}

// случайный массив
function generirovatMassiv() {
    if (zanat || !pythonGotov) {
        return;
    }

    zanat = true;
    nadoOstanovit = false;
    obnovitDostup();
    pokazatStatus("Python генерирует массив...");

    try {
        const data = python("generate_array_json", razmerInput.value);
        zagruzitMassiv(data.array);
        pokazatStatus("Массив сгенерирован.", "success");
    } catch {
        pokazatStatus("Ошибка при генерации массива.", "error");
    }

    zanat = false;
    obnovitDostup();
}

// свой массив
function ispolzovatSvoiMassiv() {
    if (zanat) {
        return;
    }

    try {
        const array = razobratSvoiMassiv(svoiInput.value);
        zagruzitMassiv(array);
        pokazatStatus("Пользовательский массив загружен.", "success");
    } catch (error) {
        pokazatStatus(error.message, "error");
    }
}

// запуск сортировки
async function sortirovatMassiv() {
    if (zanat || !pythonGotov) {
        return;
    }

    if (massiv.length === 0) {
        pokazatStatus("Сначала создайте массив.", "error");
        return;
    }

    zanat = true;
    sortirovkaIdet = true;
    nadoOstanovit = false;
    obnovitDostup();
    pokazatStatus("Python сортирует массив...");

    try {
        const startMs = performance.now();
        const data = python("sort_array_json", algoritmSelect.value, JSON.stringify(massiv));
        const animaciaGotova = await animacia(data.original_array, data.steps);

        if (!animaciaGotova) {
            pokazatTextMassivov(massiv, null);
            pokazatStatus("Сортировка остановлена.", "warning");
        } else {
            data.stats.time_text = ((performance.now() - startMs) / 1000).toFixed(3) + " с";
            risovatMassiv(data.sorted_array, [], true);
            pokazatTextMassivov(data.original_array, data.sorted_array);
            pokazatStatistiku(data.stats);
            pokazatStatus("Сортировка завершена.", "success");
        }
    } catch {
        pokazatStatus("Ошибка при сортировке массива.", "error");
    }

    sortirovkaIdet = false;
    zanat = false;
    obnovitDostup();
}

// сравнение сортировок
function sravnitAlgoritmy() {
    if (zanat || !pythonGotov) {
        return;
    }

    if (massiv.length === 0) {
        pokazatStatus("Сначала создайте массив.", "error");
        return;
    }

    zanat = true;
    nadoOstanovit = false;
    obnovitDostup();
    pokazatStatus("Python сравнивает алгоритмы без анимации...");

    try {
        const results = [];
        const arrayJson = JSON.stringify(massiv);
        let selectedStats = null;
        let sortedArray = [];

        for (let i = 0; i < knopkiAlgoritmov.length; i += 1) {
            const name = knopkiAlgoritmov[i].dataset.algorithm;
            const startMs = performance.now();
            const answer = python("sort_array_json", name, arrayJson);

            answer.stats.time_ms = performance.now() - startMs;
            results.push(answer);

            if (i === 0) {
                sortedArray = answer.sorted_array;
            }

            if (answer.algorithm === algoritmSelect.value) {
                selectedStats = answer.stats;
            }
        }

        risovatMassiv(sortedArray, [], true);
        pokazatTextMassivov(massiv, sortedArray);
        pokazatSravnenie(results);
        pokazatStatistiku(selectedStats);
        pokazatStatus("Сравнение завершено.", "success");
    } catch {
        pokazatStatus("Ошибка при сравнении алгоритмов.", "error");
    }

    zanat = false;
    obnovitDostup();
}

// остановка сортировки
function ostanovitSortirovku() {
    if (!sortirovkaIdet) {
        return;
    }

    nadoOstanovit = true;

    pokazatTextMassivov(massiv, null);
    pokazatStatus("Выполнение остановлено.", "warning");
}

// выбор алгоритма
function vybratAlgoritm(name, nadoScroll = false) {
    algoritmSelect.value = name;
    obnovitInfo();

    if (nadoScroll) {
        panelSortirovki.scrollIntoView({
            behavior: "smooth",
            block: "center",
        });
    }
}

// запуск сайта
function start() {
    obnovitInfo();
    risovatMassiv([]);
    pokazatTextMassivov([], null);
    pokazatStatistiku(null);
    ochistitSravnenie();
    obnovitDostup();

    zagruzitPython();
}

start();
