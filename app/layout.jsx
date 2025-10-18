export const metadata = {
  title: "JobBoard Demo",
  description: "Отдельный сайт в стиле mylink с виджетом SmartBot"
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">
            <div className="font-semibold">JobBoard</div>
            <div className="ml-auto flex items-center gap-2 text-sm text-slate-600">
              <a className="hover:text-slate-900" href="#">Вакансии</a>
              <a className="hover:text-slate-900" href="#">Компании</a>
              <a className="hover:text-slate-900" href="#">Войти</a>
            </div>
          </div>
        </header>
        <main className="max-w-6xl mx-auto p-4">{children}</main>
        <div id="smartbot-root" /> {/* контейнер для виджета */}
      </body>
    </html>
  );
}
