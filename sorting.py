import json
import random
import time


# настройки
DEFAULT_SIZE = 20
MIN_SIZE = 5
MAX_SIZE = 100
MIN_RANDOM = 10
MAX_RANDOM = 99
MIN_VALUE = 1
MAX_VALUE = 999

# проверка размера
def normal_size(value):
    try:
        size = int(value)
    except (TypeError, ValueError):
        size = DEFAULT_SIZE

    if size < MIN_SIZE:
        size = MIN_SIZE

    if size > MAX_SIZE:
        size = MAX_SIZE

    return size


# проверка чисел
def clean_array(array):
    result = []

    for item in array[:MAX_SIZE]:
        value = int(item)

        if value < MIN_VALUE:
            value = MIN_VALUE

        if value > MAX_VALUE:
            value = MAX_VALUE

        result.append(value)

    return result


# генерация массива
def generate_array(size):
    size = normal_size(size)
    return [random.randint(MIN_RANDOM, MAX_RANDOM) for _ in range(size)]


# общий ответ для сайта
def make_answer(name, start_array, finish_array, steps, comparisons, swaps, start_time):
    work_time = (time.perf_counter() - start_time) * 1000

    return {
        "algorithm": name,
        "original_array": start_array[:],
        "sorted_array": finish_array,
        "steps": steps,
        "stats": {
            "time_ms": work_time,
            "comparisons": comparisons,
            "swaps": swaps,
            "steps": len(steps),
        },
    }


# сортировка пузырьком
def bubble_sort(array):
    a = array[:]
    steps = []
    comparisons = 0
    swaps = 0
    start_time = time.perf_counter()
    n = len(a)

    for i in range(n - 1):
        for j in range(n - 1):
            comparisons += 1
            steps.append({"type": "compare", "indices": [j, j + 1]})

            if a[j] > a[j + 1]:
                a[j], a[j + 1] = a[j + 1], a[j]
                swaps += 1
                steps.append({"type": "swap", "indices": [j, j + 1]})

    return make_answer("bubble", array, a, steps, comparisons, swaps, start_time)


# гномья сортировка
def gnome_sort(array):
    a = array[:]
    steps = []
    comparisons = 0
    swaps = 0
    start_time = time.perf_counter()
    i = 1

    while i < len(a):
        if i > 0:
            comparisons += 1
            steps.append({"type": "compare", "indices": [i - 1, i]})

        if i > 0 and a[i - 1] > a[i]:
            a[i - 1], a[i] = a[i], a[i - 1]
            swaps += 1
            steps.append({"type": "swap", "indices": [i - 1, i]})
            i -= 1
        else:
            i += 1

    return make_answer("gnome", array, a, steps, comparisons, swaps, start_time)


# сортировка расческой
def comb_sort(array):
    a = array[:]
    steps = []
    comparisons = 0
    swaps = 0
    start_time = time.perf_counter()
    n = len(a)
    gap = n
    changed = True

    while gap > 1 or changed:
        gap = int(gap / 1.3)

        if gap < 1:
            gap = 1

        changed = False
        i = 0

        while i + gap < n:
            comparisons += 1
            steps.append({"type": "compare", "indices": [i, i + gap]})

            if a[i] > a[i + gap]:
                a[i], a[i + gap] = a[i + gap], a[i]
                swaps += 1
                changed = True
                steps.append({"type": "swap", "indices": [i, i + gap]})

            i += 1

    return make_answer("comb", array, a, steps, comparisons, swaps, start_time)


# сортировка слиянием
def merge_sort(array):
    a = array[:]
    steps = []
    comparisons = 0
    swaps = 0
    start_time = time.perf_counter()

    def sort_part(left, right):
        nonlocal comparisons, swaps

        if right - left <= 1:
            return

        middle = (left + right) // 2
        sort_part(left, middle)
        sort_part(middle, right)

        left_part = a[left:middle]
        right_part = a[middle:right]
        i = 0
        j = 0
        k = left

        while i < len(left_part) and j < len(right_part):
            comparisons += 1
            steps.append({"type": "compare", "indices": [left + i, middle + j]})

            if left_part[i] < right_part[j]:
                a[k] = left_part[i]
                i += 1
            else:
                a[k] = right_part[j]
                j += 1

            swaps += 1
            steps.append({"type": "overwrite", "index": k, "value": a[k]})
            k += 1

        while i < len(left_part):
            a[k] = left_part[i]
            i += 1
            swaps += 1
            steps.append({"type": "overwrite", "index": k, "value": a[k]})
            k += 1

        while j < len(right_part):
            a[k] = right_part[j]
            j += 1
            swaps += 1
            steps.append({"type": "overwrite", "index": k, "value": a[k]})
            k += 1

    sort_part(0, len(a))
    return make_answer("merge", array, a, steps, comparisons, swaps, start_time)


# сортировка вставками
def insertion_sort(array):
    a = array[:]
    steps = []
    comparisons = 0
    swaps = 0
    start_time = time.perf_counter()

    for i in range(1, len(a)):
        current = a[i]
        j = i - 1

        while j >= 0:
            comparisons += 1
            steps.append({"type": "compare", "indices": [j, j + 1]})

            if a[j] <= current:
                break

            a[j + 1] = a[j]
            swaps += 1
            steps.append({"type": "overwrite", "index": j + 1, "value": a[j]})
            j -= 1

        a[j + 1] = current
        swaps += 1
        steps.append({"type": "overwrite", "index": j + 1, "value": current})

    return make_answer("insertion", array, a, steps, comparisons, swaps, start_time)


# сортировка шелла
def shell_sort(array):
    a = array[:]
    steps = []
    comparisons = 0
    swaps = 0
    start_time = time.perf_counter()
    n = len(a)
    gap = n // 2

    while gap > 0:
        for i in range(gap, n):
            temp = a[i]
            j = i

            while j >= gap:
                comparisons += 1
                steps.append({"type": "compare", "indices": [j - gap, j]})

                if a[j - gap] <= temp:
                    break

                a[j] = a[j - gap]
                swaps += 1
                steps.append({"type": "overwrite", "index": j, "value": a[j - gap]})
                j -= gap

            a[j] = temp
            swaps += 1
            steps.append({"type": "overwrite", "index": j, "value": temp})

        gap = gap // 2

    return make_answer("shell", array, a, steps, comparisons, swaps, start_time)


# поразрядная сортировка
def radix_sort(array):
    a = array[:]
    steps = []
    comparisons = 0
    swaps = 0
    start_time = time.perf_counter()

    if len(a) == 0:
        return make_answer("radix", array, a, steps, comparisons, swaps, start_time)

    max_number = max(a)
    digit = 1

    while max_number // digit > 0:
        buckets = [[], [], [], [], [], [], [], [], [], []]

        for number in a:
            bucket_index = (number // digit) % 10
            buckets[bucket_index].append(number)

        sobran = []

        for bucket in buckets:
            for number in bucket:
                sobran.append(number)

        for i in range(len(a)):
            a[i] = sobran[i]
            swaps += 1
            steps.append({"type": "overwrite", "index": i, "value": a[i]})

        digit *= 10

    return make_answer("radix", array, a, steps, comparisons, swaps, start_time)


# быстрая сортировка
def quick_sort(array):
    a = array[:]
    steps = []
    comparisons = 0
    swaps = 0
    start_time = time.perf_counter()

    def partition(low, high):
        nonlocal comparisons, swaps

        pivot = a[high]
        i = low - 1

        for j in range(low, high):
            comparisons += 1
            steps.append({"type": "compare", "indices": [j, high]})

            if a[j] <= pivot:
                i += 1

                a[i], a[j] = a[j], a[i]
                swaps += 1
                steps.append({"type": "swap", "indices": [i, j]})

        a[i + 1], a[high] = a[high], a[i + 1]
        swaps += 1
        steps.append({"type": "swap", "indices": [i + 1, high]})

        return i + 1

    def sort_part(low, high):
        if low < high:
            pivot_index = partition(low, high)
            sort_part(low, pivot_index - 1)
            sort_part(pivot_index + 1, high)

    sort_part(0, len(a) - 1)
    return make_answer("quick", array, a, steps, comparisons, swaps, start_time)


# связь названия и функции
SORTERS = {
    "bubble": bubble_sort,
    "gnome": gnome_sort,
    "insertion": insertion_sort,
    "comb": comb_sort,
    "shell": shell_sort,
    "radix": radix_sort,
    "merge": merge_sort,
    "quick": quick_sort,
}


# json для pyodide генерации
def generate_array_json(size):
    answer = {"array": generate_array(size)}
    return json.dumps(answer, ensure_ascii=False)


# json для pyodide сортировки
def sort_array_json(algorithm, array_json):
    array = clean_array(json.loads(array_json))
    sorter = SORTERS.get(algorithm, quick_sort)
    answer = sorter(array)
    return json.dumps(answer, ensure_ascii=False)
