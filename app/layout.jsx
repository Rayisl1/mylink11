export const metadata = {
  title: "JobBoard — Вакансии и SmartBot",
  description: "Демо сайта с откликами кандидатов и SmartBot-скринингом",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <head>
        {/* Подключаем шрифт Inter */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
