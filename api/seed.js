const bcrypt = require("bcryptjs");
const db = require("./src/db");
const { slugify } = require("./src/utils");

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

(async () => {
  if (ADMIN_EMAIL && ADMIN_PASSWORD) {
    if (ADMIN_PASSWORD.length < 12) {
      throw new Error("ADMIN_PASSWORD must be at least 12 characters");
    }

    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(ADMIN_EMAIL.toLowerCase());
    if (!existing) {
      const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
      db.prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)").run(ADMIN_EMAIL.toLowerCase(), hash);
      console.log("created admin user:", ADMIN_EMAIL.toLowerCase());
    } else {
      console.log("admin user already exists:", ADMIN_EMAIL.toLowerCase());
    }
  } else {
    console.log("ADMIN_EMAIL and ADMIN_PASSWORD are not set; skipped admin creation");
  }

  const count = db.prepare("SELECT count(*) c FROM posts").get().c;
  if (count > 0) {
    console.log("posts already seeded:", count);
    return;
  }

  const posts = [
    {
      title: "Как контейнеризировать небольшой fullstack-проект",
      excerpt:
        "Разделяем статику, API и данные, добавляем health-checks и получаем повторяемый запуск через Docker Compose.",
      content:
        "## Задача\n\nНужно запустить сайт и API так, чтобы проект одинаково работал локально и на сервере.\n\n## Решение\n\nФронтенд собирается в статические файлы, nginx отдаёт сайт и проксирует `/api`, а Node.js API хранит SQLite-базу в отдельном volume.\n\n## Итог\n\nПроект запускается одной командой, данные переживают пересборку образов, а секреты передаются через переменные окружения.",
      tag: "docker",
      cover_url: "",
      seo_title: "Контейнеризация fullstack-проекта",
      seo_description: "Как запустить Vite, nginx, Express и SQLite через Docker Compose.",
      published: 1,
    },
    {
      title: "Почему health-check важен даже для маленького API",
      excerpt:
        "Простой endpoint `/health` помогает понять, жив ли процесс и доступна ли база данных.",
      content:
        "## Проблема\n\nБез health-check контейнер может считаться запущенным, хотя приложение уже не отвечает или потеряло доступ к базе.\n\n## Подход\n\nAPI проверяет простой запрос к SQLite и возвращает понятный JSON-статус.\n\n## Польза\n\nОркестратор, прокси или администратор видят реальное состояние сервиса, а не только факт запущенного процесса.",
      tag: "ops",
      cover_url: "",
      seo_title: "Health-check для API",
      seo_description: "Зачем небольшому API endpoint состояния и что он должен проверять.",
      published: 1,
    },
  ];

  const stmt = db.prepare(
    `INSERT OR IGNORE INTO posts
     (slug, title, excerpt, content, tag, cover_url, seo_title, seo_description, published)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  for (const p of posts) {
    stmt.run(
      slugify(p.title),
      p.title,
      p.excerpt,
      p.content,
      p.tag,
      p.cover_url,
      p.seo_title,
      p.seo_description,
      p.published
    );
  }

  const caseCount = db.prepare("SELECT count(*) c FROM cases").get().c;
  if (caseCount === 0) {
    const cases = [
      {
        slug: "dockerized-blog-platform",
        title: "Контейнеризация сайта и блога",
        summary: "Разделил фронтенд, API и данные, добавил nginx-прокси, health-checks и повторяемый запуск.",
        problem: "Проект запускался вручную и зависел от локального окружения.",
        solution: "Vite собирается в статические файлы, nginx отдаёт сайт и проксирует API, SQLite хранится в volume.",
        result: "Запуск одной командой, предсказуемый деплой и сохранность данных при пересборке.",
        stack: "React, Vite, Express, SQLite, Docker, nginx",
        metric: "1 command deploy",
        published: 1,
      },
      {
        slug: "secure-admin-blog",
        title: "Админка блога с 2FA",
        summary: "Добавил JWT-авторизацию, TOTP, rate-limit логина, SEO-поля и предпросмотр Markdown.",
        problem: "Публичная админка без защиты быстро становится точкой риска.",
        solution: "Усиленная авторизация, 2FA, строгие пароли, request id и ограничение попыток входа.",
        result: "Админка стала пригодной для реального использования и проще в поддержке.",
        stack: "Express, JWT, bcrypt, TOTP, React",
        metric: "2FA ready",
        published: 1,
      },
    ];
    const caseStmt = db.prepare(
      `INSERT OR IGNORE INTO cases
       (slug, title, summary, problem, solution, result, stack, metric, published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const item of cases) {
      caseStmt.run(item.slug, item.title, item.summary, item.problem, item.solution, item.result, item.stack, item.metric, item.published);
    }
    console.log("seeded", cases.length, "cases");
  }

  db.exec("PRAGMA wal_checkpoint(FULL);");
  console.log("seeded", posts.length, "posts");
})();
