export const metadata = {
  title: "MyLink Demo + SmartBot",
  description: "Учебный демо-портал вакансий с виджетом SmartBot"
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body className="min-h-screen bg-slate-100 text-slate-900">
        {children}
      </body>
    </html>
  );
}
