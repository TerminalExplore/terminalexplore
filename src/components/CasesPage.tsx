import { useEffect, useState } from "react";
import { api } from "../api";
import type { CaseStudy } from "../types";

const fallbackCases: CaseStudy[] = [
  {
    id: 1,
    slug: "dockerized-blog-platform",
    title: "Контейнеризация сайта и блога",
    summary: "Разделил фронтенд, API и данные, добавил nginx-прокси, health-checks и повторяемый запуск.",
    problem: "Проект запускался вручную и зависел от локального окружения.",
    solution: "Vite собирается в статические файлы, nginx отдаёт сайт и проксирует API, SQLite хранится в volume.",
    result: "Запуск одной командой, предсказуемый деплой и сохранность данных при пересборке.",
    stack: "React, Vite, Express, SQLite, Docker, nginx",
    metric: "1 command deploy",
    published: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    slug: "secure-admin-blog",
    title: "Админка блога с 2FA",
    summary: "Добавил JWT-авторизацию, TOTP, rate-limit логина, SEO-поля и предпросмотр Markdown.",
    problem: "Публичная админка без защиты быстро становится точкой риска.",
    solution: "Усиленная авторизация, 2FA, строгие пароли, request id и ограничение попыток входа.",
    result: "Админка стала пригодной для реального использования и проще в поддержке.",
    stack: "Express, JWT, bcrypt, TOTP, React",
    metric: "2FA ready",
    published: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export default function CasesPage() {
  const [cases, setCases] = useState<CaseStudy[]>(fallbackCases);

  useEffect(() => {
    api.getCases().then((rows) => {
      if (rows.length) setCases(rows);
    }).catch(() => {});
  }, []);

  return (
    <section className="cases-page">
      <div className="container">
        <header className="cases-header">
          <span className="tag-mono">cases</span>
          <h1>Проекты, доведённые до запуска</h1>
          <p>Короткие разборы задач: что было, что изменилось и какой результат получил проект.</p>
        </header>
        <div className="cases-grid">
          {cases.map((item) => (
            <article className="case-card" key={item.id}>
              <div className="case-card-top">
                <span className="blog-tag">{item.metric || "case"}</span>
                <span className="mono dim-sm">{item.stack}</span>
              </div>
              <h2>{item.title}</h2>
              <p>{item.summary}</p>
              <div className="case-columns">
                <div>
                  <h3>Проблема</h3>
                  <p>{item.problem}</p>
                </div>
                <div>
                  <h3>Решение</h3>
                  <p>{item.solution}</p>
                </div>
                <div>
                  <h3>Результат</h3>
                  <p>{item.result}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
