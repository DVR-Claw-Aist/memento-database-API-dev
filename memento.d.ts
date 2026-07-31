// ============================================================================
// memento.d.ts
// Глобальные объявления (заглушки) для JavaScript API Memento Database.
// Источник: https://wiki.mementodatabase.com/scripting/Memento_JavaScript_Library.html
//
// Подключение в скрипте:
//   /// <reference path="./memento.d.ts" />
//
// Это файл ТОЛЬКО для типизации (объявления). Реальные реализации методов
// предоставляются движком Memento во время выполнения скрипта внутри
// приложения — здесь ничего не импортируется и не экспортируется, поэтому
// файл рассматривается TypeScript/WebStorm как глобальный (global script).
//
// О ВЕРСИИ JS ДВИЖКА (проверено эмпирически, вики устарела):
// Документация Memento заявляет "JavaScript 1.7", но по факту используется
// более новая версия Rhino, поддерживающая большую часть ES6:
//   РАБОТАЮТ: let, const, стрелочные функции, шаблонные строки,
//             деструктуризация, Promise, for...of, Array.includes,
//             Object.assign и т.п.
//   НЕ РАБОТАЮТ (проверено, падают с EvaluatorException):
//             - spread / rest (...)               -> "syntax error"
//             - class                              -> "identifier is a
//               reserved word: class"
// Модули (import/export) не тестировались отдельно, но архитектурно не
// применимы — Memento исполняет один файл скрипта целиком, без модульной
// системы, поэтому просто не используйте import/export.
// ============================================================================

// ----------------------------------------------------------------------------
// Library & Entry — библиотеки и записи
// ----------------------------------------------------------------------------

/**
 * Получить объект Entry текущего события (например, обновляемая запись).
 * Недоступно в фазе "Opening an Entry Edit card" события "Creating an entry" —
 * там используйте entryDefault().
 */
declare function entry(): Entry;

/**
 * Получить объект DefaultEntry со значениями по умолчанию для ещё не
 * созданной записи. Доступно только для события "Creating an entry"
 * в фазе "Opening an Entry Edit card".
 */
declare function entryDefault(): DefaultEntry;

/**
 * Позволяет настраивать значения по умолчанию при создании/копировании/
 * создании по шаблону записи (Creating/Updating an entry,
 * фаза Opening an Entry Edit card).
 */
declare function buildDefaultEntry(): DefaultEntry;

/** Немедленно останавливает выполнение скрипта. */
declare function exit(): void;

/** Получить библиотеку, в которой произошло текущее событие. */
declare function lib(): Library;

/**
 * Найти библиотеку по имени. Требуется разрешение на использование
 * библиотеки согласно настройкам безопасности.
 * @param name имя библиотеки
 * @returns объект Library или null, если не найдена
 */
declare function libByName(name: string): Library | null;

/**
 * Найти библиотеку по id. Требуется разрешение на использование
 * библиотеки согласно настройкам безопасности. (Добавлено в MDB 5.5)
 * @param id идентификатор библиотеки
 * @returns объект Library или null, если не найдена
 */
declare function libById(id: string): Library | null;

// ----------------------------------------------------------------------------
// Специфичные для события "Linking an entry" (обе фазы: Before saving /
// After saving the entry) — см. https://wiki.mementodatabase.com/scripting/Spec_Triggers.html#masterlib
//
// Событие "Linking an entry" срабатывает в скрипте библиотеки, НА КОТОРУЮ
// ссылаются (т.е. в библиотеке, чья запись выбрана/создана в поле Link to
// Entry другой записи) — entry()/lib() здесь это выбранная/новая запись и
// её библиотека, а masterEntry()/masterLib() — та запись и библиотека,
// ОТКУДА эта ссылка была добавлена (т.е. "родитель" в этой конкретной связи).
//
// Именно поэтому linksTo() у пары библиотек может "работать" только в одну
// сторону: связь физически хранится полем Link to Entry только в одной
// библиотеке, и только там при добавлении связи сработает "Linking an
// entry" с доступом к masterLib()/masterEntry().
// ----------------------------------------------------------------------------

/**
 * Библиотека, ИЗ которой была добавлена ссылка на текущую запись
 * (та библиотека, где физически лежит поле Link to Entry).
 * Доступно только в скриптах события "Linking an entry".
 */
declare function masterLib(): Library;

/**
 * Запись, ИЗ которой была добавлена ссылка на текущую запись — то есть та
 * запись, в чьём поле Link to Entry выбрали/создали текущую entry().
 * Доступно только в скриптах события "Linking an entry".
 */
declare function masterEntry(): Entry;

/**
 * Получить значение атрибута текущей связи (Link to Entry-поля умеют
 * хранить дополнительные атрибуты для каждой конкретной связи, не для
 * записи в целом). Доступно только в скриптах события "Linking an entry".
 * @param name имя атрибута связи
 */
declare function attr(name: string): any;

/**
 * Установить значение атрибута текущей связи. Доступно только в скриптах
 * события "Linking an entry".
 * @param name имя атрибута связи
 * @param value значение
 */
declare function setAttr(name: string, value: any): void;

/** Объект библиотеки — доступ к записям библиотеки. */
interface Library {
    /**
     * Создать новую запись в библиотеке.
     * @param values объект, свойства которого — имена полей и их значения
     */
    create(values?: Record<string, any>): Entry;

    /** Получить все записи библиотеки (от новых к старым). */
    entries(): Entry[];

    /** Самая последняя созданная запись библиотеки, либо null. */
    lastEntry(): Entry | null;

    /** Самая старая (первая созданная) запись библиотеки, либо null. */
    firstEntry(): Entry | null;

    /**
     * Имена полей библиотеки (в порядке определения).
     * Возвращаются только поля главной страницы, не находящиеся
     * внутри Subheader (начиная с версии Memento 4.13).
     */
    fields(): string[];

    /**
     * Поиск значений полей записей библиотеки по запросу
     * (аналогично поиску через интерфейс Memento).
     * @param query строка поиска
     */
    find(query: string): Entry[];

    /**
     * Поиск записи по её ID.
     * @param id строка, уникально идентифицирующая запись
     */
    findById(id: string): Entry | null;

    /**
     * Поиск записи по имени записи. Библиотека должна использовать
     * уникальные имена записей.
     * @param name значение(-я) поля "имя записи"
     */
    findByKey(name: string): Entry | null;

    /**
     * Получить записи библиотеки, содержащие ссылку на указанную запись.
     * @param entry запись, ссылки на которую ищутся
     */
    linksTo(entry: Entry): Entry[];

    /** Отобразить библиотеку в UI. */
    show(): void;

    /** Имя библиотеки. */
    readonly name: string;

    /** Имя библиотеки (то же, что и name). */
    readonly title: string;

    /** Идентификатор библиотеки. (Добавлено в MDB 5.5) */
    readonly id: string;
}

/** Объект записи (Entry) — позволяет читать и изменять значения полей. */
interface Entry {
    /**
     * Получить значение поля по имени. Тип результата зависит от типа поля
     * (например, для Contact — JSContact, для Location — JSGeolocation).
     * @param name имя поля
     */
    field(name: string): any;

    /**
     * Добавить связь в поле типа "Link to Entry" на запись из связанной
     * библиотеки.
     * @param name имя поля Link to Entry
     * @param entry запись из связанной библиотеки, на которую добавляется ссылка
     */
    link(name: string, entry: Entry): void;

    /**
     * Получить массив изображений, связанных с указанным полем типа Image.
     * @param name имя поля типа Image
     */
    images(name: string): EntryImage[];

    /** Пересчитать значения вычисляемых полей записи. */
    recalc(): void;

    /** Переместить запись в корзину. */
    trash(): void;

    /** Восстановить запись из корзины. */
    untrash(): void;

    /**
     * Установить значение поля по имени. Значение сразу же записывается
     * в библиотеку.
     *
     * Особые случаи:
     * - Multiple-choice List / Checkboxes — массив строк.
     * - Link to Entry — массив строк (имя записи, при необходимости —
     *   через запятую без пробела для составных имён).
     * - Link to File — массив путей к файлам.
     *
     * @param name имя поля
     * @param value значение поля
     */
    set(name: string, value: any): void;

    /** Отобразить запись в UI. */
    show(): void;

    /**
     * Удалить связь из поля типа "Link to Entry" на указанную запись.
     * @param name имя поля Link to Entry
     * @param entry запись, ссылку на которую нужно удалить
     */
    unlink(name: string, entry: Entry): void;

    /** ID пользователя, создавшего запись. */
    readonly author: string;

    /** Дата и время создания записи. */
    readonly creationTime: Date;

    /** true, если запись удалена (находится в корзине). */
    readonly deleted: boolean;

    /** Описание записи. */
    description: string;

    /** true, если запись находится в избранном. */
    favorites: boolean;

    /** Идентификатор записи. */
    readonly id: string;

    /** Дата и время последнего изменения записи. */
    readonly lastModifiedTime: Date;

    /** Имя записи. */
    name: string;

    /** Имя записи (то же, что и name). */
    readonly title: string;
}

/** Элемент, возвращаемый методом Entry.images(name). */
interface EntryImage {
    /** Подпись изображения (можно читать и устанавливать). */
    caption: string;

    /** URI (ссылка) изображения. */
    readonly uri: string;
}

/**
 * Шаблон со значениями по умолчанию для ещё не созданной записи.
 * Доступен только для события Creating an entry / фазы Opening an Entry Edit card.
 */
interface DefaultEntry {
    /**
     * Установить значение поля по умолчанию.
     * @param name имя поля
     * @param value значение поля
     */
    set(name: string, value: any): void;

    /** true, если запись создаётся как новая и пустая. */
    readonly created: boolean;

    /** true, если запись создаётся как дубликат существующей. */
    readonly duplicated: boolean;

    /** true, если запись создаётся на основе шаблона (prefilled). */
    readonly prefilled: boolean;
}

// ----------------------------------------------------------------------------
// Files — работа с файлами
// ----------------------------------------------------------------------------

/**
 * Открыть файл для чтения/записи. Если файл с указанным именем не
 * существует, он будет создан.
 * @param name имя файла в выбранной для скрипта папке
 *   (в Desktop-приложении нужно указывать полный путь к файлу)
 */
declare function file(name: string): MementoFile;

/** Объект файла, возвращаемый глобальной функцией file(). */
interface MementoFile {
    /** Закрыть файл. Впоследствии он может быть открыт снова. */
    close(): void;

    /** Получить текущий номер строки (позицию) в файле. */
    getLineNumber(): number;

    /** Прочитать все строки файла и закрыть его. */
    readAll(): string[];

    /** Прочитать следующий символ из файлового потока. */
    readChar(): string;

    /** Прочитать следующую строку из файлового потока. */
    readLine(): string;

    /** Прочитать оставшиеся строки файлового потока. */
    readLines(): string[];

    /** Записать строку(и) в файл (аргументы приводятся к строке). */
    write(...text: any[]): void;

    /** Записать строку(и) и символ новой строки в файл. */
    writeLine(...text: any[]): void;

    /** Переключить файл в режим добавления (append), не перезаписывая содержимое. */
    appendMode(): void;

    /** true, если и только если файл существует. */
    readonly exists: boolean;

    /** Длина файла в байтах, или 0, если файл не существует. */
    readonly length: number;
}

// ----------------------------------------------------------------------------
// SQL
// ----------------------------------------------------------------------------

/**
 * Выполнить SELECT SQL-запрос (диалект SQLite).
 * @param query строка с SQL SELECT запросом
 */
declare function sql(query: string): SQLResult;

/** Результат выполнения SQL-запроса. */
interface SQLResult {
    /**
     * Результат запроса в виде массива обычных JS-объектов, где ключи —
     * имена колонок.
     */
    asObjects(): Record<string, any>[];

    /**
     * Результат запроса в виде массива объектов Entry.
     * Важно: в SELECT обязательно должна присутствовать колонка id,
     * иначе записи не будут возвращены.
     */
    asEntries(): Entry[];

    /** Первая колонка первой строки результата как целое число. */
    asInt(): number;

    /** Первая колонка первой строки результата как число с плавающей точкой. */
    asDouble(): number;

    /** Первая колонка первой строки результата как строка. */
    asString(): string;
}

// ----------------------------------------------------------------------------
// HTTP
// ----------------------------------------------------------------------------

/**
 * Получить объект Http для выполнения HTTP-запросов.
 * Требования: скрипт должен выполняться асинхронно (последняя фаза события),
 * у библиотеки должно быть разрешение Network.
 */
declare function http(): Http;

/** Интерфейс для выполнения HTTP-запросов. */
interface Http {
    /**
     * Выполнить HTTP GET-запрос.
     * @param url адрес, начинающийся с http:// или https://
     */
    get(url: string): HttpResult;

    /**
     * Выполнить HTTP POST-запрос.
     * @param url адрес, начинающийся с http:// или https://
     * @param body тело POST-запроса
     */
    post(url: string, body: string): HttpResult;

    /**
     * Установить заголовки запроса.
     * @param info объект с заголовками запроса
     */
    headers(info: Record<string, string>): HttpResult;
}

/** Результат выполнения HTTP-запроса. */
interface HttpResult {
    /** Тело ответа в виде текста. */
    readonly body: string;

    /** HTTP-код ответа (обычно 200 при успехе). */
    readonly code: number;

    /**
     * Получить значение заголовка ответа по имени.
     * @param tag имя заголовка (например, "etag")
     */
    header(tag: string): string;
}

// ----------------------------------------------------------------------------
// Email
// ----------------------------------------------------------------------------

/** Получить системный объект Email для отправки сообщений. */
declare function email(): Email;

/** Объект для работы с электронной почтой. */
interface Email {
    /**
     * Отправить сообщение электронной почты.
     * @param cfg конфигурация SMTP-сервера
     * @param to адрес получателя
     * @param subject тема письма
     * @param message текст письма
     */
    send(cfg: EmailConfig, to: string, subject: string, message: string): void;
}

/** Конфигурация SMTP-сервера для отправки email. */
interface EmailConfig {
    /** SMTP-сервер. */
    host: string;

    /** Порт SMTP-сервера. */
    port: number;

    /** Имя пользователя на SMTP-сервере. */
    user: string;

    /** Пароль пользователя. */
    pass: string;

    /** Адрес отправителя (строка "From:"). */
    from: string;
}

// ----------------------------------------------------------------------------
// System / UI helpers — системные функции, диалоги, уведомления, intents
// ----------------------------------------------------------------------------

/**
 * Остановить системную операцию, вызвавшую событие (например, отменить
 * сохранение записи). Используется в фазах, предшествующих операции
 * (например, валидация данных перед сохранением).
 */
declare function cancel(): void;

/** Сгенерировать случайный текстовый идентификатор (GUID). */
declare function guid(): string;

/**
 * Создать объект Intent (обмен данными с другими приложениями).
 * Доступно только на Android.
 * @param action строка стандартного действия (например, "view", "pick")
 */
declare function intent(action: string): Intent;

/**
 * Записать строку в лог-файл скрипта.
 * @param text текст для записи в лог
 */
declare function log(text: any): void;

/**
 * Показать пользователю короткое уведомление (toast).
 * @param text текст уведомления
 */
declare function message(text: string | number | boolean): void;

/** Создать построитель (builder) диалогового окна. */
declare function dialog(): Dialog;

/** Получить информацию о системе. */
declare function system(): System;

/** подключаемый скрипт js. */
declare function moment(value?: Date | string | number): Moment;

/**
 * Создать построитель системного уведомления (Android/iOS).
 * (Функция описана в разделе Notification; добавлена для полноты API.)
 */
declare function notification(): Notification;

/** Информация о системе, на которой выполняется скрипт. */
interface System {
    /** Завершить выполнение скрипта. */
    exit(): void;

    /** Название операционной системы. */
    readonly os: string;
}
/** формат вывода даты скриптом Moment. */
interface Moment {

    format(value?: any): string;


}

/**
 * Построитель диалогового окна.
 *
 * Пример:
 * ```
 * dialog()
 *   .title("Заголовок")
 *   .text("Текст сообщения")
 *   .positiveButton("OK", () => { ... })
 *   .show();
 * ```
 */
interface Dialog {
    /** Установить заголовок диалога. */
    title(text: string): Dialog;

    /** Установить основной текст диалога. */
    text(text: string): Dialog;

    /**
     * Установить кастомный UI-объект в качестве содержимого диалога.
     * @param uiObject UI-объект (см. Memento JavaScript UI)
     */
    view(uiObject: any): Dialog;

    /**
     * Настроить положительную кнопку.
     * @param text текст кнопки
     * @param onClick обработчик нажатия
     */
    positiveButton(text: string, onClick: () => void | boolean): Dialog;

    /**
     * Настроить отрицательную кнопку.
     * @param text текст кнопки
     * @param onClick обработчик нажатия
     */
    negativeButton(text: string, onClick: () => void | boolean): Dialog;

    /**
     * Настроить нейтральную кнопку.
     * @param text текст кнопки
     * @param onClick обработчик нажатия
     */
    neutralButton(text: string, onClick: () => void | boolean): Dialog;

    /**
     * Задать автоматическое закрытие диалога по нажатию любой кнопки.
     * Если false — диалог закроется только когда обработчик кнопки
     * вернёт true.
     */
    autoDismiss(value: boolean): Dialog;

    /** Показать сконструированный диалог. */
    show(): void;
}

/**
 * Построитель системного уведомления.
 *
 * Пример:
 * ```
 * notification()
 *   .title("Заголовок")
 *   .text("Текст")
 *   .show();
 * ```
 */
interface Notification {
    /** Установить ID уведомления (для последующего обновления/замены). */
    id(value: number): Notification;

    /** Установить заголовок уведомления (обязательно). */
    title(text: string): Notification;

    /** Установить основной текст уведомления (обязательно). */
    text(text: string): Notification;

    /** Установить развёрнутый текст уведомления. */
    bigText(text: string): Notification;

    /** Установить маленькую иконку уведомления. */
    smallIcon(iconCode: any): Notification;

    /**
     * Установить большую иконку уведомления.
     * Можно передать код иконки, URL изображения, либо значение поля
     * типа Image.
     */
    largeIcon(iconCodeOrImageUrl: any): Notification;

    /** Уведомление сработает (звук/вибрация) только один раз. */
    alertOnce(): Notification;

    /** Показать сконструированное уведомление. */
    show(): void;
}

/** Объект обмена данными с другими приложениями (Android only). */
interface Intent {
    /**
     * Определить URI данных, к которым будет применено действие.
     * @param uri URI (ID контакта, путь к файлу, номер телефона и т.п.)
     */
    data(uri: string): Intent;

    /**
     * Определить дополнительные данные в виде пары ключ-значение.
     * @param key ключ
     * @param value значение
     */
    extra(key: string, value: any): Intent;

    /**
     * Определить дополнительные данные типа Long в виде пары ключ-значение.
     * @param key ключ
     * @param value значение (число)
     */
    extraLong(key: string, value: number): Intent;

    /**
     * Определить MIME-тип данных.
     * @param mime MIME-тип
     */
    mimeType(mime: string): Intent;

    /** Отправить сообщение (запустить действие). */
    send(): void;
}

// ----------------------------------------------------------------------------
// Built-in objects for certain field types — встроенные объекты для полей
// ----------------------------------------------------------------------------

/**
 * Объект, возвращаемый Entry.field(name) для полей типа Contact.
 * Если поле содержит несколько контактов — используйте hasNext / next.
 */
interface JSContact {
    /** Позвонить на основной номер телефона контакта (только на телефоне). */
    call(): void;

    /**
     * Отправить email на основной адрес контакта.
     * @param subject тема письма
     * @param message текст письма
     */
    sendEmail(subject: string, message: string): void;

    /**
     * Отправить SMS на основной номер телефона контакта (только на телефоне).
     * @param message текст сообщения
     */
    sendSMS(message: string): void;

    /** Открыть приложение "Контакты" для этого контакта. */
    show(): void;

    /** Основной email-адрес контакта. */
    readonly email: string;

    /** Полное имя контакта. */
    readonly fullName: string;

    /** true, если есть следующий объект JSContact. */
    readonly hasNext: boolean;

    /** Следующий объект JSContact, если есть. */
    readonly next: JSContact | null;

    /** Основной номер телефона контакта. */
    readonly phone: string;
}

/**
 * Объект, возвращаемый Entry.field(name) для полей типа Location.
 * Если поле содержит несколько локаций — используйте hasNext / next.
 */
interface JSGeolocation {
    /** Адрес данной локации. */
    readonly address: string;

    /** true, если есть следующий объект JSGeolocation. */
    readonly hasNext: boolean;

    /** Широта. */
    readonly lat: number;

    /** Долгота. */
    readonly lng: number;

    /** Следующий объект JSGeolocation, если есть. */
    readonly next: JSGeolocation | null;
}
