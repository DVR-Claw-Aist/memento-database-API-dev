// ============================================================================
// memento-ui.d.ts
// Глобальные объявления (заглушки) для JavaScript API Memento Database.
// Источник: https://wiki.mementodatabase.com/scripting/Memento_JavaScript_Library.html
//
// Подключение в скрипте:
//   /// <reference path="./memento.d.ts" />
//
// ============================================================================
// ВАЖНО: несмотря на заявленную "JavaScript 1.7", движок Rhino на практике
// поддерживает большую часть ES6. Эмпирически НЕ работают (EvaluatorException):
//   - class
//   - spread/rest (...)
// Остальной ES6-синтаксис (let/const, =>, `${}`, деструктуризация, Promise,
// for...of, Array.includes, Object.assign) подтверждён рабочим.

/**
 * Точка входа в UI API. Каждый вызов ui() создаёт новый строитель UI-элемента.
 * Скрипт (в Script Widget или в качестве Dialog.view()) должен вернуть один
 * UI-объект — если нужно несколько элементов, оберните их в ui().layout([...]).
 *
 * Пример:
 * ```
 * ui().text('Привет, мир!');
 * ```
 */
declare function ui(): UI;

/**
 * Флаг первого запуска скрипта виджета.
 * true — при первом построении виджета, false — при последующих перестройках
 * (обновление библиотек, синхронизация, поворот экрана и т.п.).
 * Используется для одноразовой инициализации переменных.
 *
 * Пример:
 * ```
 * var counter;
 * if (_initWidget) {
 *     counter = 0;
 * }
 * counter++;
 * ```
 */
declare var _initWidget: boolean;

/** Фабрика UI-элементов, возвращаемая глобальной функцией ui(). */
interface UI {
    /**
     * Создать текстовую метку.
     * @param text текст метки
     */
    text(text: string): UIText;

    /**
     * Создать контейнер, группирующий несколько UI-элементов
     * (по умолчанию — вертикально, столбцом).
     * @param children массив дочерних UI-элементов
     */
    layout(children: UIElement[]): UILayout;

    /**
     * Создать кнопку.
     * @param title текст на кнопке (необязателен, если задана icon())
     */
    button(title?: string): UIButton;

    /**
     * Создать текстовый редактор (поле ввода).
     * @param text начальный текст в редакторе
     */
    edit(text?: string): UIEditor;

    /**
     * Создать чекбокс.
     * @param title подпись рядом с чекбоксом
     * @param value начальное значение (true — отмечен)
     */
    checkbox(title: string, value: boolean): UICheckbox;

    /**
     * Создать выпадающий список выбора.
     * @param selected индекс изначально выбранного элемента
     * @param items массив строк — вариантов выбора
     */
    choiceBox(selected: number, items: string[]): UIChoiceBox;

    /**
     * Создать изображение.
     * @param url URL или путь к файлу изображения
     *   (например, значение поля типа Image: entry.field('Photo')[0])
     */
    image(url: string): UIImage;

    /**
     * Создать серию страниц (свайп между UI-элементами).
     * @param children массив UI-элементов, каждый — на отдельной странице
     */
    pages(children: UIElement[]): UIPages;

    /**
     * Найти ранее созданный UI-элемент по его тегу (см. UIElement.tag()).
     * Обычно используется внутри обработчиков action()/onChange() для
     * получения текущего значения других элементов формы.
     * @param tag тег элемента, заданный через .tag(text)
     */
    //findByTag(tag: string): UIElement | null; // v.1
    findByTag(tag: string): any; // Исправлено: возвращает any - для работы с .text, .checkBox, .choiceBox и др. v.2
    //findByTag<T extends UIElement = UIElement>(tag: string): T; // v.3 - возвращает ошибку с  .checkBox, .choiceBox
}

/**
 * Базовые методы, доступные для всех UI-элементов
 * (текст, layout, кнопка, редактор, чекбокс, choiceBox, изображение, pages).
 */
interface UIElement {
    /** Установить ширину элемента в пикселях. */
    width(width: number): this;

    /** Установить высоту элемента в пикселях. */
    height(height: number): this;

    /** Растянуть ширину элемента на всю ширину родителя. */
    width_match_parent(): this;

    /** Растянуть высоту элемента на всю высоту родителя. */
    height_match_parent(): this;

    /** Подогнать ширину элемента по содержимому. */
    width_wrap_content(): this;

    /** Подогнать высоту элемента по содержимому. */
    height_wrap_content(): this;

    /**
     * Установить вес элемента внутри layout — определяет пропорцию
     * распределения свободного места между элементами.
     */
    weight(weight: number): this;

    /**
     * Присвоить элементу тег для последующего поиска через
     * ui().findByTag(tag) и для сохранения состояния виджета
     * между перестройками (см. UI().edit при задании тега).
     */
    tag(text: string): this;
}

/** Текстовая метка, возвращаемая ui().text(...). */
interface UIText extends UIElement {
    /**
     * Текущий текст метки. Свойство, а НЕ метод — присваивается напрямую
     * (`resultLabel.text = 'новое значение'`), вызов как функции
     * (`resultLabel.text('...')`) упадёт с TypeError (подтверждено
     * эмпирически: "Cannot call property text in object [object JsUIText].
     * It is not a function, it is "string"").
     *
     * Присваивание обновляет текст прямо на уже отрисованной странице без
     * пересборки диалога — подтверждено эмпирически: изменение внутри
     * button.action() отражается на экране немедленно, пока диалог открыт.
     *
     * Пример (пересчёт "на лету" по кнопке, без onChange у edit):
     * ```
     * const resultLabel = ui().text('Расход: —');
     * ui().button('Посчитать').action(function () {
     *     resultLabel.text = 'Расход: ' + (curr - prev);
     * });
     * ```
     */
    text: string;

    /**
     * Настроить шрифт текста.
     * @param options объект с настройками: size (px), color (строка/hex),
     *   style ("bold" | "italic" | "bold italic" и т.п.)
     *
     * Пример:
     * ```
     * ui().text('Привет').font({ size: 10, color: 'red', style: 'bold' });
     * ```
     */
    font(options: UIFontOptions): UIText;
}
/** Доступные стандартные имена цветов или любой кастомный HEX-код */
type MementoUiColor = 'red' | 'green' | 'blue' | 'yellow' | 'orange' | 'white' | 'black' | 'gray' | (string & {});

/** Настройки шрифта для текстового элемента. */
interface UIFontOptions {
    /** Размер шрифта в пикселях.
     *@param size - Размер шрифта в пикселях */
    size?: number;

    /** Цвет текста (строка вроде "red" или hex "#FF0000").
     * @param {('red'|'green'|'blue'|'yellow'|'orange'|'white'|'black'|'gray'|string)} [color] - Имя цвета или HEX-код (#RRGGBB)
     * */
    color?: MementoUiColor;

    /** Начертание, например "bold", "italic".
     *  @param {('bold'|'italic'|'normal')} [style] - Стиль начертания
     * */
    style?: string;
}

/**
 * Контейнер, группирующий несколько UI-элементов, возвращаемый
 * ui().layout([...]). По умолчанию — вертикальная колонка.
 */
interface UILayout extends UIElement {
    /** Расположить дочерние элементы горизонтально, в один ряд. */
    horizontal(): this;
}

/** Кнопка, возвращаемая ui().button(...). */
interface UIButton extends UIElement {
    /**
     * Задать обработчик нажатия на кнопку.
     * Если обработчик возвращает true — список библиотек/UI виджета
     * будет обновлён после выполнения действия.
     *
     * Пример:
     * ```
     * ui().button('Добавить').action(function() {
     *     lib().create({ 'Название': 'Новая запись' });
     *     return true;
     * });
     * ```
     */
    action(callback: () => boolean | void): UIButton; // Было: this

    /**
     * Задать иконку кнопки. Если title не указан — кнопка отображается
     * только с иконкой.
     * @param iconName имя иконки (например, "nova:add-circle-1.png")
     */
    icon(iconName: string): UIButton;
}

/**
 * Текстовый редактор (поле ввода), возвращаемый ui().edit(...).
 *
 * ВАЖНО: в отличие от UICheckbox/UIChoiceBox, у редактора НЕТ onChange()
 * или другого события "текст изменился". Скрипт не может отреагировать на
 * ввод посимвольно/в реальном времени — только прочитать .text в момент,
 * когда сработает другой колбэк (button.action(), positiveButton() и т.п.).
 * Для эффекта "почти реального времени" — кнопка "Посчитать" рядом с
 * полем, которая по нажатию читает .text и обновляет UIText.text (см.
 * пример в UIText выше).
 */
interface UIEditor extends UIElement {
    /**
     * Текущий текст в редакторе. Можно как читать, так и присваивать
     * новое значение.
     *
     * Пример:
     * ```
     * var myEditor = ui().edit('Введите текст');
     * var currentText = myEditor.text;
     * myEditor.text = 'Новый текст';
     * ```
     */
    text: string;

    /**
     * Настроить шрифт вводимого текста. Подтверждено эмпирически — в
     * официальной документации метод описан только для UIText, но
     * реально работает и на UIEditor.
     * @param options объект с настройками: size (px), color (строка/hex),
     *   style ("bold" | "italic" | "bold italic" и т.п.)
     *
     * Пример:
     * ```
     * ui().edit('').tag('name_input').font({ style: 'italic', color: 'red' });
     * ```
     */
    font(options: UIFontOptions): this;
}

/** Чекбокс, возвращаемый ui().checkbox(...). */
interface UICheckbox extends UIElement {
    /**
     * Текущее состояние чекбокса (true — отмечен). Можно читать и
     * присваивать новое значение программно.
     */
    checked: boolean;

    /**
     * Задать обработчик изменения состояния чекбокса пользователем.
     * @param callback вызывается с новым значением checked
     *
     * Пример:
     * ```
     * ui().checkbox('Включить уведомления', true).onChange(function(value) {
     *     if (value) {
     *         message('Уведомления включены');
     *     } else {
     *         message('Уведомления выключены');
     *     }
     * });
     * ```
     */
    onChange(callback: (value: boolean) => void): UICheckbox;
}

/** Выпадающий список выбора, возвращаемый ui().choiceBox(...). */
interface UIChoiceBox extends UIElement {
    /**
     * Индекс выбранного элемента. Можно читать и присваивать новое
     * значение программно.
     */
    selected: number;

    /**
     * Задать обработчик изменения выбора пользователем.
     * @param callback вызывается с индексом (position) нового выбранного элемента
     *
     * Пример:
     * ```
     * ui().choiceBox(0, ['Вариант 1', 'Вариант 2']).onChange(function(position) {
     *     message('Выбран вариант: ' + position);
     * });
     * ```
     */
    onChange(callback: (position: number) => void): UIChoiceBox;
}

/** Изображение, возвращаемое ui().image(...). */
interface UIImage extends UIElement {
    // Специфичных дополнительных методов, помимо базовых UIElement, нет.
}

/**
 * Серия страниц (пейджер), возвращаемая ui().pages([...]).
 * Позволяет переключаться свайпом между несколькими UI-элементами.
 */
interface UIPages extends UIElement {
    // Специфичных дополнительных методов, помимо базовых UIElement, нет.
}
