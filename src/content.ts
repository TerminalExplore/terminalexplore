export type Lang = "ru" | "en";

export interface Content {
  nav: {
    brand: string;
    links: { id: string; label: string }[];
    login: string;
    signup: string;
    lang: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    right: string;
    cta: string;
  };
  integration: {
    tag: string;
    heading: string;
    desc: string;
    ctaPrimary: string;
    ctaSecondary: string;
    install: string;
    tabs: { name: string; active?: boolean }[];
    code: { cls: string; text: string }[][];
  };
  performance: {
    tag: string;
    heading: string;
    items: { title: string; desc: string }[];
    termTitle: string;
    termHeader: string[];
    rows: { region: string; name: string; latency: string }[];
    stats: { label: string; value: string }[];
  };
  features: {
    tag: string;
    heading: string;
    cards: {
      num: string;
      icon: "terminal" | "pulse" | "gear" | "globe";
      title: string;
      desc: string;
      tags: string[];
    }[];
  };
  blog: {
    tag: string;
    heading: string;
    posts: {
      title: string;
      excerpt: string;
      date: string;
      read: string;
      tag: string;
    }[];
  };
  cta: {
    badge: string;
    heading: string;
    desc: string;
    button: string;
  };
  pages: Record<string, { title: string; body: string }>;
  footer: {
    columns: { title: string; links: { label: string; href: string }[] }[];
    brand: string;
    copyright: string;
    credit: string;
    creditUrl: string;
  };
}

const codeLines: { cls: string; text: string }[][] = [
  [
    { cls: "ln", text: " 1" },
    { cls: "cmt", text: "# infrastructure.ts" },
  ],
  [
    { cls: "ln", text: " 2" },
    { cls: "kw", text: "import" },
    { cls: "text", text: " { Infra } " },
    { cls: "kw", text: "from" },
    { cls: "str", text: " '@tmxpl/core'" },
    { cls: "text", text: ";" },
  ],
  [
    { cls: "ln", text: " 3" },
    { cls: "", text: "" },
  ],
  [
    { cls: "ln", text: " 4" },
    { cls: "kw", text: "const" },
    { cls: "fn", text: " stack" },
    { cls: "text", text: " = " },
    { cls: "fn", text: "Infra" },
    { cls: "text", text: ".define({" },
  ],
  [
    { cls: "ln", text: " 5" },
    { cls: "var", text: "  proxy" },
    { cls: "text", text: ":  " },
    { cls: "fn", text: "tunnel" },
    { cls: "text", text: "({ " },
    { cls: "var", text: "rotation" },
    { cls: "text", text: ": " },
    { cls: "val", text: "true" },
    { cls: "text", text: " })," },
  ],
  [
    { cls: "ln", text: " 6" },
    { cls: "var", text: "  bots" },
    { cls: "text", text: ":   " },
    { cls: "fn", text: "gateway" },
    { cls: "text", text: "({ " },
    { cls: "var", text: "selfHeal" },
    { cls: "text", text: ": " },
    { cls: "val", text: "true" },
    { cls: "text", text: " })," },
  ],
  [
    { cls: "ln", text: " 7" },
    { cls: "var", text: "  watch" },
    { cls: "text", text: ":  " },
    { cls: "fn", text: "monitor" },
    { cls: "text", text: "({ " },
    { cls: "var", text: "mtr" },
    { cls: "text", text: ": " },
    { cls: "val", text: "true" },
    { cls: "text", text: " })," },
  ],
  [
    { cls: "ln", text: " 8" },
    { cls: "var", text: "  deploy" },
    { cls: "text", text: ": " },
    { cls: "fn", text: "ci" },
    { cls: "text", text: "({ " },
    { cls: "var", text: "atomic" },
    { cls: "text", text: ": " },
    { cls: "val", text: "true" },
    { cls: "text", text: " })," },
  ],
  [
    { cls: "ln", text: " 9" },
    { cls: "text", text: "});" },
  ],
];

export const content: Record<Lang, Content> = {
  ru: {
    nav: {
      brand: "TerminalExplore",
      links: [
        { id: "integration", label: "Стек" },
        { id: "performance", label: "Результаты" },
        { id: "blog", label: "Блог" },
        { id: "features", label: "Услуги" },
      ],
      login: "Войти",
      signup: "Связаться",
      lang: "EN",
    },
    hero: {
      eyebrow: "TerminalExplore - code + infra",
      title: "Веб-проекты<br/>на проде",
      right:
        "Проектирую веб-сервисы и держу инфраструктуру в рабочем состоянии: фронтенд, API, CI/CD, мониторинг, сети, прокси и боты.",
      cta: "Смотреть услуги",
    },
    integration: {
      tag: "СТЕК",
      heading: "Инструменты, которые выдерживают каждый день",
      desc:
        "TypeScript, React, Node.js, Docker и Linux. Собираю интерфейс, API и окружение так, чтобы проект можно было развивать, запускать и поддерживать без хаоса.",
      ctaPrimary: "Обсудить проект",
      ctaSecondary: "Кейсы",
      install: "# добавить в проект",
      tabs: [
        { name: "infrastructure.ts", active: true },
        { name: "docker-compose.yml" },
        { name: "deploy.sh" },
      ],
      code: codeLines,
    },
    performance: {
      tag: "РЕЗУЛЬТАТЫ",
      heading: "Собрано для нагрузки и поддержки",
      items: [
        {
          title: "Отказоустойчивость",
          desc: "Сервисы запускаются в контейнерах, хранят данные отдельно и не зависят от ручных действий после рестарта.",
        },
        {
          title: "Масштабирование",
          desc: "Архитектура разделяет статический сайт, API и базу данных, чтобы каждую часть можно было развивать независимо.",
        },
        {
          title: "Мониторинг 24/7",
          desc: "Метрики, health-checks и понятные статусы помогают быстро увидеть, где именно возникла проблема.",
        },
        {
          title: "Атомарный деплой",
          desc: "Сборка фронтенда и запуск API описаны явно, поэтому релиз повторяем и не зависит от локальной машины.",
        },
      ],
      termTitle: "system.monitor",
      termHeader: ["РЕГИОН", "ЗАДЕРЖКА", "СТАТУС"],
      rows: [
        { region: "RU", name: "Москва", latency: "4ms" },
        { region: "EU", name: "Франкфурт", latency: "11ms" },
        { region: "EU", name: "Варшава", latency: "18ms" },
        { region: "AP", name: "Токио", latency: "32ms" },
      ],
      stats: [
        { label: "UPTIME", value: "99.9%" },
        { label: "ALERTS", value: "0" },
        { label: "ERRORS", value: "0.0%" },
      ],
    },
    features: {
      tag: "УСЛУГИ",
      heading: "Что я делаю",
      cards: [
        {
          num: "01",
          icon: "terminal",
          title: "Веб-разработка",
          desc: "React, TypeScript, Node.js и API. От прототипа до понятного интерфейса и стабильного бэкенда.",
          tags: ["React", "TypeScript", "Node.js"],
        },
        {
          num: "02",
          icon: "gear",
          title: "DevOps и CI/CD",
          desc: "Docker, Compose, пайплайны, окружения и предсказуемые релизы без ручной магии.",
          tags: ["Docker", "CI/CD", "Linux"],
        },
        {
          num: "03",
          icon: "pulse",
          title: "Мониторинг",
          desc: "Health-checks, метрики, алерты и диагностика, которые помогают реагировать до пожара.",
          tags: ["Grafana", "MTR", "Prometheus"],
        },
        {
          num: "04",
          icon: "globe",
          title: "Сети и боты",
          desc: "Прокси, туннели, Telegram/Discord-боты и устойчивые связки для нестабильных сетей.",
          tags: ["Proxy", "VPN", "Bots"],
        },
      ],
    },
    blog: {
      tag: "БЛОГ",
      heading: "Заметки о разработке и DevOps",
      posts: [],
    },
    cta: {
      badge: "Доступен для проектов",
      heading: "Есть задача?",
      desc: "Напишите в Telegram - обсудим проект, стек, сроки и самый спокойный путь к запуску.",
      button: "Написать в Telegram",
    },
    pages: {
      cases: {
        title: "Кейсы",
        body:
          "Раздел готовится. Здесь появятся разобранные проекты: контейнеризация сервисов, устойчивые сетевые связки, мониторинг и автоматизация релизов.",
      },
      status: {
        title: "Статус",
        body:
          "Здесь будет статус инфраструктуры: uptime сервисов, задержки по регионам и последние инциденты.",
      },
      privacy: {
        title: "Конфиденциальность",
        body:
          "Сайт не собирает персональные данные без необходимости. Если появятся формы, аналитика или интеграции, правила обработки будут описаны на этой странице.",
      },
      terms: {
        title: "Условия",
        body:
          "Общие условия сотрудничества фиксируются до начала работ: объем, сроки, стоимость и критерии готовности. Детали подтверждаются в личной переписке.",
      },
    },
    footer: {
      columns: [
        {
          title: "Услуги",
          links: [
            { label: "Стек", href: "#integration" },
            { label: "Результаты", href: "#performance" },
            { label: "Услуги", href: "#features" },
          ],
        },
        {
          title: "Ресурсы",
          links: [
            { label: "Блог", href: "/blog" },
            { label: "Кейсы", href: "/cases" },
            { label: "Статус", href: "/status" },
          ],
        },
        {
          title: "Контакты",
          links: [
            { label: "Telegram", href: "https://t.me/TerExpBot" },
            { label: "tmxpl@authecode.ru", href: "mailto:tmxpl@authecode.ru" },
            { label: "GitHub", href: "https://github.com/TerminalExplore" },
          ],
        },
        {
          title: "Правовое",
          links: [
            { label: "Конфиденциальность", href: "/privacy" },
            { label: "Условия", href: "/terms" },
          ],
        },
      ],
      brand: "TerminalExplore",
      copyright: `© ${new Date().getFullYear()} TerminalExplore.`,
      credit: "ASCII art powered by",
      creditUrl: "https://asciify.org",
    },
  },
  en: {
    nav: {
      brand: "TerminalExplore",
      links: [
        { id: "integration", label: "Stack" },
        { id: "performance", label: "Results" },
        { id: "blog", label: "Blog" },
        { id: "features", label: "Services" },
      ],
      login: "Log in",
      signup: "Get in touch",
      lang: "RU",
    },
    hero: {
      eyebrow: "TerminalExplore - code + infra",
      title: "Web projects<br/>in production",
      right:
        "I build web services and keep infrastructure healthy: frontend, APIs, CI/CD, monitoring, networks, proxies and bots.",
      cta: "View services",
    },
    integration: {
      tag: "STACK",
      heading: "Tools that hold up in production",
      desc:
        "TypeScript, React, Node.js, Docker and Linux. I connect product UI, backend APIs and runtime infrastructure into one maintainable system.",
      ctaPrimary: "Discuss a project",
      ctaSecondary: "Cases",
      install: "# add to your project",
      tabs: [
        { name: "infrastructure.ts", active: true },
        { name: "docker-compose.yml" },
        { name: "deploy.sh" },
      ],
      code: codeLines,
    },
    performance: {
      tag: "RESULTS",
      heading: "Built for load and support",
      items: [
        {
          title: "Fault tolerance",
          desc: "Services run in containers, store data outside the image and recover cleanly after restarts.",
        },
        {
          title: "Scalable structure",
          desc: "Static site, API and persistent data are separated so each layer can evolve independently.",
        },
        {
          title: "24/7 monitoring",
          desc: "Health checks, metrics and clear status signals make problems easier to spot and fix.",
        },
        {
          title: "Repeatable deploys",
          desc: "Frontend builds and API runtime are described explicitly, so releases do not depend on a local machine.",
        },
      ],
      termTitle: "system.monitor",
      termHeader: ["REGION", "LATENCY", "STATUS"],
      rows: [
        { region: "RU", name: "Moscow", latency: "4ms" },
        { region: "EU", name: "Frankfurt", latency: "11ms" },
        { region: "EU", name: "Warsaw", latency: "18ms" },
        { region: "AP", name: "Tokyo", latency: "32ms" },
      ],
      stats: [
        { label: "UPTIME", value: "99.9%" },
        { label: "ALERTS", value: "0" },
        { label: "ERRORS", value: "0.0%" },
      ],
    },
    features: {
      tag: "SERVICES",
      heading: "What I do",
      cards: [
        {
          num: "01",
          icon: "terminal",
          title: "Web development",
          desc: "React, TypeScript, Node.js and APIs. From prototype to clear UI and stable backend.",
          tags: ["React", "TypeScript", "Node.js"],
        },
        {
          num: "02",
          icon: "gear",
          title: "DevOps and CI/CD",
          desc: "Docker, Compose, pipelines, environments and predictable releases without manual rituals.",
          tags: ["Docker", "CI/CD", "Linux"],
        },
        {
          num: "03",
          icon: "pulse",
          title: "Monitoring",
          desc: "Health checks, metrics, alerts and diagnostics that help teams react before incidents grow.",
          tags: ["Grafana", "MTR", "Prometheus"],
        },
        {
          num: "04",
          icon: "globe",
          title: "Networking and bots",
          desc: "Proxies, tunnels, Telegram/Discord bots and reliable links for unreliable networks.",
          tags: ["Proxy", "VPN", "Bots"],
        },
      ],
    },
    blog: {
      tag: "BLOG",
      heading: "Notes on development and DevOps",
      posts: [],
    },
    cta: {
      badge: "Available for projects",
      heading: "Have a task?",
      desc: "Message me on Telegram - we will discuss the project, stack, timeline and the calmest path to launch.",
      button: "Message on Telegram",
    },
    pages: {
      cases: {
        title: "Cases",
        body:
          "This section is in progress. It will include project breakdowns: containerized services, resilient networking, monitoring and release automation.",
      },
      status: {
        title: "Status",
        body:
          "Infrastructure status will live here: service uptime, per-region latency and recent incidents.",
      },
      privacy: {
        title: "Privacy",
        body:
          "The site does not collect personal data unless it is needed. If forms, analytics or integrations are added, this page will describe how data is handled.",
      },
      terms: {
        title: "Terms",
        body:
          "Scope, timeline, price and acceptance criteria are agreed before work starts. Details are confirmed in private communication.",
      },
    },
    footer: {
      columns: [
        {
          title: "Services",
          links: [
            { label: "Stack", href: "#integration" },
            { label: "Results", href: "#performance" },
            { label: "Services", href: "#features" },
          ],
        },
        {
          title: "Resources",
          links: [
            { label: "Blog", href: "/blog" },
            { label: "Cases", href: "/cases" },
            { label: "Status", href: "/status" },
          ],
        },
        {
          title: "Contact",
          links: [
            { label: "Telegram", href: "https://t.me/TerExpBot" },
            { label: "tmxpl@authecode.ru", href: "mailto:tmxpl@authecode.ru" },
            { label: "GitHub", href: "https://github.com/TerminalExplore" },
          ],
        },
        {
          title: "Legal",
          links: [
            { label: "Privacy", href: "/privacy" },
            { label: "Terms", href: "/terms" },
          ],
        },
      ],
      brand: "TerminalExplore",
      copyright: `© ${new Date().getFullYear()} TerminalExplore.`,
      credit: "ASCII art powered by",
      creditUrl: "https://asciify.org",
    },
  },
};
