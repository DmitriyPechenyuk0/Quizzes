# Project "Quizzes" | Проєкт "Quizzes"

## __Purpose of the Project__ | __Мета створення проєкту__

The goal of the project is to reinforce knowledge after the AI intensive and practice with CSS and HTML.<br> <br>Ціль проєкту — закріпити знання після інтенсиву з штучного інтелекту та попрактикуватися з CSS і HTML.

## __Plan-navigation for README__ | __План-навігація по README__
* [Purpose of the Project | Мета створення проєкту](#purpose-of-the-project--мета-створення-проєкту)<br>
* [Team members | Склад команди](#team-members--склад-команди)<br>
* [Project structure | Структура проєкту](#project-structure--структура-проєкту)<br>
* [Project design | Дизайн проєкту](#project-design--дизайн-проєкту)<br>
* [Explanation of application specifications | Пояснення специфікації застосунків](#explanation-of-application-specifications--пояснення-специфікації-застосунків)<br>
* [Project installation guide | Інструкція до встановлення проєкту](#project-installation-guide--інструкція-до-встановлення-проєкту)<br>
* [Сonclusion | Висновок](#conclusion--висновок)<br>

## __Team members__ | __Склад команди__
[Дмитро Печенюк](https://github.com/DmitriyPechenyuk0) - Тім лід  
[Віктор Горюнов](https://github.com/iv1teq)  
[Тимофій Рассоленко](https://github.com/TimofeyRas)  
[Никита Годований](https://github.com/Nikita-Hodovanyj)  
[Кирило Харлан](https://github.com/KirillKharlan)   
[Артем Власов](https://github.com/ArtemVlasov2009)  

## __Project structure__ | __Структура проєкту__

https://www.figma.com/board/sQZvPAayhwa3TmFQoXvf4z/Web-app?node-id=0-1&p=f

## __Project design__ | __Дизайн проєкту__

https://www.figma.com/design/YzImPm9jOsLFq1Hr3ium2P/Quizzes?node-id=0-1&p=f

## __Explanation of application specifications.__ | __Пояснення специфікації застосунків__

<details>
  <summary><strong>New_Quiz_App</strong></summary>

  ---
  #### EN
  > __New_Quiz_App__ – This is the main app in the project. It handles the core project configurations.
  ---
  #### UA
  > __New_Quiz_App__ – це головний застосунок у проєкті. Саме в цьому застосунку здійснюються основні налаштування проєкту.
  ---
</details>

<details>
  <summary><strong>home_app</strong></summary>

  ---
  #### EN
  > __home_app__ – This app is responsible for displaying and configuring the homepage.
  ---
  #### UA
  > __home_app__ – цей застосунок відповідає за відображення та налаштування головної сторінки.
  ---
</details>

<details>
  <summary><strong>profile</strong></summary>

  ---
  #### EN
  > __profile__ – This app is responsible for account creation, authentication, and logout. Additionally, this app includes the Profile model, which handles table creation in the database.
  ---
  #### UA
  > __profile__ – цей застосунок відповідає за створення акаунта, авторизацію, а також вихід із нього. Крім того, у цьому застосунку створено модель Profile, яка відповідає за створення таблиці в БД.
  ---
</details>

<details>
  <summary><strong>contact_app</strong></summary>

  ---
  #### EN
  > __contact_app__ – This app is responsible for displaying and configuring the contacts page, as well as sending feedback via email.
  ---
  #### UA
  > __contact_app__ – цей застосунок відповідає за відображення та налаштування сторінки контактів, а також за надсилання відгуків на пошту.
  ---
</details>

<details>
  <summary><strong>managesub_app</strong></summary>

  ---
  #### EN
  > __managesub_app__ – this app is responsible for displaying and configuring the subscription settings page. It also includes the main logic for changing subscriptions. There are two types of subscriptions, divided into monthly and one-time purchases.  
  > Monthly subscriptions include Free, Standard, and Pro. The one-time purchase subscription is Commerce. A user can have both types of subscriptions simultaneously.  
  > With a monthly subscription, the user can create QR codes only with a link, and their validity period is 30 days.  
  > With a one-time purchase subscription, the user can create QR codes only with text, and their validity period is unlimited.  
  ---
  #### UA
  > __managesub_app__  – цей застосунок відповідає за відображення та налаштування сторінки налаштування підписки. Також у ньому прописана основна логіка зміни підписок. Є два типи підписок, які поділяються на щомісячні та одноразову покупку. Щомісячні підписки – це Free, Standard, Pro. Одноразово-купівельна підписка – це Commerce. Користувач може мати одночасно два типи підписки. З щомісячною підпискою користувач може створювати QR-коди тільки з посиланням, і їх строк придатності – 30 днів. З одноразово-купівельною підпискою користувач може створювати QR-коди тільки з текстом, і їх строк придатності – безмежний.
  ---

</details>

<details>
  <summary><strong>createqr_app</strong></summary>

  ---
  #### EN
  > __createqr_app__ – this app is responsible for displaying and configuring the QR code creation page. It also includes the logic for customizing QR codes.<br>
  >* If the user has a Free subscription, only basic color changes and the ability to create one QR code are available.
  >* If the user has a Standard subscription, they can create up to 10 QR codes with a logo in the center and color customization.
  >* If the user has a Pro subscription, they can create up to 100 QR codes with color customization, shape modification, and logo addition.
  >* If the user has a Commerce subscription, they can only customize the color of QR codes. If they want to change the shape or add a logo, they need to purchase the corresponding monthly subscription.
  ---
  #### UA
  > __createqr_app__ – цей застосунок відповідає за відображення та налаштування сторінки створення QR-кодів. Також у ньому прописана логіка кастомізації QR-кодів.<br>
  >* Якщо користувач має підписку Free, йому доступна лише базова зміна кольору та можливість створення одного QR-коду.
  >* Якщо користувач має підписку Standard, він може створювати до 10 QR-кодів із логотипом у центрі та кастомізацією кольору.
  >* Якщо користувач має підписку Pro, він може створювати до 100 QR-кодів із кастомізацією кольору, зміною форми квадратів та додаванням логотипа.
  >* Якщо користувач має підписку Commerce, він може створювати QR-коди лише з кастомізацією кольору. Якщо ж він хоче змінити форму або додати логотип, йому потрібно придбати відповідну щомісячну підписку.
  ---

</details>

<details>
  <summary><strong>yourqr_app</strong></summary>

  ---
  #### EN
  > __yourqr_app__ – This app is responsible for displaying and configuring the page for tracking created QR codes.
  ---
  #### UA
  > __yourqr_app__ Цей застосунок відповідає за відображення та налаштування сторінки відстежування створених QR кодів
  ---
</details>

## __Project installation guide__ | __Інструкція до встановлення проєкту__

> [!NOTE]
> The installation guide for Linux is intended for Ubuntu. The installation process may differ for other Linux distributions.
> 
> Інструкція з установлення для Linux призначена для Ubuntu. Процес встановлення може відрізнятися в інших дистрибутивах Linux.
<details>
  <summary><strong>For Linux</strong></summary>
  
  #### EN
  
  * **Step 1**: Open terminal

  * **Step 2**: Update the packages 
  ```sh
  sudo apt update
  ```

  * **Step 3**: Install Python 
  ```sh
  sudo apt install python3
  ```  

  * **Step 4**: Install pip (package manager for Python)
  ```sh
  sudo apt install python3-pip
  ```

  * **Step 5**: Install Git
  ```sh
  sudo apt install git
  ```

  * **Step 6**: Install VSCode:
  ```sh
  sudo apt install software-properties-common && sudo add-apt-repository "deb [arch=amd64] https://packages.microsoft.com/repos/vscode stable main" && curl https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > /usr/share/keyrings/microsoft-archive-keyring.gpg && sudo apt update && sudo apt install code
  ```

  * **Step 7**: Open Visual Studio Code, select the folder where you want to run the project through the navigation menu `File -> Open Folder`.

  * **Step 8**: Use the shortcut <kbd>Ctrl</kbd> + <kbd>~</kbd> to open the terminal menu and select 'Git Bash'.

  * **Step 9**: Copy the command below into the Git terminal:
  ```sh
  git clone https://github.com/DmitriyPechenyuk0/QRLogic.git
  ```

  * **Step 10**: Create a new Power Shell terminal, then copy and run:
  ```sh
  python3 -m venv QRLogic/venv && cd QRLogic/venv/bin && source activate && cd ../.. && pip3 install -r requirements.txt && python3 QRLogic/manage.py runserver
  ```

---

  #### UA

  * **Крок 1**: Відкрити термінал
  * **Крок 2**: Оновити пакети
  ```sh
  sudo apt update
  ```
  * **Крок 3**: Встановити Python
  ```sh
  sudo apt install python3
  ```  
  * **Крок 4**: Встановити pip (пакетний менеджер у Python)
  ```sh
  sudo apt install python3-pip
  ```
  * **Крок 5**: Встановити Git
  ```sh
  sudo apt install git
  ```
  * **Крок 6**: Встановити VSCode
  ```sh
  sudo apt install software-properties-common && sudo add-apt-repository "deb [arch=amd64] https://packages.microsoft.com/repos/vscode stable main" && curl https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > /usr/share/keyrings/microsoft-archive-keyring.gpg && sudo apt update && sudo apt install code
  ```

  * **Крок 7**: Відкрийте Visual Studio Code, виберіть папку, в якій хочете запустити проєкт, через навігаційне меню `File -> Open Folder`.

  * **Крок 8**: Скористайтеся комбінацією клавіш <kbd>Ctrl</kbd> + <kbd>~</kbd>, щоб відкрити меню терміналів, і виберіть "Git Bash".

  * **Крок 9**: Скопіюйте команду у Git-термінал:
  ```sh
  git clone https://github.com/DmitriyPechenyuk0/QRLogic.git
  ```

  * **Крок 10**: Створіть новий термінал Power Shell і виконайте:
  ```sh
  python3 -m venv QRLogic/venv && cd QRLogic/venv/bin && source activate && cd ../.. && pip3 install -r requirements.txt && python3 QRLogic/manage.py runserver
  ```

</details>
<details>
  <summary><strong>For Windows</strong></summary>

  #### EN

  * **Step 1**: Download and install Python: Go to the official website [python.org](https://www.python.org/) and download the latest version of Python for your operating system. Make sure to check the 'Add Python to PATH' option during the installation.

  * **Step 2**: Download and install Git: Go to the official website [git-scm.com](https://git-scm.com/) and download the latest version of Git for your operating system.

  * **Step 3**: Install Visual Studio Code from the official website: [https://code.visualstudio.com/](https://code.visualstudio.com/)

  * **Step 4**: Open Visual Studio Code, select the folder where you want to run the project through the navigation menu `File -> Open Folder`.

  * **Step 5**: Use the shortcut <kbd>Ctrl</kbd> + <kbd>~</kbd> to open the terminal menu and select 'Git Bash'.

  * **Step 6**: Copy the command below into the Git terminal:
    ```sh
    git clone https://github.com/DmitriyPechenyuk0/QRLogic.git
    ```

  * **Step 7**: Create a new Command Prompt terminal, then copy and run:
    ```sh
    python -m venv QRLogic/venv && cd QRLogic/venv/Scripts && activate.bat && cd ../.. && pip install -r requirements.txt && python QRLogic/manage.py runserver
    ```

  ---

  #### UA

  * **Крок 1**: Завантажте та встановіть Python: Перейдіть на офіційний сайт [python.org](https://www.python.org/) і завантажте останню версію Python для вашої операційної системи. Під час встановлення обов’язково відзначте опцію "Add Python to PATH".

  * **Крок 2**: Завантажте та встановіть Git: Перейдіть на офіційний сайт [git-scm.com](https://git-scm.com/) і завантажте останню версію Git для вашої операційної системи.

  * **Крок 3**: Встановіть Visual Studio Code з офіційного сайту: [https://code.visualstudio.com/](https://code.visualstudio.com/)

  * **Крок 4**: Відкрийте Visual Studio Code, виберіть папку, в якій хочете запустити проєкт, через навігаційне меню `File -> Open Folder`.

  * **Крок 5**: Скористайтеся комбінацією клавіш <kbd>Ctrl</kbd> + <kbd>~</kbd>, щоб відкрити меню терміналів, і виберіть "Git Bash".

  * **Крок 6**: Скопіюйте команду у Git-термінал:
    ```sh
    git clone https://github.com/DmitriyPechenyuk0/QRLogic.git
    ```

  * **Крок 7**: Створіть новий термінал Command Prompt і виконайте:
    ```sh
    python -m venv QRLogic/venv && cd QRLogic/venv/Scripts && activate.bat && cd ../.. && pip install -r requirements.txt && python QRLogic/manage.py runserver
    ```
</details>

## __Conclusion__ | __Висновок__

### UA

Цей проект став для нас важливим етапом у вивченні Django та веб-розробки загалом. У процесі роботи ми освоїли основи роботи з медіафайлами в Django, навчились створювати та налаштовувати зв'язки між моделями у базі даних, а також інтегрувати сторонні модулі, зокрема qrcode для генерації кодів.

Окрему увагу було приділено розробці інтерфейсу користувача. Для цього ми використовували Figma, що дозволило нам спроєктувати зручний та інтуїтивно зрозумілий UX/UI дизайн. Ми навчилися правильно структурувати проєкт, розділяти його на логічні частини, а також використовувати сучасні підходи до розробки.

Окрім цього, ми значно покращили свої навички роботи з Git, навчились ефективно використовувати систему контролю версій для спільної розробки, створення гілок та управління змінами в коді.

Цей досвід став для нас цінним, оскільки дав змогу застосувати отримані знання на практиці та зрозуміти, як працювати з Django у реальних проєктах. Ми отримали навички командної роботи, покращили свої знання у створенні веб-застосунків та підготовці їх до реального використання.


#### Труднощі розробки:

Під час роботи над проєктом виникли певні проблеми. Одним із головних було некорректне створення qr кодів з зміненою формою та кольором. Це спричинило певні проблеми з відображанням їх на сторінках, що ускладнило процес розробки. На подолання цієї проблеми було витрачено багато часу, що значно загальмувало розвиток проєкту. Також довелося глибше вивчити модуль qrcode, що виявилося корисним для подальшого розвитку.

#### Подальші перспективи проєкту:
  * Оптимізувати роботу додатку createqr_app для більш ефективної роботи.
  * Покращити дизайн та UX для зручнішої взаємодії користувачів.
  * Додати оплату підписок через банкінг-сервіси
  * Переробити усі post форми у проєкті на Django Forms за для більшої безпеки
  * Додати підтримку двофакторної автентифікації.

  Ці підходи не були реалізовані в проєкті, оскільки спочатку його не планували розгортати на хості для безперервної роботи 24/7.

---

### EN

This project has been an important milestone in our study of Django and web development in general. During the development process, we learned the basics of working with media files in Django, how to create and configure relationships between database models, and how to integrate third-party modules, including qrcode for code generation.

Special attention was given to user interface development. We used Figma for this purpose, which allowed us to design a convenient and intuitive UX/UI. We learned how to properly structure a project, break it down into logical parts, and apply modern development approaches.

Additionally, we significantly improved our Git skills, learning how to effectively use version control for collaborative development, branch creation, and code management.

This experience has been valuable, as it allowed us to apply our knowledge in practice and understand how to work with Django in real-world projects. We gained teamwork skills, improved our knowledge of web application development, and learned how to prepare them for real-world use.

#### Development Challenges:

During the project, we encountered certain issues. One of the main challenges was the incorrect generation of QR codes with modified shapes and colors. This caused display problems on pages, making the development process more difficult. A significant amount of time was spent overcoming this issue, which considerably slowed down the project's progress. Additionally, we had to dive deeper into the qrcode module, which turned out to be beneficial for further development.

#### Future prospects of the project:
  * Optimize the createqr_app application for better efficiency.
  * Improve the design and UX for a more user-friendly experience.
  * Add subscription payments via banking services.
  * Convert all post forms in the project to Django Forms for better security.
  * Implement support for two-factor authentication.
